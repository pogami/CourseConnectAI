
'use server';

/**
 * @fileOverview An AI flow for generating flashcards from a given text context.
 *
 * - generateFlashcards - A function that takes a text block and returns a set of flashcards.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 * - Flashcard - The schema for a single flashcard.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateFlashcardsInputSchema, GenerateFlashcardsOutputSchema, GenerateFlashcardsInput, GenerateFlashcardsOutput } from '@/ai/schemas/flashcard-schemas';

export { type GenerateFlashcardsInput, type GenerateFlashcardsOutput, type Flashcard } from '@/ai/schemas/flashcard-schemas';


export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an expert educational content creator specializing in creating high-quality study flashcards for college students. Your task is to generate flashcards that help students truly understand and retain course material, not just memorize facts.

  **CRITICAL QUALITY STANDARDS:**
  
  1. **Question Quality:**
     - Questions should test UNDERSTANDING, not just recall
     - Use "why", "how", "what causes", "explain", "compare", "analyze" when appropriate
     - Avoid trivial questions that only test memorization
     - Each question should focus on a key concept that builds foundational knowledge
     - Questions should be clear, specific, and unambiguous
  
  2. **Answer Quality:**
     - Answers must be ACCURATE and FACTUALLY CORRECT based on the provided context
     - Answers should be COMPLETE enough to fully address the question
     - Include logical reasoning and explanations when relevant
     - For "why" questions, explain the cause-and-effect relationship
     - For "how" questions, provide step-by-step reasoning or processes
     - Answers should make sense in context and help students build connections
  
  3. **Educational Value:**
     - Prioritize concepts that are fundamental to the course
     - Focus on topics that appear frequently in the chat history or syllabus
     - Create flashcards that help students connect related concepts
     - Ensure questions build on each other logically when possible
  
  4. **Formatting Rules:**
     - For mathematical expressions, equations, formulas, or any math content, wrap them in LaTeX delimiters:
       - Use $...$ for inline math (e.g., $x^2 + y^2 = r^2$)
       - Use $$...$$ for block math/equations (e.g., $$\\frac{d}{dx}[x^2] = 2x$$)
     - Include proper LaTeX syntax for fractions, exponents, integrals, Greek letters, etc.
     - Examples: $\\frac{a}{b}$, $x^2$, $\\sqrt{x}$, $\\int_0^1 f(x)dx$, $\\alpha$, $\\beta$, $\\pi$

  {{#if className}}
  **Course Context:** The flashcards are for **{{className}}**. Use course-specific terminology and concepts.
  {{/if}}

  {{#if syllabusData}}
  **Course Syllabus Information:**
  {{{syllabusData}}}
  
  Use this syllabus data to ensure flashcards align with course topics, assignments, and learning objectives. Prioritize concepts that are explicitly mentioned in the syllabus.
  {{/if}}

  {{#if chatHistory}}
  **Chat History Analysis:**
  Here is the conversation history from this class. Analyze the questions students asked and the answers provided to identify:
  - Key concepts students are struggling with
  - Important topics that were discussed multiple times
  - Concepts that need reinforcement
  - Areas where students showed confusion
  
  ---
  {{{chatHistory}}}
  ---
  {{/if}}

  {{#if topic}}
  **Specific Topic Focus:** Generate flashcards for **{{topic}}**. Ensure comprehensive coverage of this topic.
  {{/if}}

  {{#if context}}
  **Additional Context:**
  ---
  {{{context}}}
  ---
  {{/if}}

  **Generation Instructions:**
  - Generate between 5 and 15 flashcards (aim for 8-12 for optimal study sessions)
  - Each flashcard must have a clear, well-structured question and a complete, accurate answer
  - Verify that each answer logically and correctly addresses its question
  - Ensure answers are based on the provided context and are factually accurate
  - Use LaTeX formatting for any mathematical content
  - Prioritize flashcards that will help students understand core concepts and their relationships
  
  **Quality Check Before Generating:**
  - Is this question testing understanding or just memorization?
  - Is the answer accurate based on the provided context?
  - Does the answer provide enough information to fully understand the concept?
  - Would this flashcard help a student succeed in this course?
  - Is there logical reasoning connecting the question to the answer?`,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
