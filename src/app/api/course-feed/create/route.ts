/* COURSE FEED CREATE API - COMMENTED OUT
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/client-simple";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs
} from "firebase/firestore";

// POST - Create a course feed (called when syllabus is uploaded)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseId, courseCode, courseName, syllabusData, userId } = body;

    if (!courseId || !userId) {
      return NextResponse.json(
        { error: "courseId and userId are required" },
        { status: 400 }
      );
    }

    // Check if feed already exists
    const courseFeedRef = collection(db, "courseFeeds");
    const q = query(
      courseFeedRef,
      where("courseId", "==", courseId)
    );

    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Feed already exists
      return NextResponse.json({ 
        success: true,
        message: "Course feed already exists",
        feedId: querySnapshot.docs[0].id
      });
    }

    // Create new feed
    const newFeed = {
      courseId,
      courseCode: courseCode || "",
      courseName: courseName || "",
      questions: [],
      memberIds: [userId],
      memberCount: 1,
      syllabusData: syllabusData || {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const docRef = await addDoc(courseFeedRef, newFeed);
    
    return NextResponse.json({ 
      success: true,
      feedId: docRef.id,
      message: "Course feed created successfully"
    });
  } catch (error: any) {
    console.error("Error creating course feed:", error);
    return NextResponse.json(
      { error: "Failed to create course feed", details: error.message },
      { status: 500 }
    );
  }
}
END OF COURSE FEED CREATE API - COMMENTED OUT */

