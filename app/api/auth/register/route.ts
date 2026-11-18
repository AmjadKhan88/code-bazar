import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = body.role === "CREATOR" ? "CREATOR" : "BUYER";

    if (!name || !email || password.length < 8) {
      return NextResponse.json(
        { error: "Name, valid email, and password (8+ chars) are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email }).select("_id").lean();
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const user = await User.create({
      name,
      email,
      passwordHash: hashPassword(password),
      role,
    });

    return NextResponse.json(
      {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Unable to create account." },
      { status: 500 }
    );
  }
}
