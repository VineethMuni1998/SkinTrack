import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type SkinType = "DRY" | "OILY" | "COMBINATION" | "NORMAL";

const validSkinTypes: SkinType[] = [
  "DRY",
  "OILY",
  "COMBINATION",
  "NORMAL",
];

const computeAge = (dob?: Date | null) => {
  if (!dob) return undefined;
  const now = new Date();
  const birth = new Date(dob);
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : undefined;
};

const parseDateOfBirth = (value: unknown): Date | null => {
  if (typeof value !== "string") return null;
  const digitsOnly = value.replace(/[^\d]/g, "");
  if (digitsOnly.length !== 8) return null;
  const mm = parseInt(digitsOnly.slice(0, 2), 10);
  const dd = parseInt(digitsOnly.slice(2, 4), 10);
  const yyyy = parseInt(digitsOnly.slice(4, 8), 10);
  if (
    Number.isNaN(mm) ||
    Number.isNaN(dd) ||
    Number.isNaN(yyyy) ||
    mm < 1 ||
    mm > 12 ||
    dd < 1 ||
    dd > 31 ||
    yyyy < 1900
  ) {
    return null;
  }
  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (Number.isNaN(date.getTime())) return null;
  // Additional guard to ensure the parts match constructed date
  if (
    date.getUTCFullYear() !== yyyy ||
    date.getUTCMonth() + 1 !== mm ||
    date.getUTCDate() !== dd
  ) {
    return null;
  }
  return date;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      age: true,
      dateOfBirth: true,
      skinType: true,
    },
  });

  const computedAge = computeAge(user?.dateOfBirth);

  return NextResponse.json({
    user: {
      ...user,
      age: computedAge ?? user?.age ?? null,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();

  // Debug logging for production
  console.log("PATCH /api/users/me - Session:", JSON.stringify(session, null, 2));

  if (!session?.user?.id) {
    console.log("PATCH /api/users/me - No user ID in session");
    return NextResponse.json(
      { error: "Session expired. Please log in again." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { age, skinType, name, dateOfBirth } = body;

  const hasSkinType = skinType !== undefined;
  const normalizedSkinType =
    hasSkinType && skinType !== null && typeof skinType === "string"
      ? (skinType.trim().toUpperCase() as SkinType)
      : null;

  let dob: Date | null = null;
  if (dateOfBirth !== undefined) {
    dob = parseDateOfBirth(dateOfBirth);
    if (!dob) {
      return NextResponse.json(
        { error: "Invalid date of birth. Use MM/DD/YYYY." },
        { status: 400 }
      );
    }
  }

  if (age !== undefined && (typeof age !== "number" || age <= 0)) {
    return NextResponse.json(
      { error: "Age must be a positive number" },
      { status: 400 }
    );
  }

  if (hasSkinType && normalizedSkinType && !validSkinTypes.includes(normalizedSkinType)) {
    return NextResponse.json(
      { error: "Invalid skin type" },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(dob ? { dateOfBirth: dob } : {}),
        ...(age !== undefined ? { age } : {}),
        ...(hasSkinType ? { skinType: normalizedSkinType ?? null } : {}),
        ...(name !== undefined ? { name } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        dateOfBirth: true,
        skinType: true,
      },
    });

    const computedAge = computeAge(updated.dateOfBirth);

    return NextResponse.json({
      user: {
        ...updated,
        age: computedAge ?? updated.age ?? null,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile. Please try again." },
      { status: 500 }
    );
  }
}
