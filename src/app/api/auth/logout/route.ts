import { getSessionToken, deleteSession, clearSessionCookie } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const token = await getSessionToken();
    
    if (token) {
      await deleteSession(token);
    }
    
    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Logout error:", error);
    // Still clear cookie even if db delete fails
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  }
}
