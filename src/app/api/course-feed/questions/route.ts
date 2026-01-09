/* COURSE FEED QUESTIONS API - COMMENTED OUT
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/client-simple";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  addDoc,
  runTransaction
} from "firebase/firestore";
import { z } from "zod";

// Input validation schema
const questionSchema = z.object({
  courseId: z.string().min(1),
  text: z.string().min(1).max(5000),
  userId: z.string().min(1),
  userName: z.string().optional(),
  topic: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  imageUrl: z.string().optional(),
});

// GET - Fetch questions for a course
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    // Get questions from courseFeeds collection
    const courseFeedRef = collection(db, "courseFeeds");
    
    // Try query with orderBy first, then fallback
    let querySnapshot;
    try {
      const q = query(
        courseFeedRef,
        where("courseId", "==", courseId),
        orderBy("updatedAt", "desc"),
        limit(50)
      );
      querySnapshot = await getDocs(q);
    } catch (error: any) {
      console.warn("Ordered query failed (likely missing index), falling back to unordered:", error.message);
      const qSimple = query(
        courseFeedRef,
        where("courseId", "==", courseId),
        limit(50)
      );
      querySnapshot = await getDocs(qSimple);
    }
    
    if (querySnapshot.empty) {
      return NextResponse.json({ questions: [] });
    }

    const feedDoc = querySnapshot.docs[0];
    const feedData = feedDoc.data();
    const questions = feedData.questions || [];

    // Sort questions by createdAt if not already sorted
    const sortedQuestions = questions.sort((a: any, b: any) => {
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return NextResponse.json({ questions: sortedQuestions });
  } catch (error: any) {
    console.error("Error fetching questions:", error);
    
    if (error.message?.includes('permission') || error.code === 'permission-denied') {
      return NextResponse.json(
        { 
          error: "Permission denied. Please ensure your Firestore Rules allow read access to 'courseFeeds'.",
          details: error.message 
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch questions", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new question
export async function POST(req: NextRequest) {
  try {
    // 1. Validate Input
    const body = await req.json();
    const result = questionSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const { courseId, text, userId, userName, topic, isAnonymous, imageUrl } = result.data;

    // 2. Check if db is initialized
    if (!db) {
      console.error("Firebase db not initialized in questions POST route");
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // 3. Create question object
    const question = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      topic: topic ? topic.trim() : "General",
      isAnonymous: !!isAnonymous,
      imageUrl: imageUrl || "",
      authorId: userId,
      authorName: userName || "Anonymous",
      upvotes: [],
      humanReplies: [],
      createdAt: Date.now(),
    };

    // 4. Perform Atomic Transaction
    const resultData = await runTransaction(db, async (transaction) => {
      // Find the feed document
      const courseFeedRef = collection(db, "courseFeeds");
      const q = query(courseFeedRef, where("courseId", "==", courseId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // If feed doesn't exist, we'll create it outside the transaction or as a separate step
        // However, for consistency, we can just return a signal to create it
        return { shouldCreate: true };
      }

      const feedDocRef = querySnapshot.docs[0].ref;
      const feedSnap = await transaction.get(feedDocRef);
      
      if (!feedSnap.exists()) {
        return { shouldCreate: true };
      }

      const feedData = feedSnap.data();
      const existingQuestions = Array.isArray(feedData.questions) ? feedData.questions : [];
      const updatedQuestions = [question, ...existingQuestions];
      
      const memberIds = Array.isArray(feedData.memberIds) ? feedData.memberIds : [];
      if (!memberIds.includes(userId)) {
        memberIds.push(userId);
      }
      
      transaction.update(feedDocRef, {
        questions: updatedQuestions,
        memberIds,
        memberCount: memberIds.length,
        updatedAt: Date.now(),
      });

      return { shouldCreate: false };
    });

    // 5. Handle initial creation if needed
    if (resultData.shouldCreate) {
      const courseFeedRef = collection(db, "courseFeeds");
      const newFeed = {
        courseId,
        questions: [question],
        memberIds: [userId],
        memberCount: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const docRef = await addDoc(courseFeedRef, newFeed);
      return NextResponse.json({ 
        question,
        feedId: docRef.id 
      });
    }

    return NextResponse.json({ question });

  } catch (error: any) {
    console.error("Error creating question via transaction:", error);
    return NextResponse.json(
      { error: "Failed to create question", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a question (only by author)
const deleteQuestionSchema = z.object({
  courseId: z.string().min(1),
  questionId: z.string().min(1),
  userId: z.string().min(1),
});

export async function DELETE(req: NextRequest) {
  try {
    // 1. Validate Input
    const body = await req.json();
    const result = deleteQuestionSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const { courseId, questionId, userId } = result.data;

    // 2. Check if db is initialized
    if (!db) {
      console.error("Firebase db not initialized in questions DELETE route");
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // 3. Perform Atomic Transaction
    await runTransaction(db, async (transaction) => {
      // Find the feed document
      const courseFeedRef = collection(db, "courseFeeds");
      const q = query(courseFeedRef, where("courseId", "==", courseId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error("Course feed not found");
      }

      const feedDocRef = querySnapshot.docs[0].ref;
      const feedSnap = await transaction.get(feedDocRef);
      
      if (!feedSnap.exists()) {
        throw new Error("Course feed document does not exist");
      }

      const feedData = feedSnap.data();
      const questions = Array.isArray(feedData.questions) ? feedData.questions : [];
      
      // Find the question and verify ownership
      const questionIndex = questions.findIndex((q: any) => q.id === questionId);
      
      if (questionIndex === -1) {
        throw new Error("Question not found");
      }

      const question = questions[questionIndex];
      
      // Verify the user is the author
      if (question.authorId !== userId) {
        throw new Error("You can only delete your own questions");
      }

      // Remove the question from the array
      const updatedQuestions = questions.filter((q: any) => q.id !== questionId);
      
      transaction.update(feedDocRef, {
        questions: updatedQuestions,
        updatedAt: Date.now(),
      });
    });

    return NextResponse.json({ success: true, message: "Question deleted" });
  } catch (error: any) {
    console.error("Error deleting question via transaction:", error);
    
    const status = error.message === "You can only delete your own questions" 
      ? 403 
      : error.message === "Question not found" || error.message === "Course feed not found"
      ? 404
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to delete question", details: error.message },
      { status }
    );
  }
}
END OF COURSE FEED QUESTIONS API - COMMENTED OUT */
