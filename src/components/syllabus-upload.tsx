
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, Users, Bot, Brain, Zap, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DocumentProcessorClient } from '@/lib/syllabus-parser/document-processor-client';
import { AISyllabusParser } from '@/lib/syllabus-parser/ai-parser';
// Removed Ollama import - now using API routes
import { useRouter } from "next/navigation";
import { useChatStore } from "@/hooks/use-chat-store";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client-simple";
import { Progress } from "@/components/ui/progress";
import { AnalyzingIcon } from "./icons/analyzing-icon";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
    findMatchingClassGroups, 
    createClassGroup, 
    joinClassGroup, 
    generateClassChatId, 
    generateSyllabusId,
    type SyllabusData,
    type ChatPreference 
} from "@/lib/syllabus-matching-service";
import { ParsingProgress, ParsingResult } from '@/types/syllabus-parsing';

const encouragingMessages = [
    "Get ready! The AI is creating your new study space.",
    "Unlocking your course secrets... Almost there!",
    "Building your collaborative corner. This will just take a moment.",
    "The AI is brewing up your study group. Hang tight!",
    "Just a few more seconds while we connect you with your classmates."
];


export default function SyllabusUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [parsingProgress, setParsingProgress] = useState<ParsingProgress>({
        stage: 'uploading',
        progress: 0,
        message: 'Ready to upload'
    });
    const [parsingResult, setParsingResult] = useState<ParsingResult | null>(null);
    const [currentMessage, setCurrentMessage] = useState(encouragingMessages[0]);
    const [chatPreference, setChatPreference] = useState<ChatPreference>({
        type: 'public-chat',
        allowJoining: true
    });
    const [matchingGroups, setMatchingGroups] = useState<any[]>([]);
    const [showGroupSelection, setShowGroupSelection] = useState(false);
    const [ollamaResult, setOllamaResult] = useState<{
        extractedData: any;
        isOllamaAvailable: boolean;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const router = useRouter();
    const { addChat, chats, setShowUpgrade } = useChatStore();
    const [user] = useAuthState(auth);
    const isGuest = !user;

    // Function to check for duplicate courses
    const checkForDuplicateCourse = (courseCode: string, courseName: string, fileName?: string) => {
        const existingChats = Object.values(chats).filter(chat => 
            chat.chatType === 'class' && chat.courseData
        );
        
        // First check for duplicate filename if provided
        if (fileName) {
            try {
                const uploadedSyllabi = JSON.parse(localStorage.getItem('uploaded-syllabi') || '[]');
                const duplicateFile = uploadedSyllabi.find((s: any) => 
                    s.fileName?.toLowerCase() === fileName.toLowerCase()
                );
                if (duplicateFile) {
                    // Find the chat associated with this file
                    const chatForFile = existingChats.find(chat => chat.id === duplicateFile.chatId);
                    if (chatForFile) {
                        return { chat: chatForFile, reason: 'file' };
                    }
                }
            } catch (e) {
                console.warn('Error checking uploaded syllabi:', e);
            }
        }
        
        // Check for exact course code match
        const exactMatch = existingChats.find(chat => 
            chat.courseData?.courseCode?.toLowerCase() === courseCode.toLowerCase()
        );
        
        if (exactMatch) {
            return { chat: exactMatch, reason: 'course' };
        }
        
        // Check for similar course name (fuzzy matching)
        const similarMatch = existingChats.find(chat => {
            const existingName = chat.courseData?.courseName?.toLowerCase() || '';
            const newName = courseName.toLowerCase();
            
            // Check if names are very similar (80% similarity)
            const similarity = calculateSimilarity(existingName, newName);
            return similarity > 0.8;
        });
        
        if (similarMatch) {
            return { chat: similarMatch, reason: 'course' };
        }
        
        return null;
    };

    // Helper function to calculate string similarity
    const calculateSimilarity = (str1: string, str2: string): number => {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    };

    // Helper function to calculate Levenshtein distance
    const levenshteinDistance = (str1: string, str2: string): number => {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        
        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }
        
        return matrix[str2.length][str1.length];
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isAnalyzing) {
            const randomIndex = Math.floor(Math.random() * encouragingMessages.length);
            setCurrentMessage(encouragingMessages[randomIndex]);
            setParsingProgress(prev => ({ ...prev, progress: 0 }));
            const interval = 50; // ms
            const totalTime = 5000; // 5 seconds for the full animation
            const increment = (interval / totalTime) * 100;
            
            timer = setInterval(() => {
                setParsingProgress(prev => {
                    if (prev.progress >= 95) { // Stop just before 100 to wait for async operation
                        clearInterval(timer);
                        return { ...prev, progress: 95 };
                    }
                    return { ...prev, progress: prev.progress + increment };
                });
            }, interval);
        }
        return () => {
            clearInterval(timer);
        };
    }, [isAnalyzing]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            // Use the new validation system
            const validation = DocumentProcessorClient.validateFile(selectedFile);
            if (!validation.valid) {
                toast({
                    variant: "destructive",
                    title: "Invalid file",
                    description: validation.error || "Please select a valid file.",
                });
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        // IMMEDIATE duplicate check before any processing
        try {
            const uploadedSyllabi = JSON.parse(localStorage.getItem('uploaded-syllabi') || '[]');
            const duplicateFile = uploadedSyllabi.find((s: any) => 
                s.fileName?.toLowerCase() === file.name.toLowerCase()
            );
            
            if (duplicateFile) {
                const existingChat = Object.values(chats).find(chat => chat.id === duplicateFile.chatId);
                if (existingChat) {
                    toast({
                        title: "File Already Uploaded",
                        description: `The file "${file.name}" has already been uploaded. This course already exists in your sidebar.`,
                        variant: "destructive",
                        action: (
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                    router.push(`/dashboard/chat?tab=${existingChat.id}`);
                                }}
                            >
                                Go to Chat
                            </Button>
                        )
                    });
                    setFile(null);
                    return;
                }
            }
        } catch (e) {
            console.warn('Error checking for duplicate file:', e);
        }

        setIsAnalyzing(true);
        setParsingResult(null);
        
        try {
            // Stage 1: Upload validation
            setParsingProgress({
                stage: 'uploading',
                progress: 10,
                message: 'Validating file...'
            });

            const validation = DocumentProcessorClient.validateFile(file);
            if (!validation.valid) {
                throw new Error(validation.error || 'Invalid file');
            }

            // Stage 2: Extract text from document
            setParsingProgress({
                stage: 'extracting',
                progress: 30,
                message: 'Extracting text from document...'
            });

            const documentText = await DocumentProcessorClient.extractText(file);
            
            // Stage 3: AI parsing
            setParsingProgress({
                stage: 'parsing',
                progress: 60,
                message: 'Analyzing content with AI...'
            });

            // Try Ollama API first
            try {
                const response = await fetch('/api/ollama/process-syllabus', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: documentText.text,
                        userId: user?.uid || 'guest'
                    })
                });

                if (response.ok) {
                    const ollamaResult = await response.json();
                    setOllamaResult(ollamaResult);
                    
                    // Convert Ollama result to ParsingResult format
                    const result: ParsingResult = {
                        success: true,
                        confidence: ollamaResult.extractedData.confidence,
                        data: {
                            courseInfo: {
                                title: ollamaResult.extractedData.courseTitle || 'Unknown Course',
                                courseCode: ollamaResult.extractedData.courseCode || 'UNKNOWN',
                                instructor: ollamaResult.extractedData.instructor || null,
                                university: ollamaResult.extractedData.university || null,
                                semester: ollamaResult.extractedData.semester || null,
                                year: ollamaResult.extractedData.year || null,
                                department: ollamaResult.extractedData.department || null
                            }
                        },
                        errors: [],
                        processingTime: Date.now() - Date.now()
                    };
                    setParsingResult(result);
                } else {
                    throw new Error('Ollama API failed');
                }
            } catch (ollamaError) {
                console.warn('Ollama processing failed, falling back to AISyllabusParser:', ollamaError);
                
                // Fallback to original parser
                const result = await AISyllabusParser.parseSyllabus(
                    documentText.text,
                    file.name,
                    documentText.format
                );
                setParsingResult(result);
            }

            // Stage 4: Structuring
            setParsingProgress({
                stage: 'structuring',
                progress: 80,
                message: 'Structuring extracted data...'
            });

            // Stage 5: Validation
            setParsingProgress({
                stage: 'validating',
                progress: 90,
                message: 'Validating extracted information...'
            });

            // Stage 6: Complete
            setParsingProgress({
                stage: 'complete',
                progress: 100,
                message: 'Syllabus parsing complete!'
            });

            // Process the parsed result
            if (result.success && result.data) {
                await processParsedSyllabus(result.data);
            } else {
                // Handle parsing errors or low confidence
                if (result.errors && result.errors.length > 0) {
                    throw new Error(result.errors.join(', '));
                } else {
                    throw new Error('Failed to parse syllabus content');
                }
            }

        } catch (error) {
            console.error('Syllabus processing error:', error);
            toast({
                title: "Processing Failed",
                description: error instanceof Error ? error.message : "Failed to process syllabus",
                variant: "destructive"
            });
            
            // Fallback: create a generic chat room even if parsing fails
            await createFallbackChat();
        } finally {
            setIsAnalyzing(false);
        }
    };

    const processParsedSyllabus = async (parsedData: any) => {
            // Extract course information from parsed data
            const courseInfo = parsedData.courseInfo || {};
        const className = courseInfo.title || file?.name.replace(/\.[^/.]+$/, "") || "Unknown Course";
            const classCode = courseInfo.courseCode || "UNKNOWN";

            // Create syllabus data
            const syllabusData: SyllabusData = {
                id: generateSyllabusId({
                    className: className,
                    classCode: classCode,
                    uploadedBy: user?.uid || 'guest',
                    uploadedAt: Date.now(),
                    isPublic: chatPreference.type === 'public-chat'
                }),
                className: className,
                classCode: classCode,
                university: courseInfo.university || null,
                instructor: courseInfo.instructor || null,
                semester: courseInfo.semester || null,
                year: courseInfo.year || null,
                uploadedBy: user?.uid || 'guest',
                uploadedAt: Date.now(),
                isPublic: chatPreference.type === 'public-chat'
            };

            // If user wants AI-only chat, create it directly
            if (chatPreference.type === 'ai-only') {
                const chatName = `${classCode}: ${className}`;
                const chatId = generateClassChatId(syllabusData);
                
                await addChat(
                    chatName,
                    { 
                        sender: 'bot', 
                        name: 'CourseConnect AI', 
                        text: `Welcome to your personal ${chatName} AI chat! 🤖\n\nQuick Start: Ask questions about course topics, get AI homework help, or request study materials. Be specific and detailed for better assistance!\n\nSubjects: Course topics, assignments, concepts & more.`, 
                        timestamp: Date.now() 
                    },
                    chatId
                );

                toast({
                title: "AI Chat Created! 🤖",
                description: `Your personal ${chatName} AI assistant is ready to help with coursework!`,
                });

                // Redirect to the specific chat that was created
                router.push(`/dashboard/chat?tab=${chatId}`);
                return;
            }

            // For public chats, find matching groups
            const matchingGroups = await findMatchingClassGroups(syllabusData);
            
            if (matchingGroups.length > 0) {
                setMatchingGroups(matchingGroups);
                setShowGroupSelection(true);
                setIsAnalyzing(false);
                return;
            }

            // No matching groups found, create new one
            const chatName = `${classCode}: ${className}`;
            
            // Check for duplicate courses before creating chat (including filename check)
            const duplicateCheck = checkForDuplicateCourse(classCode, className, file?.name);
            
            if (duplicateCheck) {
                const { chat: existingChat, reason } = duplicateCheck;
                const errorMessage = reason === 'file' 
                    ? `The file "${file?.name}" has already been uploaded. This course already exists in your sidebar.`
                    : `You already have a chat for ${classCode} - ${className}.`;
                
                toast({
                    title: "File Already Uploaded",
                    description: errorMessage,
                    variant: "destructive",
                    action: (
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                                router.push(`/dashboard/chat?tab=${existingChat.id}`);
                            }}
                        >
                            Go to Chat
                        </Button>
                    )
                });
                setIsAnalyzing(false);
                setFile(null);
                return;
            }
            
            const chatId = generateClassChatId(syllabusData);
            
            await addChat(
                chatName,
                { 
                    sender: 'bot', 
                    name: 'CourseConnect AI', 
                    text: `Welcome to the ${chatName} class chat! 🎓\n\nQuick Start: Ask questions about course topics, collaborate with classmates, or get AI homework help. Be specific and detailed for better assistance!\n\nSubjects: Course topics, assignments, concepts & more.`, 
                    timestamp: Date.now() 
                },
                chatId,
                'class'
            );

            // Create class group
            await createClassGroup(syllabusData, chatId, chatPreference);

            // Save uploaded syllabus to localStorage for duplicate checking
            if (file) {
                try {
                    const uploadedSyllabi = JSON.parse(localStorage.getItem('uploaded-syllabi') || '[]');
                    const uploadedSyllabus = {
                        id: chatId,
                        fileName: file.name,
                        courseName: className,
                        courseCode: classCode,
                        uploadDate: new Date().toISOString(),
                        chatId: chatId
                    };
                    const updatedList = [...uploadedSyllabi, uploadedSyllabus];
                    localStorage.setItem('uploaded-syllabi', JSON.stringify(updatedList));
                } catch (e) {
                    console.warn('Error saving uploaded syllabus:', e);
                }
            }

            console.log('Created class chat:', { chatName, chatId, syllabusData });

            toast({
            title: "Class Chat Created! 🎓",
            description: `Created new study group: ${chatName}. Other students with the same syllabus will automatically join!`,
            });

            // Redirect to the specific chat that was created
            router.push(`/dashboard/chat?tab=${chatId}`);
    };
            
    const createFallbackChat = async () => {
        const chatName = `Course: ${file?.name.replace(/\.[^/.]+$/, "") || "Unknown"}`;
        const fallbackChatId = `fallback-${Date.now()}`;
            
            await addChat(
                chatName,
            { 
                sender: 'bot', 
                name: 'CourseConnect AI', 
                text: `Welcome to the chat for ${chatName}! Ask a question to get started.\n\n**Chat Guidelines:**\nAsk specific questions about your course topics. Be detailed with your questions for better assistance! CourseConnect AI can help with math, science, English, history, computer science, and more.`, 
                timestamp: Date.now() 
            },
            fallbackChatId
            );

            toast({
                title: "Upload Complete",
                description: `Created chat room: ${chatName} (AI analysis unavailable)`,
            });

            // Redirect to the specific fallback chat that was created
            router.push(`/dashboard/chat?tab=${fallbackChatId}`);
    };

    const handleJoinGroup = async (groupId: string, chatId: string) => {
        try {
            if (user) {
                await joinClassGroup(groupId, user.uid);
            }
            
            // Switch to the existing chat
            const group = matchingGroups.find(g => g.id === groupId);
            if (group) {
                await addChat(
                    group.className,
                    { 
                        sender: 'bot', 
                        name: 'CourseConnect AI', 
                        text: `Welcome to the ${group.className} class chat! 🎓\n\nYou've joined an existing class group with ${group.members.length} members.\n\nQuick Start: Ask questions about course topics, collaborate with classmates, or get AI homework help. Be specific and detailed for better assistance!\n\nSubjects: Course topics, assignments, concepts & more.`, 
                        timestamp: Date.now() 
                    },
                    chatId
                );
            }

            toast({
                title: "Joined Study Group! 👥",
                description: `You've been matched with classmates who uploaded the same syllabus!`,
            });

            // Redirect to the specific chat that was joined
            router.push(`/dashboard/chat?tab=${chatId}`);
        } catch (error) {
            console.error('Error joining group:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to join the class group. Please try again.",
            });
        }
    };

    const handleCreateNewGroup = async () => {
        setShowGroupSelection(false);
        setIsAnalyzing(true);
        // Continue with creating new group logic
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const droppedFile = files[0];
            // Use the new validation system
            const validation = DocumentProcessorClient.validateFile(droppedFile);
            if (!validation.valid) {
                toast({
                    variant: "destructive",
                    title: "Invalid file",
                    description: validation.error || "Please select a valid file.",
                });
                return;
            }
            setFile(droppedFile);
        }
    };

    return (
        <Card className="transform transition-all hover:shadow-xl hover:-translate-y-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload /> 
                    Upload Syllabus
                    <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full">
                        <Brain className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">AI Powered</span>
                    </div>
                </CardTitle>
                <CardDescription>
                    Upload syllabi to find your classes and connect with classmates using advanced AI parsing.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    disabled={isAnalyzing}
                />
                
                {/* AI Features Highlight */}
                {!file && !isAnalyzing && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                        <div className="flex items-center gap-2 mb-3">
                            <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">AI Features</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-muted-foreground">Local AI processing</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-muted-foreground">Smart course parsing</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-muted-foreground">Semantic matching</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-muted-foreground">Privacy-first</span>
                            </div>
                        </div>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                            📚 Upload the same syllabus as classmates to automatically join their study group!
                        </p>
                    </div>
                )}
                
                {/* Chat Preferences */}
                {!file && !isAnalyzing && (
                    <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                        <h3 className="text-sm font-medium mb-3">Chat Preferences</h3>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="public-chat"
                                    checked={chatPreference.type === 'public-chat'}
                                    onCheckedChange={(checked) => 
                                        setChatPreference(prev => ({ 
                                            ...prev, 
                                            type: checked ? 'public-chat' : 'ai-only' 
                                        }))
                                    }
                                />
                                <Label htmlFor="public-chat" className="flex items-center gap-2 cursor-pointer">
                                    <Users className="h-4 w-4" />
                                    Join/Create Public Class Chat
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="ai-only"
                                    checked={chatPreference.type === 'ai-only'}
                                    onCheckedChange={(checked) => 
                                        setChatPreference(prev => ({ 
                                            ...prev, 
                                            type: checked ? 'ai-only' : 'public-chat' 
                                        }))
                                    }
                                />
                                <Label htmlFor="ai-only" className="flex items-center gap-2 cursor-pointer">
                                    <Bot className="h-4 w-4 text-primary" />
                                    CourseConnect AI Personal Chat
                                </Label>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {chatPreference.type === 'public-chat' 
                                ? 'You\'ll be matched with classmates who uploaded similar syllabi'
                                : 'You\'ll get a private chat with AI assistance only'
                            }
                        </p>
                    </div>
                )}
                
                {!file && !isAnalyzing && (
                     <div 
                        onClick={triggerFileInput} 
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 sm:p-8 md:p-10 cursor-pointer hover:bg-muted transition-colors"
                    >
                        <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-3 sm:mb-4" />
                        <p className="text-muted-foreground font-semibold text-sm sm:text-base text-center">Click or drag file to this area to upload</p>
                        <p className="text-xs text-muted-foreground mt-1 text-center">Supported formats: PDF, DOC, DOCX, TXT (max 10MB)</p>
                    </div>
                )}

                {!isAnalyzing && (
                    <div className="mt-3 p-3 rounded-md border bg-muted/30 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            <span>Your syllabus is processed securely to extract text. Extracted course data is stored in your account to enable AI-powered course assistance. You can delete your course data at any time.</span>
                        </div>
                    </div>
                )}

                {file && !isAnalyzing && (
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-secondary/50 border">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground flex-shrink-0" />
                                <p className="text-xs sm:text-sm font-medium truncate text-secondary-foreground">{file.name}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 hover:bg-transparent" onClick={() => setFile(null)}>
                                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                        </div>
                        
                        <Button onClick={handleAnalyze} className="w-full text-sm sm:text-base">
                            <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Upload and Analyze
                        </Button>
                    </div>
                )}
                {isAnalyzing && (
                     <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 space-y-4 sm:space-y-5">
                        <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>
                                {parsingProgress.stage === 'uploading' && 'Validating file'}
                                {parsingProgress.stage === 'extracting' && 'Extracting text'}
                                {parsingProgress.stage === 'parsing' && 'Analyzing with AI'}
                                {parsingProgress.stage === 'structuring' && 'Structuring data'}
                                {parsingProgress.stage === 'validating' && 'Finalizing'}
                                {parsingProgress.stage === 'complete' && 'Processing complete'}
                                {parsingProgress.message ? ` • ${parsingProgress.message}` : ''}
                            </span>
                        </div>
                        <div className="w-full">
                            <Progress value={parsingProgress.progress} className="w-full" />
                        </div>
                    </div>
                )}
            </CardContent>
            
            {/* Group Selection Modal */}
            {showGroupSelection && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Found Matching Study Groups! 🎯
                            </CardTitle>
                            <CardDescription>
                                Our AI found existing class chats that match your syllabus. Join classmates who uploaded the same course materials!
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {matchingGroups.map((group) => (
                                <div key={group.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm truncate">{group.className}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                {group.classCode} • {group.members.length} members
                                            </p>
                                            {group.university && (
                                                <p className="text-xs text-muted-foreground">{group.university}</p>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleJoinGroup(group.id, group.chatId)}
                                            className="ml-2"
                                        >
                                            Join
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            
                            <div className="pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={handleCreateNewGroup}
                                    className="w-full"
                                >
                                    Create New Group Instead
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </Card>
    );
}
