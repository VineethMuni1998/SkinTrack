import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";
import { analyzeSkinImage, PerfectCorpAPIError } from "@/lib/perfectcorp";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (Perfect Corp limit)

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("imageFile") as File;
    const saveToProfile = formData.get("saveToProfile") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (Perfect Corp limit: 10MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image file is too large. Maximum size is 10MB." },
        { status: 413 }
      );
    }

    // Upload to Cloudinary
    console.log('Uploading image to Cloudinary...');
    const imageUrl = await uploadImage(file);
    console.log('Cloudinary upload successful:', imageUrl);

    // Analyze with Perfect Corp API
    console.log('Starting Perfect Corp skin analysis...');
    let analysisResult;
    try {
      analysisResult = await analyzeSkinImage(imageUrl);
      console.log('Perfect Corp analysis successful');
    } catch (error) {
      console.error('Perfect Corp analysis failed:', error);
      if (error instanceof PerfectCorpAPIError) {
        // Handle specific Perfect Corp API errors
        if (error.code === 'error_no_face') {
          return NextResponse.json(
            { error: "No face detected in the image. Please ensure your face is clearly visible and centered." },
            { status: 422 }
          );
        }
        if (error.code === 'error_nsfw_content_detected') {
          return NextResponse.json(
            { error: "Unable to analyze this image. Please try again with a clear face photo." },
            { status: 451 }
          );
        }
        if (error.code === 'exceed_max_filesize') {
          return NextResponse.json(
            { error: "Image file exceeds the maximum allowed size." },
            { status: 413 }
          );
        }
        if (error.statusCode === 429) {
          return NextResponse.json(
            { error: "Rate limit exceeded. Please try again in a few minutes." },
            { status: 429 }
          );
        }
        // Generic Perfect Corp error
        return NextResponse.json(
          { error: error.message || "Skin analysis failed. Please try again." },
          { status: 500 }
        );
      }
      // Unknown error
      throw error;
    }

    // Save analysis to database
    const skinAnalysis = await prisma.skinAnalysis.create({
      data: {
        userId: session.user.id,
        imageUrl,
        detectedSkinType: analysisResult.skinType !== 'UNKNOWN' ? analysisResult.skinType : null,
        confidence: analysisResult.confidence,
        wrinkles: analysisResult.concerns.wrinkles,
        spots: analysisResult.concerns.spots,
        redness: analysisResult.concerns.redness,
        acne: analysisResult.concerns.acne,
        oiliness: analysisResult.concerns.oiliness,
        darkCircles: analysisResult.concerns.darkCircles,
        texture: analysisResult.concerns.texture,
        moisture: analysisResult.concerns.moisture,
        rawApiResponse: analysisResult.rawResponse,
        apiVersion: 'v2.0',
        usedForOnboarding: false,
      },
    });

    // Optionally update user's skin type
    if (saveToProfile && analysisResult.skinType !== 'UNKNOWN') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { skinType: analysisResult.skinType },
      });
    }

    return NextResponse.json(
      {
        analysis: {
          id: skinAnalysis.id,
          skinType: analysisResult.skinType,
          confidence: analysisResult.confidence,
          concerns: analysisResult.concerns,
          imageUrl: skinAnalysis.imageUrl,
          analysisDate: skinAnalysis.analysisDate,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Skin analysis error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
