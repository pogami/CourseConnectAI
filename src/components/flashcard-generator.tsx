
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, Loader2, Bot, GraduationCap, BookUser, PencilLine, BrainCircuit, Save, TrendingUp, Target } from "lucide-react";
import { toast } from "sonner";
// Removed direct import of generateFlashcards - now using API route
import { Flashcard } from "@/ai/schemas/flashcard-schemas";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useChatStore, Chat } from "@/hooks/use-chat-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/client-simple";
import { addDoc, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { LatexMathRenderer } from "@/components/latex-math-renderer";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client-simple";

export default function FlashcardGenerator() {
    const { chats } = useChatStore();
    const router = useRouter();
    const [user] = useAuthState(auth);
    const [topic, setTopic] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentCard, setCurrentCard] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [studyStats, setStudyStats] = useState({ correct: 0, total: 0 });
    const [isQuizMode, setIsQuizMode] = useState(false);
    const [userAnswer, setUserAnswer] = useState("");
    const [showAnswer, setShowAnswer] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [hasSeenAnswer, setHasSeenAnswer] = useState(false); // Track if user has seen the answer
    const [quizResults, setQuizResults] = useState<any[]>([]); // Store quiz results for summary
    const [showQuizSummary, setShowQuizSummary] = useState(false); // Show quiz summary
    const [quizSummaryCard, setQuizSummaryCard] = useState(0); // Current card in quiz summary
    const [answerType, setAnswerType] = useState<'text' | 'mcq'>('mcq'); // Always use multiple choice
    const [mcqOptions, setMcqOptions] = useState<string[]>([]); // Store MCQ options

    // Function to generate realistic MCQ options - returns immediately with fallback, enhances in background
    const generateOptionsForFlashcard = async (answer: string, question: string = '', enhanceInBackground: boolean = false): Promise<string[]> => {
        // Generate fallback options immediately (synchronous)
        const generateFallbackOptions = (): string[] => {
        const answerLower = answer.toLowerCase().trim();
        const questionLower = question.toLowerCase();
        const options: string[] = [answer]; // Start with correct answer

        // For numeric answers, create realistic variations
        if (!isNaN(parseFloat(answerLower)) && isFinite(parseFloat(answerLower))) {
            const numAnswer = parseFloat(answer);
            const variations = [
                (numAnswer * 0.5).toString(),
                (numAnswer * 1.5).toString(),
                (numAnswer + (numAnswer * 0.1)).toString(),
            ];
            options.push(...variations);
        } else {
            // For text answers, create plausible alternatives
            // Extract key terms from the answer
            const keyTerms = answer.split(/[,\s]+/).filter(term => term.length > 3).slice(0, 3);
            
            // Create variations by modifying key concepts
            if (answerLower.includes('primarily') || answerLower.includes('mainly')) {
                options.push(answer.replace(/primarily|mainly/g, 'occasionally'));
                options.push(answer.replace(/primarily|mainly/g, 'rarely'));
                options.push(answer.replace(/primarily|mainly/g, 'never'));
            } else if (answerLower.includes('all') || answerLower.includes('every')) {
                options.push(answer.replace(/all|every/g, 'some'));
                options.push(answer.replace(/all|every/g, 'most'));
                options.push(answer.replace(/all|every/g, 'few'));
            } else if (answerLower.includes('always')) {
                options.push(answer.replace(/always/g, 'sometimes'));
                options.push(answer.replace(/always/g, 'rarely'));
                options.push(answer.replace(/always/g, 'never'));
                } else {
                    // Generic realistic alternatives
                    const answerLength = answer.length;
                    if (answerLength > 50) {
                        // For long answers, create meaningful variations
                        const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 10);
                        if (sentences.length > 1) {
                            // Use different sentence combinations
                            options.push(sentences[0].trim() + '.');
                            if (sentences.length > 2) {
                                options.push(sentences[sentences.length - 1].trim() + '.');
                                options.push(sentences.slice(1, 3).join(' ').trim() + '.');
                            } else {
                                options.push(sentences[1].trim() + '.');
                                // Create a variation by changing key terms
                                const modified = answer
                                    .replace(/\b(can|cannot|must|should)\b/gi, 'cannot')
                                    .replace(/\b(only|always|never)\b/gi, 'sometimes')
                                    .replace(/\b(all|every|any)\b/gi, 'some');
                                if (modified !== answer) {
                                    options.push(modified);
                                } else {
                                    options.push(sentences[0].trim() + ' However, this is not always the case.');
                                }
                            }
                        } else {
                            // Single long sentence - create variations
                            options.push(answer.replace(/\b(can|cannot|must|should)\b/gi, 'cannot'));
                            options.push(answer.replace(/\b(only|always|never)\b/gi, 'sometimes'));
                            options.push(answer.replace(/\b(all|every|any)\b/gi, 'some'));
                        }
                    } else {
                        // For shorter answers, create related but different options
                        options.push(answer.replace(/\b(primary|main|key)\b/gi, 'secondary'));
                        options.push(answer.replace(/\b(first|initial)\b/gi, 'final'));
                        options.push(answer.replace(/\b(high|low|large|small)\b/gi, (match) => {
                            const opposites: Record<string, string> = {
                                'high': 'low', 'low': 'high',
                                'large': 'small', 'small': 'large',
                                'big': 'small', 'small': 'big'
                            };
                            return opposites[match.toLowerCase()] || match;
                        }));
                    }
                }
        }

        // Remove duplicates and ensure we have exactly 4 options
        const uniqueOptions = Array.from(new Set(options));
        
        // Ensure correct answer is always present
        if (!uniqueOptions.includes(answer)) {
            uniqueOptions[0] = answer;
        }
        
        // Fill to 4 options if needed - create better distractors instead of placeholders
        while (uniqueOptions.length < 4) {
            const currentLength = uniqueOptions.length;
            // Create contextually relevant distractors based on the answer
            if (answer.length > 50) {
                // For long answers, create partial or modified versions
                const words = answer.split(/\s+/);
                if (words.length > 10) {
                    uniqueOptions.push(words.slice(0, Math.floor(words.length * 0.6)).join(' ') + '...');
                } else {
                    uniqueOptions.push(answer.replace(/\b(only|always|never|all|every)\b/gi, 'sometimes'));
                }
            } else {
                // For short answers, create related but wrong options
                const variations = [
                    answer.replace(/\b(is|are)\b/gi, 'is not'),
                    answer.replace(/\b(can|will|should)\b/gi, 'cannot'),
                    'None of the above',
                    'All of the above'
                ];
                const newOption = variations[currentLength - 1] || `Related concept: ${answer.substring(0, Math.floor(answer.length / 2))}...`;
                if (!uniqueOptions.includes(newOption)) {
                    uniqueOptions.push(newOption);
                } else {
                    uniqueOptions.push(`Alternative: ${answer}`);
                }
            }
        }
        
        // Take exactly 4 options
        const finalOptions = uniqueOptions.slice(0, 4);
        
        // Shuffle to randomize position of correct answer
        for (let i = finalOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [finalOptions[i], finalOptions[j]] = [finalOptions[j], finalOptions[i]];
        }
        
        return finalOptions;
        };

        // Return fallback options immediately
        const fallbackOptions = generateFallbackOptions();

        // Optionally enhance with API call in background (non-blocking)
        if (enhanceInBackground) {
            fetch('/api/flashcards/generate-options', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question,
                    correctAnswer: answer,
                })
            })
            .then(response => response.ok ? response.json() : null)
            .then(data => {
                if (data?.options && data.options.length >= 4) {
                    // Update options if API call succeeds
                    setMcqOptions(data.options);
                }
            })
            .catch(error => {
                console.error('Error enhancing options:', error);
                // Keep fallback options if API fails
            });
        }

        return fallbackOptions;
    };
    
    // Debug flip state changes
    useEffect(() => {
        console.log('Flip state changed to:', isFlipped);
    }, [isFlipped]);

    // Reset answer type when flashcards change or current card changes
    useEffect(() => {
        if (flashcards.length > 0) {
            setAnswerType('mcq'); // Always use multiple choice
            // Generate MCQ options automatically - show immediately
            const currentFlashcard = flashcards[currentCard];
            if (currentFlashcard) {
                const correctAnswer = currentFlashcard.answer;
                // Generate fallback options immediately (synchronous)
                const generateFallbackOptions = (): string[] => {
                    const answerLower = correctAnswer.toLowerCase().trim();
                    const questionLower = currentFlashcard.question.toLowerCase();
                    const options: string[] = [correctAnswer]; // Start with correct answer

                    // For numeric answers, create realistic variations
                    if (!isNaN(parseFloat(answerLower)) && isFinite(parseFloat(answerLower))) {
                        const numAnswer = parseFloat(correctAnswer);
                        const variations = [
                            (numAnswer * 0.5).toString(),
                            (numAnswer * 1.5).toString(),
                            (numAnswer + (numAnswer * 0.1)).toString(),
                        ];
                        options.push(...variations);
                    } else {
                        // For text answers, create plausible alternatives
                        const keyTerms = correctAnswer.split(/[,\s]+/).filter(term => term.length > 3).slice(0, 3);
                        
                        if (answerLower.includes('primarily') || answerLower.includes('mainly')) {
                            options.push(correctAnswer.replace(/primarily|mainly/g, 'occasionally'));
                            options.push(correctAnswer.replace(/primarily|mainly/g, 'rarely'));
                            options.push(correctAnswer.replace(/primarily|mainly/g, 'never'));
                        } else if (answerLower.includes('all') || answerLower.includes('every')) {
                            options.push(correctAnswer.replace(/all|every/g, 'some'));
                            options.push(correctAnswer.replace(/all|every/g, 'most'));
                            options.push(correctAnswer.replace(/all|every/g, 'few'));
                        } else if (answerLower.includes('always')) {
                            options.push(correctAnswer.replace(/always/g, 'sometimes'));
                            options.push(correctAnswer.replace(/always/g, 'rarely'));
                            options.push(correctAnswer.replace(/always/g, 'never'));
                        } else {
                            const answerLength = correctAnswer.length;
                            if (answerLength > 50) {
                                // For long answers, create meaningful variations
                                const sentences = correctAnswer.split(/[.!?]+/).filter(s => s.trim().length > 10);
                                if (sentences.length > 1) {
                                    // Use different sentence combinations
                                    options.push(sentences[0].trim() + '.');
                                    if (sentences.length > 2) {
                                        options.push(sentences[sentences.length - 1].trim() + '.');
                                        options.push(sentences.slice(1, 3).join(' ').trim() + '.');
                                    } else {
                                        options.push(sentences[1].trim() + '.');
                                        // Create a variation by changing key terms
                                        const modified = correctAnswer
                                            .replace(/\b(can|cannot|must|should)\b/gi, 'cannot')
                                            .replace(/\b(only|always|never)\b/gi, 'sometimes')
                                            .replace(/\b(all|every|any)\b/gi, 'some');
                                        if (modified !== correctAnswer) {
                                            options.push(modified);
                                        } else {
                                            options.push(sentences[0].trim() + ' However, this is not always the case.');
                                        }
                                    }
                                } else {
                                    // Single long sentence - create variations
                                    options.push(correctAnswer.replace(/\b(can|cannot|must|should)\b/gi, 'cannot'));
                                    options.push(correctAnswer.replace(/\b(only|always|never)\b/gi, 'sometimes'));
                                    options.push(correctAnswer.replace(/\b(all|every|any)\b/gi, 'some'));
                                }
                            } else {
                                // For shorter answers, create related but different options
                                options.push(correctAnswer.replace(/\b(primary|main|key)\b/gi, 'secondary'));
                                options.push(correctAnswer.replace(/\b(first|initial)\b/gi, 'final'));
                                options.push(correctAnswer.replace(/\b(high|low|large|small)\b/gi, (match) => {
                                    const opposites: Record<string, string> = {
                                        'high': 'low', 'low': 'high',
                                        'large': 'small', 'small': 'large',
                                        'big': 'small', 'small': 'big'
                                    };
                                    return opposites[match.toLowerCase()] || match;
                                }));
                            }
                        }
                    }

                    // Remove duplicates and ensure we have exactly 4 options
                    const uniqueOptions = Array.from(new Set(options));
                    
                    // Ensure correct answer is always present
                    if (!uniqueOptions.includes(correctAnswer)) {
                        uniqueOptions[0] = correctAnswer;
                    }
                    
                    // Fill to 4 options if needed - create better distractors instead of placeholders
                    while (uniqueOptions.length < 4) {
                        const currentLength = uniqueOptions.length;
                        // Create contextually relevant distractors based on the answer
                        if (correctAnswer.length > 50) {
                            // For long answers, create partial or modified versions
                            const words = correctAnswer.split(/\s+/);
                            if (words.length > 10) {
                                uniqueOptions.push(words.slice(0, Math.floor(words.length * 0.6)).join(' ') + '...');
                            } else {
                                uniqueOptions.push(correctAnswer.replace(/\b(only|always|never|all|every)\b/gi, 'sometimes'));
                            }
                        } else {
                            // For short answers, create related but wrong options
                            const variations = [
                                correctAnswer.replace(/\b(is|are)\b/gi, 'is not'),
                                correctAnswer.replace(/\b(can|will|should)\b/gi, 'cannot'),
                                'None of the above',
                                'All of the above'
                            ];
                            const newOption = variations[currentLength - 1] || `Related concept: ${correctAnswer.substring(0, Math.floor(correctAnswer.length / 2))}...`;
                            if (!uniqueOptions.includes(newOption)) {
                                uniqueOptions.push(newOption);
                            } else {
                                uniqueOptions.push(`Alternative: ${correctAnswer}`);
                            }
                        }
                    }
                    
                    // Take exactly 4 options
                    const finalOptions = uniqueOptions.slice(0, 4);
                    
                    // Shuffle to randomize position of correct answer
                    for (let i = finalOptions.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [finalOptions[i], finalOptions[j]] = [finalOptions[j], finalOptions[i]];
                    }
                    
                    return finalOptions;
                };
                
                // Set fallback options immediately - no delay
                const immediateOptions = generateFallbackOptions();
                setMcqOptions(immediateOptions);
                
                // Enhance with API call in background (non-blocking)
                generateOptionsForFlashcard(correctAnswer, currentFlashcard.question, true)
                    .then(options => {
                        // Only update if we got better options and user hasn't answered yet
                        if (options && options.length === 4 && !showAnswer) {
                            setMcqOptions(options);
                        }
                    })
                    .catch(error => console.error('Error generating options:', error));
            } else {
                setMcqOptions([]);
            }
        }
    }, [flashcards, currentCard, showAnswer]);


    // Function to generate wrong options for MCQ
    const generateWrongOptions = (correctAnswer: string, question: string) => {
        const answerLower = correctAnswer.toLowerCase();
        const questionLower = question.toLowerCase();
        
        // Generate contextually relevant wrong answers
        const wrongOptions: string[] = [];
        
        // For mathematical answers
        if (answerLower.match(/^\d+$/) || answerLower.match(/^\d+\.\d+$/)) {
            const num = parseFloat(answerLower);
            wrongOptions.push(
                (num + 1).toString(),
                (num - 1).toString(),
                (num * 2).toString(),
                (num / 2).toString()
            );
        }
        // For yes/no questions
        else if (answerLower === 'yes' || answerLower === 'no') {
            wrongOptions.push(answerLower === 'yes' ? 'no' : 'yes', 'maybe', 'sometimes');
        }
        // For true/false questions
        else if (answerLower === 'true' || answerLower === 'false') {
            wrongOptions.push(answerLower === 'true' ? 'false' : 'true', 'maybe', 'unknown');
        }
        // For color questions
        else if (questionLower.includes('color') || questionLower.includes('colour')) {
            const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'black', 'white'];
            wrongOptions.push(...colors.filter(c => c !== answerLower).slice(0, 3));
        }
        // For general answers, create variations
        else {
            // Add common wrong answers based on question type
            if (questionLower.includes('what is')) {
                wrongOptions.push('Unknown', 'Not specified', 'Various', 'Multiple');
            } else if (questionLower.includes('who')) {
                wrongOptions.push('Unknown person', 'Various people', 'Not specified', 'Multiple people');
            } else if (questionLower.includes('when')) {
                wrongOptions.push('Unknown time', 'Various times', 'Not specified', 'Multiple times');
            } else if (questionLower.includes('where')) {
                wrongOptions.push('Unknown location', 'Various places', 'Not specified', 'Multiple locations');
            } else {
                wrongOptions.push('Option A', 'Option B', 'Option C', 'Alternative answer');
            }
        }
        
        return wrongOptions.slice(0, 3); // Return max 3 wrong options
    };
    
    const classChats = Object.entries(chats).filter(([key, chat]) => 
        key !== 'general-chat' && 
        key !== 'private-general-chat' && 
        key !== 'private-general-chat-guest' &&
        chat.chatType === 'class'
    );

    // Remove duplicate courses (same course code)
    const uniqueClassChats = classChats.reduce((acc, [id, chat]) => {
        const courseCode = chat.courseData?.courseCode?.toLowerCase();
        if (courseCode) {
            const existingIndex = acc.findIndex(([, existingChat]) => 
                existingChat.courseData?.courseCode?.toLowerCase() === courseCode
            );
            if (existingIndex === -1) {
                acc.push([id, chat]);
            }
        } else {
            acc.push([id, chat]);
        }
        return acc;
    }, [] as [string, Chat][]);


    const handleGenerateFromClass = async (chat: Chat) => {
        setIsGenerating(true);
        setFlashcards([]);
        setCurrentCard(0);
        setIsFlipped(false);
        
        try {
            // Filter out system messages and ensure we have enough messages
            const validMessages = (chat.messages || []).filter(m => 
                m.text && 
                m.text.trim().length > 0 && 
                !m.text.includes('🚧') && 
                !m.text.includes('Welcome to')
            );
            
            if (validMessages.length < 3) {
                toast.info("Not Enough Chat History", {
                    description: "You need at least 3 messages in this chat to generate flashcards. Try chatting more first!",
                    duration: 5000,
                });
                setIsGenerating(false);
                return;
            }
            
            const chatHistory = validMessages
                .map(m => `${m.name || m.sender}: ${m.text}`)
                .join('\n');

            console.log('Generating flashcards for:', chat.name, 'with', validMessages.length, 'messages');

            // Build syllabus data string for better context
            const syllabusDataParts: string[] = [];
            if (chat.courseData?.courseCode) {
                syllabusDataParts.push(`Course Code: ${chat.courseData.courseCode}`);
            }
            if (chat.courseData?.topics && chat.courseData.topics.length > 0) {
                syllabusDataParts.push(`Course Topics: ${chat.courseData.topics.join(', ')}`);
            }
            if (chat.courseData?.assignments && chat.courseData.assignments.length > 0) {
                const assignmentNames = chat.courseData.assignments.map((a: any) => a.name).filter(Boolean);
                if (assignmentNames.length > 0) {
                    syllabusDataParts.push(`Assignments: ${assignmentNames.join(', ')}`);
                }
            }
            if (chat.courseData?.exams && chat.courseData.exams.length > 0) {
                const examNames = chat.courseData.exams.map((e: any) => e.name).filter(Boolean);
                if (examNames.length > 0) {
                    syllabusDataParts.push(`Exams: ${examNames.join(', ')}`);
                }
            }
            const syllabusData = syllabusDataParts.length > 0 ? syllabusDataParts.join('\n') : undefined;

            const response = await fetch('/api/flashcards/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    className: chat.courseData?.courseName || chat.name,
                    chatHistory,
                    syllabusData,
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API call failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('Flashcard generation result:', result);

            if (!result.flashcards || result.flashcards.length === 0) {
                toast.info("Not Enough Context", {
                    description: "There wasn't enough chat history to generate flashcards. Try again after more discussion!",
                    duration: 5000,
                });
            } else {
                setFlashcards(result.flashcards);
                toast.success("Flashcards Generated!", {
                    description: `Created ${result.flashcards.length} flashcards for ${chat.name}.`,
                    duration: 5000,
                });
            }

        } catch (aiError: any) {
            console.error("AI Error:", aiError);
            toast.error("AI Generation Failed", {
                description: aiError.message || "The AI could not generate flashcards. Please try again.",
                duration: 5000,
            });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGenerateFromTopic = async () => {
        if (!topic.trim()) {
            toast({ variant: "destructive", title: "No topic provided", description: "Please enter a topic to generate flashcards." });
            return;
        };

        setIsGenerating(true);
        setFlashcards([]);
        setCurrentCard(0);
        setIsFlipped(false);
        
        try {
            const response = await fetch('/api/flashcards/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic,
                })
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status}`);
            }

            const result = await response.json();
            setFlashcards(result.flashcards);
            toast.success("Flashcards Generated!", {
                description: `Created ${result.flashcards.length} flashcards for you to study.`,
                duration: 5000,
            });
        } catch (aiError) {
            console.error("AI Error:", aiError);
            toast.error("AI Generation Failed", {
                description: "The AI could not generate flashcards. Please try again with a different topic.",
                duration: 5000,
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const saveFlashcardsToFirebase = async (flashcards: Flashcard[], title: string) => {
        if (!user || flashcards.length === 0) return;

        setIsSaving(true);
        try {
            const flashcardSetData = {
                title,
                topic: topic || 'General',
                flashcards: flashcards.map(f => ({
                    front: f.question,
                    back: f.answer
                })),
                userId: user.uid,
                createdAt: new Date().toISOString(),
                studyStats: {
                    totalStudies: 0,
                    correctAnswers: 0,
                    lastStudied: null
                }
            };

            await addDoc(collection(db, 'flashcardSets'), flashcardSetData);
            
            toast.success("Flashcards Saved!", {
                description: "Your flashcard set has been saved to your collection.",
                duration: 5000,
            });

            // Notify parent component of flashcard save event
            window.dispatchEvent(new CustomEvent('flashcard-event', {
                detail: { type: 'flashcards_saved', data: { count: flashcards.length } }
            }));

        } catch (error) {
            console.error('Error saving flashcards:', error);
            toast.error("Save Failed", {
                description: "Could not save flashcards. Please try again.",
                duration: 5000,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const trackStudySession = async (wasCorrect: boolean) => {
        setStudyStats(prev => ({
            correct: prev.correct + (wasCorrect ? 1 : 0),
            total: prev.total + 1
        }));
        
        // Update Firebase study stats for the current flashcard set
        updateFirebaseStudyStats(wasCorrect);
        
        // Save individual study session data
        await saveStudySession(wasCorrect);
    };

    const saveStudySession = async (wasCorrect: boolean) => {
        if (!user || flashcards.length === 0 || currentCard >= flashcards.length) return;
        
        try {
            const currentFlashcard = flashcards[currentCard];
            
            // Try to find the set ID for these flashcards
            let setId = '';
            const cleanTitle = topic || 'Generated Set';
            try {
                const q = query(
                    collection(db, 'flashcardSets'),
                    where('userId', '==', user.uid),
                    where('title', '==', cleanTitle)
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    setId = snap.docs[0].id;
                }
            } catch (e) {
                console.warn('Could not find setId for study session');
            }

            const studySessionData = {
                userId: user.uid,
                flashcardSetId: setId,
                setTitle: cleanTitle, 
                question: currentFlashcard.question,
                userAnswer: userAnswer,
                correctAnswer: currentFlashcard.answer,
                isCorrect: wasCorrect,
                timestamp: new Date().toISOString(),
                difficulty: 'Medium',
                topic: topic || 'General'
            };
            
            console.log('Saving study session:', studySessionData);
            const docRef = await addDoc(collection(db, 'studySessions'), studySessionData);
            console.log('Study session saved with ID:', docRef.id);
        } catch (error) {
            console.error('Error saving study session:', error);
        }
    };

    const updateFirebaseStudyStats = async (wasCorrect: boolean) => {
        if (!user) return;
        
        try {
            // Find the most recent flashcard set for this user
            const q = query(
                collection(db, 'flashcardSets'),
                where('userId', '==', user.uid)
            );
            
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                // Sort by createdAt in JavaScript to avoid Firebase index requirement
                const docs = snapshot.docs.sort((a, b) => 
                    new Date(b.data().createdAt).getTime() - new Date(a.data().createdAt).getTime()
                );
                const doc = docs[0];
                const currentData = doc.data();
                
                await updateDoc(doc.ref, {
                    'studyStats.totalStudies': currentData.studyStats.totalStudies + 1,
                    'studyStats.correctAnswers': currentData.studyStats.correctAnswers + (wasCorrect ? 1 : 0),
                    'studyStats.lastStudied': new Date().toISOString()
                });
                
                // Notify flashcards page to refresh stats
                window.dispatchEvent(new CustomEvent('study-event', {
                    detail: { type: 'study_session_completed', wasCorrect }
                }));
            }
        } catch (error) {
            console.error('Error updating study stats:', error);
        }
    };

    const checkAnswer = () => {
        if (!userAnswer.trim()) return;
        
        // For MCQ, check if the selected letter corresponds to the correct option
        const selectedIndex = userAnswer.charCodeAt(0) - 65; // Convert A=0, B=1, etc.
        const selectedOption = mcqOptions[selectedIndex];
        const isAnswerCorrect = selectedOption === flashcards[currentCard].answer;
        const actualUserAnswer = selectedOption || userAnswer; // Use the actual option text
        
        setIsCorrect(isAnswerCorrect);
        setShowAnswer(true);
        
        // Store quiz result for summary
        const quizResult = {
            question: flashcards[currentCard].question,
            userAnswer: actualUserAnswer,
            correctAnswer: flashcards[currentCard].answer,
            isCorrect: isAnswerCorrect,
            cardIndex: currentCard,
            answerType: answerType
        };
        setQuizResults(prev => [...prev, quizResult]);
        
        // Track study session
        trackStudySession(isAnswerCorrect);
        
        // Show toast with animation
        if (isAnswerCorrect) {
            toast.success("🎉 Correct!", {
                description: "Great job! Keep it up!",
                duration: 3000,
            });
        } else {
            toast.error("❌ Not quite right", {
                description: "Don't worry, keep studying!",
                duration: 3000,
            });
        }
    };

    const nextQuestion = () => {
        setUserAnswer("");
        setShowAnswer(false);
        setIsCorrect(false);
        setHasSeenAnswer(false); // Reset answer tracking for next question
        setCurrentCard(prev => Math.min(flashcards.length - 1, prev + 1));
    };

    const finishQuiz = () => {
        setShowQuizSummary(true);
    };

    const resetState = () => {
        setTopic("");
        setFlashcards([]);
        setCurrentCard(0);
        setIsFlipped(false);
        setStudyStats({ correct: 0, total: 0 });
        setIsQuizMode(false);
        setUserAnswer("");
        setShowAnswer(false);
        setIsCorrect(false);
        setHasSeenAnswer(false); // Reset answer tracking
        setQuizResults([]); // Reset quiz results
        setShowQuizSummary(false); // Reset quiz summary
        setQuizSummaryCard(0); // Reset quiz summary card
    }
    
    if (isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-6 rounded-xl border-2 border-dashed border-muted-foreground/30 h-96 relative overflow-hidden">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 animate-pulse"></div>
                
                {/* Main animation */}
                <div className="relative z-10 space-y-6">
                    {/* Elegant loading animation */}
                    <div className="relative">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center shadow-lg">
                            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                        <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary/20 to-primary/10 animate-ping"></div>
                    </div>
                    
                    {/* Text content */}
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-primary">Generating Your Flashcards</h3>
                        <p className="text-muted-foreground">Creating personalized study materials...</p>
                    </div>
                    
                    {/* Progress dots */}
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
            </div>
        )
    }

    if (flashcards.length > 0) {
        return (
            <div className="space-y-6">
                {showQuizSummary ? (
                    /* Quiz Summary View */
                    <Card className="border-2 border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary">
                                <Target className="size-5" />
                                Quiz Summary
                            </CardTitle>
                            <CardDescription>
                                Here's how you did on your quiz! Use arrows to navigate through questions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Overall Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {quizResults.filter(r => r.isCorrect).length}
                                    </div>
                                    <div className="text-sm text-green-600/80 dark:text-green-400/80">Correct</div>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {quizResults.filter(r => !r.isCorrect).length}
                                    </div>
                                    <div className="text-sm text-red-600/80 dark:text-red-400/80">Incorrect</div>
                                </div>
                            </div>

                            {/* Question Review Slide */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Question Review</h3>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setQuizSummaryCard(prev => Math.max(0, prev - 1))}
                                            disabled={quizSummaryCard === 0}
                                            className="hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-800 dark:hover:border-gray-600"
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {quizSummaryCard + 1} / {quizResults.length}
                                        </span>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setQuizSummaryCard(prev => Math.min(quizResults.length - 1, prev + 1))}
                                            disabled={quizSummaryCard === quizResults.length - 1}
                                            className="hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-800 dark:hover:border-gray-600"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                                
                                {quizResults[quizSummaryCard] && (
                                    <div className={`p-4 rounded-lg border-2 ${
                                        quizResults[quizSummaryCard].isCorrect 
                                            ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/10' 
                                            : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/10'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-lg">{quizResults[quizSummaryCard].isCorrect ? "✅" : "❌"}</span>
                                            <span className="font-medium">Question {quizSummaryCard + 1}</span>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground mb-1">Question:</p>
                                                <div className="text-sm bg-background/50 rounded p-2 border">
                                                    <LatexMathRenderer text={quizResults[quizSummaryCard].question} />
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground mb-1">Your Answer:</p>
                                                    <div className={`text-sm p-2 rounded border ${
                                                        quizResults[quizSummaryCard].isCorrect 
                                                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                                                            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                                                    }`}>
                                                        <LatexMathRenderer text={quizResults[quizSummaryCard].userAnswer} />
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground mb-1">Correct Answer:</p>
                                                    <div className="text-sm p-2 rounded bg-muted/50 border">
                                                        <LatexMathRenderer text={quizResults[quizSummaryCard].correctAnswer} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <div className="flex gap-3 w-full">
                                <Button onClick={() => setShowQuizSummary(false)} variant="outline" className="flex-1">
                                    Continue Studying
                                </Button>
                                <Button onClick={resetState} variant="outline" className="flex-1">
                                    Start New Quiz
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                ) : (
                    /* Flashcards View */
                    <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">Your Flashcards</CardTitle>
                            <Button 
                                variant={isQuizMode ? "default" : "outline"}
                                disabled={!isQuizMode && hasSeenAnswer}
                                onClick={() => {
                                    // Prevent switching to quiz mode if user has seen the answer
                                    if (!isQuizMode && hasSeenAnswer) {
                                        toast.error("❌ Not Allowed!", {
                                            description: "You can't switch to quiz mode after seeing the answer. That would be cheating!",
                                            duration: 5000,
                                        });
                                        return;
                                    }
                                    
                                    setIsQuizMode(!isQuizMode);
                                    setUserAnswer("");
                                    setShowAnswer(false);
                                    setIsCorrect(false);
                                    setIsFlipped(false); // Reset flip state when switching modes
                                }}
                                size="sm"
                            >
                                {isQuizMode ? "Study Mode" : "Quiz Mode"}
                            </Button>
                        </div>
                        <CardDescription>
                            {isQuizMode ? "Type your answer and check if you're right!" : 
                             hasSeenAnswer ? "⚠️ You've seen the answer - can't switch to quiz mode!" : 
                             "Click the card to flip it. Use the arrows to navigate."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6">
                        <div 
                            className={cn("w-full h-64", !isQuizMode && "cursor-pointer")}
                            style={{ perspective: '1000px' }}
                            onClick={() => {
                                if (!isQuizMode) {
                                    console.log('Card clicked, current flip state:', isFlipped);
                                    setIsFlipped(!isFlipped);
                                    if (!isFlipped) {
                                        setHasSeenAnswer(true); // Mark that user has seen the answer
                                    }
                                }
                            }}
                        >
                            <div 
                                className="relative w-full h-full transition-transform duration-700"
                                style={{ 
                                    transformStyle: 'preserve-3d',
                                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                }}
                            >
                                <div className="absolute w-full h-full flex items-center justify-center p-6 rounded-2xl bg-card border shadow-lg text-center"
                                     style={{ backfaceVisibility: 'hidden' }}>
                                    <LatexMathRenderer 
                                        text={flashcards[currentCard].question} 
                                        className="text-xl font-semibold"
                                    />
                                </div>
                                <div className="absolute w-full h-full flex items-center justify-center p-6 rounded-2xl bg-primary text-primary-foreground border shadow-lg text-center"
                                     style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                    <LatexMathRenderer 
                                        text={flashcards[currentCard].answer} 
                                        className="text-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quiz Mode Interface */}
                        {isQuizMode && (
                            <div className="w-full space-y-4">
                                {/* MCQ Interface - Always use multiple choice */}
                                {answerType === 'mcq' && mcqOptions.length > 0 && (
                                    /* MCQ Interface */
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {showAnswer ? "Review your answer:" : "Choose the correct answer:"}
                                        </p>
                                        <div className="grid gap-2">
                                            {mcqOptions.map((option, index) => {
                                                const letter = String.fromCharCode(65 + index);
                                                const isSelected = userAnswer === letter;
                                                const isCorrectOption = option === flashcards[currentCard].answer;
                                                
                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => {
                                                            if (!showAnswer) {
                                                                setUserAnswer(letter);
                                                            }
                                                        }}
                                                        disabled={showAnswer}
                                                        className={cn(
                                                            "p-3 rounded-lg border-2 text-left transition-all duration-200",
                                                            isSelected 
                                                                ? "border-primary bg-primary/5 text-primary" 
                                                                : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                                                            showAnswer && isCorrectOption && "border-green-500 bg-green-50 dark:bg-green-950/20",
                                                            showAnswer && isSelected && !isCorrectOption && "border-red-500 bg-red-50 dark:bg-red-950/20"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-bold text-lg">{letter}.</span>
                                                            <div className="flex-1">
                                                                {option.includes('$') || option.includes('\\') 
                                                                    ? <LatexMathRenderer text={option} />
                                                                    : <span>{option}</span>
                                                                }
                                                            </div>
                                                            {showAnswer && isCorrectOption && (
                                                                <span className="text-green-600 dark:text-green-400">✓</span>
                                                            )}
                                                            {showAnswer && isSelected && !isCorrectOption && (
                                                                <span className="text-red-600 dark:text-red-400">✗</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <Button 
                                            onClick={checkAnswer} 
                                            disabled={!userAnswer || showAnswer}
                                            className="w-full"
                                        >
                                            Check Answer
                                        </Button>
                                    </div>
                                )}
                                
                                {showAnswer && (
                                    <div className="space-y-3">
                                        {/* Enhanced feedback for MCQ - Show for both correct and incorrect */}
                                        <div className={cn(
                                            "p-4 rounded-lg border-2 transition-all duration-500",
                                            isCorrect 
                                                ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-800 dark:text-green-300" 
                                                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300"
                                        )}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xl">{isCorrect ? "✓" : "✗"}</span>
                                                <span className="font-semibold">{isCorrect ? "Correct!" : "Incorrect"}</span>
                                            </div>
                                            <div className="text-sm">
                                                {!isCorrect && (
                                                    <p className="mb-2">The correct answer is <strong>{
                                                        (() => {
                                                            const correctIndex = mcqOptions.findIndex(option => option === flashcards[currentCard].answer);
                                                            return String.fromCharCode(65 + correctIndex); // Convert to A, B, C, D
                                                        })()
                                                    }</strong>.</p>
                                                )}
                                                <div className="text-muted-foreground space-y-2">
                                                    <p className="font-medium">Explanation:</p>
                                                    <div className="text-sm leading-relaxed">
                                                        {(() => {
                                                            const question = flashcards[currentCard].question;
                                                            const correctAnswer = flashcards[currentCard].answer;
                                                            
                                                            // Generate a genuine explanation based on the actual answer content
                                                            if (!correctAnswer || correctAnswer.trim().length === 0) {
                                                                return `Please review the correct answer below.`;
                                                            }
                                                            
                                                            // For MCQ questions, the answer is the option text
                                                            // For open-ended questions, the answer is the full explanation
                                                            // Use the answer content directly as it contains the actual explanation
                                                            if (isCorrect) {
                                                                return (
                                                                    <>
                                                                        <span className="font-medium text-green-600 dark:text-green-400">Great job! You selected the correct answer.</span>
                                                                        <br />
                                                                        <br />
                                                                        <LatexMathRenderer text={correctAnswer} />
                                                                    </>
                                                                );
                                                            } else {
                                                                // For incorrect answers, just show the explanation directly
                                                                // (The "correct answer is A" is already shown above)
                                                                return <LatexMathRenderer text={correctAnswer} />;
                                                            }
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex items-center justify-between w-full">
                            <Button variant="outline" onClick={() => {
                                setCurrentCard(prev => Math.max(0, prev - 1));
                                setIsFlipped(false);
                                setHasSeenAnswer(false); // Reset answer tracking
                                if (isQuizMode) {
                                    setUserAnswer("");
                                    setShowAnswer(false);
                                    setIsCorrect(false);
                                }
                            }} disabled={currentCard === 0} className="hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-800 dark:hover:border-gray-600">Previous</Button>
                            <p className="text-sm font-medium text-muted-foreground">{currentCard + 1} / {flashcards.length}</p>
                            <Button variant="outline" onClick={() => {
                                if (currentCard === flashcards.length - 1) {
                                    // If it's the last card and in quiz mode, finish the quiz
                                    if (isQuizMode) {
                                        finishQuiz();
                                    } else {
                                        setCurrentCard(prev => Math.min(flashcards.length - 1, prev + 1));
                                    }
                                } else {
                                    // Normal next card behavior
                                    setCurrentCard(prev => Math.min(flashcards.length - 1, prev + 1));
                                }
                                setIsFlipped(false);
                                setHasSeenAnswer(false); // Reset answer tracking
                                if (isQuizMode) {
                                    setUserAnswer("");
                                    setShowAnswer(false);
                                    setIsCorrect(false);
                                }
                            }} disabled={currentCard === flashcards.length - 1 && !isQuizMode} className="hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-800 dark:hover:border-gray-600">
                                {currentCard === flashcards.length - 1 && isQuizMode ? "Finish Quiz" : "Next"}
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <div className="flex w-full gap-4">
                            <Button variant="outline" onClick={resetState} className="flex-1 hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-800 dark:hover:border-gray-600">
                                <X className="mr-2 h-4 w-4" />
                                Reset
                            </Button>
                            <Button 
                                onClick={() => saveFlashcardsToFirebase(flashcards, `Flashcards: ${topic || 'Generated Set'}`)}
                                disabled={isSaving || !user}
                                className="flex-1"
                                variant="secondary"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Set
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardFooter>
                    </Card>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {showQuizSummary ? null : (
                <Card className="group transform transition-all hover:shadow-lg hover:-translate-y-0.5 border-0 bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm">
                    <CardHeader className="py-3">
                        <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base">
                            <div className="p-0.5 rounded bg-primary/10 group-hover:bg-primary/15 transition-colors">
                                <GraduationCap className="size-4 text-primary" />
                            </div>
                            Flashcard Generator
                        </CardTitle>
                    </CardHeader>
            <CardContent>
                 <Tabs defaultValue="classes" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                        <TabsTrigger value="classes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <BookUser className="mr-2"/> From Your Classes
                        </TabsTrigger>
                        <TabsTrigger value="topic" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <PencilLine className="mr-2"/> By Topic
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="classes" className="mt-4">
                        <div className="space-y-4">
                            <p className="text-center text-muted-foreground text-sm">Select a class to generate flashcards based on its chat history.</p>
                            {uniqueClassChats.length > 0 ? (
                                <>
                                {uniqueClassChats.map(([id, chat]) => (
                                    <Button 
                                    key={id} 
                                    variant="outline" 
                                    className="w-full justify-start h-auto py-4 hover:bg-primary/5 hover:border-primary/20 group transition-all duration-300" 
                                    onClick={() => handleGenerateFromClass(chat)}
                                >
                                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors mr-4">
                                            <BookUser className="size-5 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold group-hover:text-primary transition-colors">
                                                {chat.courseData?.courseName || chat.title || chat.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">{chat.courseData?.courseCode || 'Class Chat'}</div>
                                        </div>
                                    </Button>
                                ))}
                                {/* Removed 'Upload another syllabus' shortcut per request */}
                                </>
                            ) : (
                                 <div className="text-center text-muted-foreground text-sm p-8 border-2 border-dashed rounded-xl">
                                    <p className="mb-4">No classes found. Upload a syllabus to get started.</p>
                                    <Button variant="secondary" onClick={() => router.push('/dashboard/upload')}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Syllabus
                                    </Button>
                                 </div>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="topic" className="mt-4 space-y-4">
                        <p className="text-center text-muted-foreground text-sm">Enter a topic and the AI will generate flashcards for you.</p>
                        <Input 
                            placeholder="e.g., Photosynthesis, The American Revolution" 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="text-base"
                        />
                        <Button onClick={handleGenerateFromTopic} disabled={isGenerating || !topic.trim()} className="w-full hover:bg-primary/90 disabled:hover:bg-primary">
                            {isGenerating ? <Loader2 className="animate-spin" /> : <>Generate Flashcards</>}
                        </Button>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
            )}
        </div>
    );
}
