import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const email =
      typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password =
      typeof body?.password === "string" ? body.password : undefined;

    if (!email || !token || !password) {
      return NextResponse.json(
        { error: "Email, token, and new password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: hashedToken,
        expires: { gte: new Date() },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Unable to reset password for this account." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    return NextResponse.json({
      message: "Password reset successful. You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to reset password right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
