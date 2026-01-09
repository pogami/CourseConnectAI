/* COURSE FEED API - COMMENTED OUT
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/client-simple";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  runTransaction
} from "firebase/firestore";
import { z } from "zod";

// Input validation schema
const replySchema = z.object({
  courseId: z.string().min(1),
  questionId: z.string().min(1),
  text: z.string().min(1).max(2000),
  userId: z.string().min(1),
  userName: z.string().optional(),
  imageUrl: z.string().optional(),
});

// POST - Add a human reply to a question
export async function POST(req: NextRequest) {
  try {
    // 1. Validate Input
    const body = await req.json();
    const result = replySchema.safeParse(body);
    
    if (!result.success) {
      console.error("Reply validation failed:", result.error.format());
      return NextResponse.json({ 
        error: "Invalid input", 
        details: result.error.format(),
        message: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      }, { status: 400 });
    }

    const { courseId, questionId, text, userId, userName, imageUrl } = result.data;

    // 2. Check if db is initialized
    if (!db) {
      console.error("Firebase db not initialized in reply route");
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // 3. Perform Atomic Transaction
    const newReply = await runTransaction(db, async (transaction) => {
      // Find the feed document
      const courseFeedRef = collection(db, "courseFeeds");
      const q = query(courseFeedRef, where("courseId", "==", courseId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error("Course feed not found");
      }

      const feedDocRef = querySnapshot.docs[0].ref;
      // Get fresh data inside transaction
      const feedSnap = await transaction.get(feedDocRef);
      
      if (!feedSnap.exists()) {
        throw new Error("Course feed document does not exist");
      }

      const feedData = feedSnap.data();
      const questions = feedData.questions || [];
      const questionIndex = questions.findIndex((q: any) => q.id === questionId);

      if (questionIndex === -1) {
        throw new Error("Question not found in feed");
      }

      // Create the new reply object (FLAT structure, no parentId)
      const reply = {
        id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: text.trim(),
        authorId: userId,
        authorName: userName || "Anonymous",
        imageUrl: imageUrl || "",
        createdAt: Date.now(),
        upvotes: [],
      };

      // Create updated questions array
      const updatedQuestions = [...questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        humanReplies: [...(updatedQuestions[questionIndex].humanReplies || []), reply]
      };

      // Perform the update
      transaction.update(feedDocRef, {
        questions: updatedQuestions,
        updatedAt: Date.now(),
      });

      return reply;
    });

    // 4. Return success
    return NextResponse.json({ reply: newReply });

  } catch (error: any) {
    console.error("Error adding reply via transaction:", error);
    
    const status = (error.message === "Course feed not found" || error.message === "Question not found in feed") 
      ? 404 
      : 500;

    return NextResponse.json(
      { error: "Failed to add reply", details: error.message },
      { status }
    );
  }
}
END OF COURSE FEED REPLY API - COMMENTED OUT */
