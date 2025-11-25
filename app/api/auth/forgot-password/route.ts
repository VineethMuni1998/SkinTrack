import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email =
      typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({
        message:
          "If an account exists for that email, you'll receive a reset link shortly.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const baseUrl =
      (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL)?.replace(
        /\/$/,
        ""
      ) || "http://localhost:3000";

    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(
      email
    )}`;

    await sendPasswordResetEmail({
      to: email,
      resetUrl,
    });

    return NextResponse.json({
      message:
        "If an account exists for that email, you'll receive a reset link shortly.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to send password reset email. Please try again.",
      },
      { status: 500 }
    );
  }
}
