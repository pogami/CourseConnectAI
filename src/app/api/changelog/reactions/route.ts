import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const updateId = req.nextUrl.searchParams.get("updateId");
    const type = req.nextUrl.searchParams.get("type");

    if (!updateId || !type) {
      return NextResponse.json({ error: "Missing updateId or type" }, { status: 400 });
    }

    const id = `${updateId}-${type}`;

    if (!db || typeof db.collection !== "function") {
      // In local/mock environment, just return 0 so UI still works
      return NextResponse.json({ count: 0 });
    }

    const docRef = db.collection("changelog_reactions").doc(id);
    const snap = await docRef.get();

    return NextResponse.json({ count: snap.exists ? snap.data().count || 0 : 0 });
  } catch (error: any) {
    console.error("Error fetching changelog reaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch reaction count" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { updateId, type, delta } = body || {};

    if (!updateId || !type || typeof delta !== "number") {
      return NextResponse.json({ error: "Missing updateId, type, or delta" }, { status: 400 });
    }

    const id = `${updateId}-${type}`;

    if (!db || typeof db.collection !== "function") {
      // Mock environment: just echo back a fake count
      return NextResponse.json({ count: Math.max(0, delta) });
    }

    const docRef = db.collection("changelog_reactions").doc(id);
    const snap = await docRef.get();
    const current = snap.exists ? snap.data().count || 0 : 0;
    const next = Math.max(0, current + delta);

    await docRef.set({ count: next }, { merge: true });

    return NextResponse.json({ count: next });
  } catch (error: any) {
    console.error("Error updating changelog reaction:", error);
    return NextResponse.json(
      { error: "Failed to update reaction" },
      { status: 500 }
    );
  }
}


