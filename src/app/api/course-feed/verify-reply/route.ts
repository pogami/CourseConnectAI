/* COURSE FEED VERIFY REPLY API - COMMENTED OUT
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

const verifySchema = z.object({
  courseId: z.string().min(1),
  questionId: z.string().min(1),
  replyId: z.string().nullable(), // Null to unverify
  userId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = verifySchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const { courseId, questionId, replyId, userId } = result.data;

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    await runTransaction(db, async (transaction) => {
      const courseFeedRef = collection(db, "courseFeeds");
      const q = query(courseFeedRef, where("courseId", "==", courseId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) throw new Error("Course feed not found");

      const feedDocRef = querySnapshot.docs[0].ref;
      const feedSnap = await transaction.get(feedDocRef);
      
      if (!feedSnap.exists()) throw new Error("Course feed document does not exist");

      const feedData = feedSnap.data();
      const questions = feedData.questions || [];
      const questionIndex = questions.findIndex((q: any) => q.id === questionId);

      if (questionIndex === -1) throw new Error("Question not found");
      
      // Authorization
      if (questions[questionIndex].authorId !== userId) {
        throw new Error("Unauthorized: Only the OP can verify answers.");
      }

      const updatedQuestions = [...questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        verifiedReplyId: replyId
      };

      transaction.update(feedDocRef, {
        questions: updatedQuestions,
        updatedAt: Date.now(),
      });
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error verifying reply:", error);
    return NextResponse.json(
      { error: "Failed to verify reply", details: error.message },
      { status: error.message.includes("Unauthorized") ? 403 : 500 }
    );
  }
}
END OF COURSE FEED VERIFY REPLY API - COMMENTED OUT */

