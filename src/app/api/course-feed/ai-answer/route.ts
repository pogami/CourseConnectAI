import { NextRequest, NextResponse } from "next/server";

// This endpoint is currently disabled
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: "This endpoint is not currently available" },
    { status: 501 }
  );
}
