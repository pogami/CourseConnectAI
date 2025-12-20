
import {z} from 'genkit';

export const FlashcardSchema = z.object({
    question: z.string().describe('The question or front side of the flashcard. This should be a concise query about a key concept.'),
    answer: z.string().describe('The answer or back side of the flashcard. This should be a clear and complete answer to the question.'),
});
export type Flashcard = z.infer<typeof FlashcardSchema>;


export const GenerateFlashcardsInputSchema = z.object({
  className: z.string().optional().describe("The name of the class to generate flashcards for."),
  chatHistory: z.string().optional().describe("The chat history from the class, with questions and answers."),
  syllabusData: z.string().optional().describe("Course syllabus information including topics, assignments, and learning objectives."),
  topic: z.string().optional().describe("A specific topic to generate flashcards about."),
  context: z
    .string()
    .optional()
    .describe(
      "A block of text, such as lecture notes or a chapter summary, from which to generate flashcards."
    ),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

export const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe('An array of generated flashcards.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;
