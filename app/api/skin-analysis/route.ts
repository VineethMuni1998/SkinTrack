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
        // Handle specific Perfect Corp API errors based on error codes
        switch (error.code) {
          case 'error_no_face':
            return NextResponse.json(
              {
                error: "No face detected in the image. Please ensure your face is clearly visible and centered.",
                errorCode: error.code
              },
              { status: 422 }
            );

          case 'error_src_face_too_small':
            return NextResponse.json(
              {
                error: "Your face is too small in the image. Please move closer to the camera or zoom in. The face should occupy 60-80% of the image width.",
                errorCode: error.code
              },
              { status: 422 }
            );

          case 'error_src_face_out_of_bound':
            return NextResponse.json(
              {
                error: "Your face is out of bounds. Please center your face within the oval guide and ensure it's fully visible.",
                errorCode: error.code
              },
              { status: 422 }
            );

          case 'error_below_min_image_size':
            return NextResponse.json(
              {
                error: "Image resolution is too low. Please use a higher quality camera or upload a larger image.",
                errorCode: error.code
              },
              { status: 422 }
            );

          case 'error_exceed_max_image_size':
            return NextResponse.json(
              {
                error: "Image resolution is too high. Please resize the image or use a lower resolution setting.",
                errorCode: error.code
              },
              { status: 422 }
            );

          case 'error_lighting_dark':
            return NextResponse.json(
              {
                error: "The lighting is too dark. Please move to a well-lit area with bright, evenly distributed lighting.",
                errorCode: error.code
              },
              { status: 422 }
            );

          case 'error_nsfw_content_detected':
            return NextResponse.json(
              {
                error: "Unable to analyze this image. Please try again with a clear face photo.",
                errorCode: error.code
              },
              { status: 451 }
            );

          case 'exceed_max_filesize':
            return NextResponse.json(
              {
                error: "Image file exceeds the maximum allowed size of 10MB.",
                errorCode: error.code
              },
              { status: 413 }
            );

          default:
            // Check for rate limiting by status code
            if (error.statusCode === 429) {
              return NextResponse.json(
                {
                  error: "Rate limit exceeded. Please try again in a few minutes.",
                  errorCode: 'rate_limit_exceeded'
                },
                { status: 429 }
              );
            }

            // Generic Perfect Corp error
            return NextResponse.json(
              {
                error: error.message || "Skin analysis failed. Please try again.",
                errorCode: error.code
              },
              { status: 500 }
            );
        }
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
