/* COURSE FEED UPVOTE API - COMMENTED OUT
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/client-simple";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
  runTransaction
} from "firebase/firestore";
import { z } from "zod";

// Input validation schema
const voteSchema = z.object({
  courseId: z.string().min(1),
  questionId: z.string().min(1),
  replyId: z.string().optional(),
  userId: z.string().min(1),
  voteType: z.enum(["up", "down", "none"]),
});

// POST - Vote or remove vote from a question or reply
export async function POST(req: NextRequest) {
  try {
    // 1. Validate Input
    const body = await req.json();
    const result = voteSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const { courseId, questionId, replyId, userId, voteType } = result.data;

    // 2. Check if db is initialized
    if (!db) {
      console.error("Firebase db not initialized in vote route");
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // 3. Perform Atomic Transaction
    const voteResult = await runTransaction(db, async (transaction) => {
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
      const questions = feedData.questions || [];
      const questionIndex = questions.findIndex((q: any) => q.id === questionId);

      if (questionIndex === -1) {
        throw new Error("Question not found in feed");
      }

      // Create updated questions array
      const updatedQuestions = [...questions];
      const targetQuestion = updatedQuestions[questionIndex];

      const updateVoteArrays = (target: any) => {
        let upvotes = target.upvotes || [];
        let downvotes = target.downvotes || [];

        // Remove user from both first
        upvotes = upvotes.filter((id: string) => id !== userId);
        downvotes = downvotes.filter((id: string) => id !== userId);

        if (voteType === "up") {
          upvotes.push(userId);
        } else if (voteType === "down") {
          downvotes.push(userId);
        }
        // If "none", they remain removed from both

        return { upvotes, downvotes };
      };

      if (replyId) {
        // Handle reply vote
        const replies = targetQuestion.humanReplies || [];
        const replyIndex = replies.findIndex((r: any) => r.id === replyId);
        
        if (replyIndex === -1) {
          throw new Error("Reply not found in question");
        }
        
        const reply = replies[replyIndex];
        const { upvotes, downvotes } = updateVoteArrays(reply);
        
        const updatedReplies = [...replies];
        updatedReplies[replyIndex] = { ...reply, upvotes, downvotes };
        updatedQuestions[questionIndex] = { ...targetQuestion, humanReplies: updatedReplies };
        
        transaction.update(feedDocRef, {
          questions: updatedQuestions,
          updatedAt: Date.now(),
        });

        return { upvotes, downvotes, upvoteCount: upvotes.length, downvoteCount: downvotes.length };
      } else {
        // Handle question vote
        const { upvotes, downvotes } = updateVoteArrays(targetQuestion);

        updatedQuestions[questionIndex] = {
          ...targetQuestion,
          upvotes,
          downvotes
        };

        transaction.update(feedDocRef, {
          questions: updatedQuestions,
          updatedAt: Date.now(),
        });

        return { upvotes, downvotes, upvoteCount: upvotes.length, downvoteCount: downvotes.length };
      }
    });

    // 4. Return success
    return NextResponse.json(voteResult);

  } catch (error: any) {
    console.error("Error updating vote via transaction:", error);
    
    const status = (error.message === "Course feed not found" || error.message === "Question not found in feed") 
      ? 404 
      : 500;

    return NextResponse.json(
      { error: "Failed to update vote", details: error.message },
      { status }
    );
  }
}
END OF COURSE FEED UPVOTE API - COMMENTED OUT */
