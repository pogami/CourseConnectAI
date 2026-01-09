"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Sparkles, CheckCircle, ArrowRight, Calendar, User, GraduationCap, BookOpen, Clock, Shield, File, AlertCircle, Info, Zap, Users, TrendingUp, RotateCcw, MessageSquare, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/hooks/use-chat-store';
import { toast } from 'sonner';
import { AnalyzingIcon } from '@/components/icons/analyzing-icon';
import { useFeatureFlags } from '@/hooks/use-feature-flags';
import { FeatureDisabled } from '@/components/feature-disabled';

interface ExtractedData {
  courseName?: string;
  courseCode?: string;
  professor?: string;
  university?: string;
  semester?: string;
  year?: string;
  classTime?: string;
  location?: string;
  department?: string;
  topics?: string[];
  assignments?: Array<{ name: string; dueDate?: string }>;
  exams?: Array<{ name: string; date?: string; daysUntil?: number }>;
}

interface UploadedSyllabus {
  id: string;
  fileName: string;
  courseName: string;
  courseCode: string;
  uploadDate: string;
  chatId: string;
}

interface InteractiveSyllabusDemoProps {
  className?: string;
  redirectToSignup?: boolean; // New prop to control redirect behavior
}

export default function InteractiveSyllabusDemo({ className, redirectToSignup = true }: InteractiveSyllabusDemoProps) {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [syllabusText, setSyllabusText] = useState<string>(''); // Store raw text for context
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [uploadedSyllabi, setUploadedSyllabi] = useState<UploadedSyllabus[]>([]);
  const [isClient, setIsClient] = useState(false);
  // COURSE FEED STATE - COMMENTED OUT
  // const [enableCourseFeed, setEnableCourseFeed] = useState(false);
  const enableCourseFeed = false; // Placeholder to prevent errors
  const [createdChatId, setCreatedChatId] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { addChat, setCurrentTab, chats } = useChatStore();
  const { isFeatureEnabled } = useFeatureFlags();

  // Function to check for duplicate courses
  const checkForDuplicateCourse = (courseCode: string, courseName: string) => {
    const existingChats = Object.values(chats).filter(chat =>
      chat.chatType === 'class' && chat.courseData
    );

    // Check for exact course code match
    const exactMatch = existingChats.find(chat =>
      chat.courseData?.courseCode?.toLowerCase() === courseCode.toLowerCase()
    );

    if (exactMatch) {
      return exactMatch;
    }

    // Check for similar course name (fuzzy matching)
    const similarMatch = existingChats.find(chat => {
      const existingName = chat.courseData?.courseName?.toLowerCase() || '';
      const newName = courseName.toLowerCase();

      // Check if names are very similar (80% similarity)
      const similarity = calculateSimilarity(existingName, newName);
      return similarity > 0.8;
    });

    return similarMatch || null;
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

  // Set client flag after mount to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load uploaded syllabi from localStorage
  useEffect(() => {
    if (!isClient) return; // Wait for client-side hydration

    console.log('🔍 Attempting to load uploaded syllabi...');
    try {
      const saved = localStorage.getItem('uploaded-syllabi');
      console.log('📦 Raw localStorage data:', saved);

      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('✅ Parsed syllabi count:', parsed.length);
        console.log('📋 Syllabi data:', parsed);
        setUploadedSyllabi(parsed);
      } else {
        console.log('⚠️ No syllabi found in localStorage');
      }
    } catch (error) {
      console.error('❌ Failed to load uploaded syllabi:', error);
    }
  }, [isClient]);

  // Mock recent activity data
  useEffect(() => {
    const activities = [
      "Sarah from MIT just uploaded her Biology syllabus",
      "Mike from Stanford processed his CS course",
      "Emma from Harvard analyzed her Literature class",
      "Alex from Berkeley uploaded Chemistry syllabus",
      "Jordan from Yale processed Psychology course"
    ];
    setRecentActivity(activities);
  }, []);

  // Helper functions
  const getFileTypeText = (file: File) => {
    if (file.type === 'application/pdf') return 'PDF';
    if (file.type === 'text/plain') return 'TXT';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
    if (file.type.startsWith('image/')) return 'IMAGE';
    return 'FILE';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (file: File) => {
    if (file.type === 'application/pdf') return 'bg-red-100 text-red-700 border-red-200';
    if (file.type === 'text/plain') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'bg-green-100 text-green-700 border-green-200';
    if (file.type.startsWith('image/')) return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Function to validate if the document is actually a syllabus
  const validateSyllabusContent = (text: string): { isValid: boolean; reason?: string } => {
    const syllabusKeywords = [
      'syllabus', 'course', 'instructor', 'professor', 'office hours', 'grading', 'assignment',
      'exam', 'midterm', 'final', 'quiz', 'homework', 'textbook', 'required reading',
      'course objectives', 'learning outcomes', 'prerequisites', 'credit hours',
      'attendance', 'late policy', 'academic integrity', 'course schedule',
      'semester', 'fall', 'spring', 'summer', 'winter', 'academic year',
      'class', 'lecture', 'lab', 'section', 'due date', 'deadline', 'rubric',
      'participation', 'discussion', 'project', 'paper', 'essay', 'research'
    ];

    const textLower = text.toLowerCase();
    const foundKeywords = syllabusKeywords.filter(keyword => textLower.includes(keyword));

    // Debug logging
    console.log('Syllabus validation:', {
      textLength: text.trim().length,
      foundKeywords: foundKeywords,
      keywordCount: foundKeywords.length
    });

    // More flexible validation - need at least 3 syllabus-related keywords
    if (foundKeywords.length < 3) {
      return {
        isValid: false,
        reason: `This doesn't appear to be a syllabus. Found only ${foundKeywords.length} syllabus-related terms: ${foundKeywords.join(', ')}. Please upload an actual course syllabus.`
      };
    }

    // Check for minimum content length (syllabi are typically substantial documents)
    if (text.trim().length < 200) {
      return {
        isValid: false,
        reason: 'This document is too short to be a syllabus. Please upload a complete course syllabus.'
      };
    }

    return { isValid: true };
  };

  const handleFileSelect = (selectedFile: File) => {
    // Check if syllabus parser is disabled
    if (!isFeatureEnabled('syllabusParser')) {
      toast.error('Syllabus parser is currently disabled for maintenance.');
      return;
    }

    const allowedTypes = [
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf'
      // Image support temporarily disabled - OCR is slow and unreliable
      // 'image/jpeg',
      // 'image/jpg',
      // 'image/png',
      // 'image/gif',
      // 'image/webp'
    ];
    const allowedExtensions = ['.txt', '.docx', '.pdf'];
    // '.jpg', '.jpeg', '.png', '.gif', '.webp'
    const maxSize = 10 * 1024 * 1024; // 10MB

    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));

    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Please upload a TXT, DOCX, or PDF file.');
      return;
    }

    if (selectedFile.size > maxSize) {
      setError(`File too large. Maximum size is 10MB. Your file is ${(selectedFile.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setExtractedData(null);
    setImagePreview(null); // Image support disabled
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset drag state if we're actually leaving the drop zone
    // (not just moving over a child element)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // Check if mouse is still within the drop zone bounds
    if (
      x < rect.left ||
      x > rect.right ||
      y < rect.top ||
      y > rect.bottom
    ) {
      setIsDragOver(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setImagePreview(null);
    setExtractedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteSyllabus = (syllabusId: string) => {
    if (typeof window === 'undefined') return;

    // Remove from state
    setUploadedSyllabi(prev => prev.filter(s => s.id !== syllabusId));

    // Update localStorage
    const updated = uploadedSyllabi.filter(s => s.id !== syllabusId);
    try {
      localStorage.setItem('uploaded-syllabi', JSON.stringify(updated));
      console.log('Syllabus removed:', syllabusId);
    } catch (error) {
      console.error('Error removing syllabus from localStorage:', error);
    }
  };

  const processSyllabus = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setProcessingTime(0);
    const startTime = Date.now();

    try {
      // Step 1: Extracting text
      setProcessingStep('Extracting text from file...');
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time

      let text = '';

      // Log file type for debugging
      console.log('📄 File type detection:', {
        fileType: file.type,
        fileName: file.name,
        fileExtension: file.name.split('.').pop()?.toLowerCase()
      });

      if (file.type === 'text/plain') {
        console.log('✅ Detected as TXT file');
        try {
          text = await file.text();
        } catch (txtError: any) {
          console.error('❌ TXT file reading error:', txtError);
          setError('TXT files can be tricky - try copying the content and pasting it into a new TXT file, or upload a DOCX instead!');
          throw new Error('TXT files can be tricky - try copying the content and pasting it into a new TXT file, or upload a DOCX instead!');
        }
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx')) {
        console.log('✅ Detected as DOCX file');
        try {
          setProcessingStep('Reading DOCX content...');
          setProgress(20);

          // Use client-side DOCX processing with mammoth
          console.log('Processing DOCX via client-side extraction...', { fileName: file.name, fileSize: file.size });

          const mammoth = await import('mammoth');
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          
          text = result.value.trim();
          
          console.log('✅ DOCX extraction successful:', {
            textLength: text.length,
            fileName: file.name
          });
          setProgress(50);

        } catch (docxError: any) {
          console.error('❌ DOCX extraction error:', docxError);
          const errorMsg = docxError.message || 'Failed to extract text from DOCX';
          
          // Check if it's already our friendly message
          if (errorMsg.includes('DOCX') && errorMsg.includes('TXT')) {
            setError(errorMsg);
            throw new Error(errorMsg);
          }
          
          setError('DOCX files can be tricky - try uploading a TXT file instead and we\'ll handle the rest!');
          throw new Error('DOCX files can be tricky - try uploading a TXT file instead and we\'ll handle the rest!');
        }
      } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        try {
          setProcessingStep('Reading PDF content...');
          setProgress(20);

          // Use server-side API for PDF extraction
          console.log('Processing PDF via API...', { fileName: file.name, fileSize: file.size });

          const formData = new FormData();
          formData.append('file', file);

          setProgress(30);
          setProcessingStep('Extracting text from PDF...');

          const response = await fetch('/api/extract-text', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
          }

          const result = await response.json();

          if (!result.success || !result.text) {
            throw new Error(result.error || 'Failed to extract text from PDF');
          }

          text = result.text;

          console.log('✅ PDF extraction successful:', {
            textLength: text.length,
            fileName: file.name,
            metadata: result.metadata
          });
          setProgress(50);

        } catch (pdfError: any) {
          console.error('❌ PDF extraction error:', pdfError);
          const errorMsg = pdfError.message || 'Failed to extract text from PDF';
          
          // Check if it's already our friendly message
          if (errorMsg.includes('PDFs can be tricky') || errorMsg.includes('scanned PDF')) {
            setError(errorMsg);
            throw new Error(errorMsg);
          }
          
          setError('PDFs can be tricky - try uploading a DOCX instead and we\'ll handle the rest!');
          throw new Error('PDFs can be tricky - try uploading a DOCX instead and we\'ll handle the rest!');
        }
      } else if (false && file !== null && (file!.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(file!.name))) {
        // Image support temporarily disabled - OCR is slow and unreliable
        // Handle images with OCR
        // This code is unreachable (condition starts with false), but TypeScript still checks it
        const currentFile = file!; // Non-null assertion since we check file !== null above
        let timeoutId: NodeJS.Timeout | null = null;
        try {
          console.log('✅ Detected as image file, using OCR');
          setProcessingStep('Extracting text from image with OCR...');
          setProgress(20);

          // Use dedicated OCR endpoint for faster, more reliable text extraction
          const ocrFormData = new FormData();
          ocrFormData.append('file', currentFile);

          setProgress(30);
          setProcessingStep('Extracting text with OCR... (this may take 1-2 minutes, especially on first use)');

          // Create abort controller with longer timeout for OCR (120 seconds - OCR can be slow)
          const controller = new AbortController();
          timeoutId = setTimeout(() => {
            controller.abort();
          }, 120000); // 120 seconds timeout for OCR (2 minutes)

          // Step 1: Extract text using dedicated OCR endpoint
          const ocrResponse = await fetch('/api/ocr/extract-text', {
            method: 'POST',
            body: ocrFormData,
            signal: controller.signal,
          });

          if (timeoutId !== null) {
            clearTimeout(timeoutId as NodeJS.Timeout);
            timeoutId = null;
          }

          if (!ocrResponse.ok) {
            let errorData: any = {};
            try {
              errorData = await ocrResponse.json();
            } catch (e) {
              errorData = { error: `Server error: ${ocrResponse.status}` };
            }
            throw new Error(errorData.error || 'Failed to extract text from image');
          }

          const ocrResult = await ocrResponse.json();

          if (!ocrResult.success || !ocrResult.text || ocrResult.text.trim().length === 0) {
            throw new Error(ocrResult.error || 'No text extracted from image. Please try a clearer image.');
          }

          text = ocrResult.text;

          console.log('✅ Image OCR extraction successful:', {
            textLength: text.length,
            fileName: currentFile.name,
            confidence: ocrResult.confidence,
            preview: text.substring(0, 100) + '...'
          });
          setProgress(50);

        } catch (imageError: any) {
          if (timeoutId !== null) {
            clearTimeout(timeoutId as NodeJS.Timeout);
            timeoutId = null;
          }
          console.error('❌ Image OCR extraction error:', imageError);

          let errorMessage = 'Failed to extract text from image';
          if (imageError.name === 'AbortError') {
            errorMessage = 'OCR processing timed out. The image might be too large or complex. Please try a smaller or simpler image.';
          } else if (imageError.message.includes('Failed to fetch')) {
            errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
          } else {
            errorMessage = imageError.message || 'Failed to extract text from image';
          }

          setError(errorMessage);
          throw new Error(`${errorMessage} Please try a clearer image, smaller file size, or a PDF/DOCX file.`);
        }
      } else {
        throw new Error('Unsupported file format. Please upload a TXT, DOCX, or PDF file.');
      }

      // Validate text content for all file types
      if (!text || text.trim().length === 0) {
        throw new Error('No text content found in the file. Please try a different file.');
      }

      // Process all supported file types with AI
      const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
      if (file.type === 'text/plain' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') || isImage) {
        // Step 2: Validate syllabus content (with bypass option for testing)
        setProcessingStep('Validating syllabus content...');
        setProgress(60);
        await new Promise(resolve => setTimeout(resolve, 500));

        const syllabusValidation = validateSyllabusContent(text);
        if (!syllabusValidation.isValid) {
          // For now, allow bypass with a warning but still process
          console.warn('Syllabus validation failed:', syllabusValidation.reason);
          // Uncomment the line below to enforce strict validation:
          // throw new Error(syllabusValidation.reason || 'This document does not appear to be a syllabus.');
        }

        // Step 3: Analyzing content
        setProcessingStep('Analyzing syllabus content...');
        setProgress(70);
        await new Promise(resolve => setTimeout(resolve, 800));

        // Step 4: Finding topics
        setProcessingStep('Finding course topics...');
        setProgress(80);
        await new Promise(resolve => setTimeout(resolve, 600));

        // Step 5: Identifying assignments
        setProcessingStep('Identifying assignments and exams...');
        setProgress(85);
        await new Promise(resolve => setTimeout(resolve, 400));

        // Call AI extraction API with timeout
        console.log('🤖 Calling AI extraction API...', { textLength: text.length });
        setProcessingStep('Extracting course information with AI...');
        setProgress(85);

        const aiController = new AbortController();
        const aiTimeoutId = setTimeout(() => {
          aiController.abort();
        }, 30000); // 30 seconds timeout for AI extraction

        let response: Response;
        try {
          response = await fetch('/api/extract-syllabus-context', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              syllabusText: text
            }),
            signal: aiController.signal
          });
          clearTimeout(aiTimeoutId);
        } catch (fetchError: any) {
          clearTimeout(aiTimeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error('AI extraction timed out. Please try again with a shorter syllabus or contact support.');
          }
          throw fetchError;
        }

        setProcessingStep('Finalizing results...');
        setProgress(90);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'AI extraction failed');
        }

        const rawData = result.extractedData ?? {};
        const extractedData = {
          ...rawData,
          classTime: rawData.classTime ?? null,
          location: rawData.location ?? null,
        };
        setExtractedData(extractedData);
        setProgress(100);
        setProcessingStep('Complete!');

        // Update processing time
        const endTime = Date.now();
        setProcessingTime(Math.round((endTime - startTime) / 1000));

        // Save to sessionStorage for demo flow
        sessionStorage.setItem('demoSyllabusData', JSON.stringify(extractedData));
        sessionStorage.setItem('demoSyllabusText', text);
        setSyllabusText(text); // Save to state for handleSignUp

        // Dispatch real activity event for live pill
        const activityEvent = new CustomEvent('syllabus-uploaded', {
          detail: {
            courseName: extractedData.courseName,
            university: extractedData.university,
            professor: extractedData.professor,
            courseCode: extractedData.courseCode
          }
        });
        window.dispatchEvent(activityEvent);

        console.log('TXT syllabus processing completed:', extractedData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process syllabus. Please try again.';
      console.error('❌ Processing error:', err);
      console.error('❌ Error details:', {
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(errorMessage);
      setProcessingStep('Error occurred');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignUp = async () => {
    // Prevent multiple simultaneous calls
    if (isCreatingChat) {
      console.log('⏸️ Chat creation already in progress, skipping...');
      return;
    }
    
    setIsCreatingChat(true);
    console.log('🚀 handleSignUp called!');
    console.log('🔍 redirectToSignup:', redirectToSignup);
    console.log('📋 extractedData:', extractedData);

    // Save extracted data to session storage for signup flow
    if (extractedData) {
      sessionStorage.setItem('cc-course-context-card', JSON.stringify({
        courseCode: extractedData.courseCode || 'UNKNOWN',
        courseName: extractedData.courseName || 'Unknown Course',
        professor: extractedData.professor || null,
        topics: extractedData.topics || [],
        nextExamDaysUntil: extractedData.exams?.[0]?.daysUntil ?? null
      }));
    }

    // Only navigate to signup if redirectToSignup is true (homepage users)
    if (redirectToSignup) {
      console.log('📤 Redirecting to signup...');
      // Mark this as a new signup from homepage
      localStorage.setItem('cc-new-signup', 'true');
      setIsCreatingChat(false);
      router.push('/signup');
      return;
    } else {
      console.log('✅ Authenticated user - creating chat...');
      // For authenticated users on upload page, create a course-specific chat
      if (extractedData) {
        const courseName = extractedData.courseName || 'Unknown Course';
        const courseCode = extractedData.courseCode || 'UNKNOWN';
        const chatTitle = `${courseCode} - ${courseName}`;

        // Create course data for the chat
        // Filter out assignments and exams with null/empty dates
        const validAssignments = (extractedData.assignments || []).filter((a: any) => 
          a.dueDate && a.dueDate !== 'null' && a.dueDate.trim() !== '' && !isNaN(new Date(a.dueDate).getTime())
        );
        const validExams = (extractedData.exams || []).filter((e: any) => 
          e.date && e.date !== 'null' && e.date.trim() !== '' && !isNaN(new Date(e.date).getTime())
        );
        
        const courseData = {
          courseName: extractedData.courseName || 'Unknown Course',
          courseCode: extractedData.courseCode || 'UNKNOWN',
          professor: extractedData.professor || 'Unknown Professor',
          university: extractedData.university || 'Unknown University',
          semester: extractedData.semester || 'Unknown Semester',
          year: extractedData.year || 'Unknown Year',
          classTime: extractedData.classTime || 'Unknown Time',
          location: extractedData.location || 'Not specified',
          department: extractedData.department || 'Unknown Department',
          topics: extractedData.topics || [],
          assignments: validAssignments,
          exams: validExams,
          syllabusText: syllabusText, // Save raw text for AI context
          fileName: file?.name || 'Syllabus',
          uploadDate: new Date().toLocaleDateString()
        };

        // Create welcome message for the course chat
        const welcomeMessage = {
          id: `welcome-${Date.now()}`,
          sender: 'bot' as const,
          name: 'CourseConnect AI',
          text: `Welcome to your ${courseName} course chat! I'm your AI tutor with full context about your syllabus. I can help you with:\n\n• Course topics and concepts\n• Assignment deadlines and requirements\n• Exam preparation\n• Study strategies\n• Any questions about the course material\n\nWhat would you like to know about ${courseName}?`,
          timestamp: Date.now()
        };

        try {
          // Check for duplicate courses before creating chat
          const existingChat = checkForDuplicateCourse(courseCode, courseName);

          if (existingChat) {
            // Show Sonar notification warning for duplicate
            toast.warning('Course Already Exists!', {
              description: `You already have a chat for ${courseCode} - ${courseName}. Would you like to go to the existing chat?`,
              duration: 8000,
              action: {
                label: 'Go to Chat',
                onClick: () => {
                  setCurrentTab(existingChat.id);
                  router.push(`/dashboard/chat?tab=${existingChat.id}`);
                }
              }
            });
            return;
          }

          // Create a unique chat ID for each syllabus upload
          const uniqueChatId = `${courseCode}-${courseName}-${Date.now()}`;

          console.log('Creating course chat with ID:', uniqueChatId);

          // Create the course chat with unique ID and wait for it to complete
          const chatCreated = await addChat(chatTitle, welcomeMessage, uniqueChatId, 'class', courseData);

          console.log('Chat creation result:', chatCreated);

          // Store chatId for showing feed link
          setCreatedChatId(uniqueChatId);
          
          // CRITICAL: Verify chat is in store immediately after creation
          let storeChats = useChatStore.getState().chats;
          if (!storeChats[uniqueChatId]) {
            console.warn('⚠️ Chat not in store immediately after creation, re-adding...');
            await addChat(chatTitle, welcomeMessage, uniqueChatId, 'class', courseData);
            // Wait a moment for state to update
            await new Promise(resolve => setTimeout(resolve, 200));
            storeChats = useChatStore.getState().chats;
          }
          
          // CRITICAL: Wait for chat to be fully saved before any navigation
          // Verify chat is in store
          if (!storeChats[uniqueChatId]) {
            console.warn('⚠️ Chat not in store after creation, waiting...');
            await new Promise(resolve => setTimeout(resolve, 500));
            storeChats = useChatStore.getState().chats;
          }
          
          // Set current tab to ensure it's selected
          setCurrentTab(uniqueChatId);
          
          // Wait a moment for state to sync
          await new Promise(resolve => setTimeout(resolve, 300));

          // Create course feed if checkbox was checked
          if (enableCourseFeed) {
            try {
              // Get user ID from auth or use guest ID
              let userId = 'guest';
              try {
                const { auth } = await import('@/lib/firebase/client-simple');
                if (auth?.currentUser) {
                  userId = auth.currentUser.uid;
                }
              } catch (e) {
                console.warn('Could not get user ID:', e);
              }

              const feedResponse = await fetch('/api/course-feed/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  courseId: uniqueChatId,
                  courseCode: courseCode,
                  courseName: courseName,
                  syllabusData: courseData,
                  userId: userId,
                }),
              });
              
              if (feedResponse.ok) {
                console.log('✅ Course feed created');
              }
            } catch (error) {
              console.warn('Could not create course feed:', error);
            }
          }

          // Save to uploaded syllabi list
          console.log('💾 Saving syllabus to localStorage...');
          console.log('📁 File name:', file?.name);
          console.log('📚 Course name:', extractedData.courseName);
          console.log('🆔 Chat ID:', uniqueChatId);

          const uploadedSyllabus: UploadedSyllabus = {
            id: uniqueChatId,
            fileName: file?.name || 'Syllabus',
            courseName: extractedData.courseName || 'Unknown Course',
            courseCode: extractedData.courseCode || 'UNKNOWN',
            uploadDate: new Date().toISOString(),
            chatId: uniqueChatId
          };

          console.log('📝 Syllabus object:', uploadedSyllabus);
          console.log('📚 Current syllabi in state:', uploadedSyllabi);

          const updatedList = [...uploadedSyllabi, uploadedSyllabus];
          console.log('📦 Updated list:', updatedList);

          setUploadedSyllabi(updatedList);
          localStorage.setItem('uploaded-syllabi', JSON.stringify(updatedList));

          // Verify it was saved
          const verification = localStorage.getItem('uploaded-syllabi');
          console.log('✅ Verified localStorage content:', verification);
          console.log('✅ Successfully saved syllabus!');

          // Show success toast
          // COURSE FEED TOAST - COMMENTED OUT
          const toastDescription = `${courseName} is now ready for AI tutoring`;
          
          toast.success('Your syllabus has been uploaded successfully!', {
            description: toastDescription,
            duration: 5000,
            // action: enableCourseFeed && createdChatId ? {
            //   label: 'View Feed',
            //   onClick: () => router.push(`/dashboard/course/${encodeURIComponent(createdChatId)}/feed`)
            // } : undefined,
          });

          // Check for upcoming exams and assignments
          if (courseData.exams && courseData.exams.length > 0) {
            courseData.exams.forEach((exam: any) => {
              if (exam.date && exam.date !== 'null' && exam.date.trim() !== '') {
                const examDate = new Date(exam.date);
                if (isNaN(examDate.getTime())) return;
                const today = new Date();
                const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntil === 1) {
                  toast.error(`Exam Alert!`, {
                    description: `Your ${courseCode} ${exam.name} is tomorrow at 2:00 PM. Don't forget to bring your calculator!`,
                    duration: 7000,
                  });
                } else if (daysUntil >= 0 && daysUntil <= 3) {
                  toast.warning(`Exam in ${daysUntil} days!`, {
                    description: `${courseCode} ${exam.name} on ${exam.date}`,
                    duration: 6000,
                  });
                }
              }
            });
          }

          if (courseData.assignments && courseData.assignments.length > 0) {
            courseData.assignments.forEach((assignment: any) => {
              if (assignment.dueDate && assignment.dueDate !== 'null' && assignment.dueDate.trim() !== '') {
                const dueDate = new Date(assignment.dueDate);
                if (isNaN(dueDate.getTime())) return;
                const today = new Date();
                const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntil === 2) {
                  toast.warning('Assignment Due Soon', {
                    description: `Your ${courseCode} ${assignment.name} is due in 2 days (${assignment.dueDate}).`,
                    duration: 6000,
                  });
                } else if (daysUntil >= 0 && daysUntil <= 3) {
                  toast.warning(`Assignment due in ${daysUntil} days`, {
                    description: `${courseCode} ${assignment.name} - ${assignment.dueDate}`,
                    duration: 5000,
                  });
                }
              }
            });
          }

          // Final verification that chat is in store before navigating
          const finalCheck = useChatStore.getState();
          if (!finalCheck.chats[uniqueChatId]) {
            console.error('❌ Chat still not in store! Re-adding one more time...');
            await addChat(chatTitle, welcomeMessage, uniqueChatId, 'class', courseData);
            setCurrentTab(uniqueChatId);
            // Wait a moment for state to propagate
            await new Promise(resolve => setTimeout(resolve, 300));
          } else {
            // Ensure current tab is set
            setCurrentTab(uniqueChatId);
          }
          
          // CRITICAL: Mark chat as protected before navigation to prevent sync from removing it
          if (typeof window !== 'undefined') {
            try {
              // Store in multiple places for redundancy
              localStorage.setItem('cc-active-tab', uniqueChatId);
              localStorage.setItem('cc-protected-chat-id', uniqueChatId);
              localStorage.setItem(`cc-chat-${uniqueChatId}-protected`, Date.now().toString());
              
              // Also in sessionStorage
              const protectedChats = JSON.parse(sessionStorage.getItem('cc-protected-chats') || '{}');
              protectedChats[uniqueChatId] = {
                timestamp: Date.now(),
                chatData: finalCheck.chats[uniqueChatId] || {
                  id: uniqueChatId,
                  title: chatTitle,
                  messages: [welcomeMessage],
                  createdAt: Date.now(),
                  chatType: 'class',
                  courseData
                }
              };
              sessionStorage.setItem('cc-protected-chats', JSON.stringify(protectedChats));
            } catch (e) {
              console.warn('Failed to mark chat as protected:', e);
            }
          }
          
          // CRITICAL: Wait for chat to be fully saved before navigation
          // Verify chat is in store and persisted
          let finalChats = useChatStore.getState().chats;
          if (!finalChats[uniqueChatId]) {
            console.warn('⚠️ Chat not in store after creation, waiting...');
            await new Promise(resolve => setTimeout(resolve, 500));
            finalChats = useChatStore.getState().chats;
          }
          
          // Wait a moment for Firestore sync to complete
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('✅ Navigating to chat:', uniqueChatId);
          setIsCreatingChat(false);
          
          // Use router.replace to avoid adding to history (prevents back button issues)
          // The chat is protected in localStorage/sessionStorage and will be restored if lost
          router.replace(`/dashboard/chat?tab=${encodeURIComponent(uniqueChatId)}`);
        } catch (error) {
          console.error('Failed to create course chat:', error);
          setIsCreatingChat(false);
          // Fallback to dashboard if chat creation fails
          router.push('/dashboard');
        }
      } else {
        setIsCreatingChat(false);
        // Fallback to dashboard if no extracted data
        router.push('/dashboard');
      }
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr || dateStr === 'null' || dateStr.trim() === '') {
      return 'TBD';
    }
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'TBD';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'TBD';
    }
  };

  // Check if syllabus parser is disabled - show maintenance message
  if (!isFeatureEnabled('syllabusParser')) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-xl">
          <CardContent className="p-8">
            <FeatureDisabled featureName="Syllabus Parser" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 
        Uploaded Syllabi List - ONLY SHOWS ON /dashboard/upload PAGE
        - NOT on home page (where redirectToSignup=true by default)
        - Only if user has previously uploaded syllabi and refreshed
      */}
      {!redirectToSignup && isClient && uploadedSyllabi.length > 0 && (
        <Card className="border-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              Your Uploaded Syllabi
            </CardTitle>
            <p className="text-sm text-muted-foreground">Click to view or remove uploaded courses</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {uploadedSyllabi.map((syllabus) => (
                <div
                  key={syllabus.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors bg-card"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{syllabus.courseName}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>{syllabus.courseCode}</span>
                        <span>•</span>
                        <span>{new Date(syllabus.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/chat?chatId=${encodeURIComponent(syllabus.chatId)}`)}
                    >
                      View Chat
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                      onClick={() => handleDeleteSyllabus(syllabus.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-xl">
        {!redirectToSignup && (
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold">Upload Syllabus</CardTitle>
          </CardHeader>
        )}

        <CardContent className="flex flex-col space-y-6 pb-8">

          {!file && !extractedData && (
            <div
              className={`border-2 border-dashed rounded-xl py-20 px-10 text-center cursor-pointer transition-all duration-300 mt-8 w-full ${isDragOver
                ? 'border-purple-500 dark:border-purple-400 bg-purple-100/80 dark:bg-purple-900/30 shadow-lg scale-[1.02]'
                : 'border-purple-300 dark:border-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-950/20'
                }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".docx,.txt,.pdf"
              />

              <div className='flex justify-center mb-8'>
                <div className={`p-8 rounded-2xl transition-all duration-300 ${isDragOver
                  ? 'bg-gradient-to-br from-purple-200 to-purple-100 dark:from-purple-800/40 dark:to-purple-700/20 scale-110'
                  : 'bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-800/10'
                  }`}>
                  <Upload className={`size-20 transition-all duration-300 ${isDragOver
                    ? 'text-purple-700 dark:text-purple-300 scale-110'
                    : 'text-purple-600 dark:text-purple-400'
                    }`} />
                </div>
              </div>

              <h3 className={`text-2xl font-semibold mb-4 transition-all duration-300 ${isDragOver
                ? 'text-purple-700 dark:text-purple-300 scale-105'
                : 'text-foreground'
                }`}>
                {isDragOver ? 'Drop to upload' : 'Drop syllabus or click to browse'}
              </h3>
              <p className="text-lg text-muted-foreground">
                PDF, DOCX, or TXT • Max 10MB
              </p>
            </div>
          )}

          {file && !extractedData && (
            <div className="space-y-6 mt-4">
              {/* Enhanced File Preview */}
              <div className="p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {imagePreview ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-border/50 flex-shrink-0">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-primary">{getFileTypeText(file)}</div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{file.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getFileTypeColor(file)}`}>
                          {file.type.split('/')[1].toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={removeFile} className="!bg-transparent !border-gray-300 !text-gray-700 hover:!bg-gray-50 hover:!text-gray-900 hover:!border-gray-300 dark:!border-gray-600 dark:!text-gray-300 dark:hover:!bg-gray-800 dark:hover:!text-gray-100 dark:hover:!border-gray-600">
                    Remove
                  </Button>
                </div>

                {/* Full Image Preview for images */}
                {imagePreview && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-border/50 bg-muted/20">
                    <img
                      src={imagePreview}
                      alt="Syllabus preview"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                )}

                {/* Processing Time Estimate */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  <span>This usually takes 10-15 seconds</span>
                </div>
              </div>

              {/* Processing Steps */}
              {isProcessing && (
                <div className="space-y-6">
                  {/* Analyzing Animation */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                      <AnalyzingIcon className="w-32 h-32 md:w-40 md:h-40 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-lg font-semibold text-primary">Analyzing...</p>
                      <p className="text-muted-foreground text-sm">{processingStep}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="size-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">Processing Error</p>
                      <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* COURSE FEED CHECKBOX - COMMENTED OUT */}
              {/* {file && !extractedData && (
                <div className="flex items-center space-x-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Checkbox
                    id="enable-course-feed"
                    checked={enableCourseFeed}
                    onCheckedChange={(checked) => setEnableCourseFeed(checked === true)}
                  />
                  <Label
                    htmlFor="enable-course-feed"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-900 dark:text-white">
                        Enable Course Feed
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-normal">
                        Ask questions, get AI answers, and interact with classmates
                      </span>
                    </div>
                  </Label>
                </div>
              )} */}

              {/* Action Button */}
              <Button
                onClick={processSyllabus}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    Processing...
                  </>
                ) : (
                  <>
                    Analyze Syllabus with AI
                  </>
                )}
              </Button>
            </div>
          )}

          {extractedData && (
            <div className="flex flex-col space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2.5 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    Syllabus Analysis Complete!
                  </h2>
                </div>
                <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Here's what our AI extracted from your syllabus:
                </p>
              </div>

              <Card className="border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10 shadow-xl overflow-hidden relative z-10">
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 dark:from-blue-500/10 dark:via-transparent dark:to-purple-500/10 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                <CardContent className="p-6 md:p-8 space-y-8 relative z-10">
                  
                  {/* Header Section: Course Info */}
                  <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {extractedData.courseName || 'Unknown Course'}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
                          {extractedData.courseCode || 'CODE'}
                        </span>
                        <span>•</span>
                        <span>{extractedData.semester} {extractedData.year}</span>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="flex gap-4">
                      <div className="text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {extractedData.assignments?.length || 0}
                        </div>
                        <div className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">Assignments</div>
                      </div>
                      <div className="text-center px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                        <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          {extractedData.exams?.length || 0}
                        </div>
                        <div className="text-xs text-purple-600/80 dark:text-purple-400/80 font-medium">Exams</div>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Key Details */}
                    <div className="space-y-6">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <User className="w-4 h-4" /> Key Details
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Professor</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{extractedData.professor || 'Not specified'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <GraduationCap className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">University</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{extractedData.university || 'Not specified'}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Class Time</p>
                            <p className={`text-sm text-gray-500 dark:text-gray-400 ${redirectToSignup ? 'blur-[2px] select-none' : ''}`}>
                              {extractedData.classTime || 'Not specified'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Location</p>
                            <p className={`text-sm text-gray-500 dark:text-gray-400 ${redirectToSignup ? 'blur-[2px] select-none' : ''}`}>
                              {extractedData.location || 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Topics & Deadlines */}
                    <div className="space-y-6">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Topics & Deadlines
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Course Topics</p>
                          <div className="flex flex-wrap gap-1.5">
                            {extractedData.topics && extractedData.topics.length > 0 ? (
                              <>
                                {extractedData.topics.slice(0, 4).map((topic, i) => (
                                  <span key={i} className={`px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 ${redirectToSignup ? 'blur-[2px] select-none' : ''}`}>
                                    {topic}
                                  </span>
                                ))}
                                {extractedData.topics.length > 4 && (
                                  <span className="px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500">
                                    +{extractedData.topics.length - 4} more
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No topics extracted</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Upcoming Deadlines</p>
                          <div className="space-y-2">
                            {[...(extractedData.exams || []), ...(extractedData.assignments || [])]
                              .slice(0, 3)
                              .map((item, i) => (
                                <div key={i} className={`flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 ${redirectToSignup ? 'blur-[2px] select-none' : ''}`}>
                                  <span className="text-xs font-medium truncate max-w-[180px]">{item.name}</span>
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {'date' in item ? formatDate(item.date as string) : 'dueDate' in item ? formatDate(item.dueDate as string) : 'TBD'}
                                  </span>
                                </div>
                              ))}
                            {(!extractedData.exams?.length && !extractedData.assignments?.length) && (
                              <span className="text-xs text-gray-400 italic">No deadlines found</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {redirectToSignup && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg mx-auto mt-8">
                  <Button
                    onClick={handleSignUp}
                    size="lg"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 text-lg rounded-full shadow-lg hover:shadow-blue-500/25 transition-all transform hover:scale-105"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={removeFile}
                    size="lg"
                    className="w-full sm:w-auto py-6 px-8 text-lg rounded-full border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Upload Another
                    <RotateCcw className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}
              {!redirectToSignup && (
                <div className="flex flex-col items-center justify-center gap-4 w-full max-w-lg mx-auto mt-8">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isCreatingChat) {
                          handleSignUp();
                        }
                      }}
                      type="button"
                      disabled={isCreatingChat}
                      size="lg"
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 text-lg rounded-full shadow-lg hover:shadow-blue-500/25 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingChat ? 'Creating...' : 'Create Course Chat'}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>

                    <Button
                      variant="outline"
                      onClick={removeFile}
                      size="lg"
                      className="w-full sm:w-auto py-6 px-8 text-lg rounded-full border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Upload Another
                      <RotateCcw className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* COURSE FEED LINK - COMMENTED OUT */}
                  {/* {enableCourseFeed && extractedData && (
                    <Button
                      onClick={async () => {
                        const courseCode = extractedData.courseCode || 'UNKNOWN';
                        const courseName = extractedData.courseName || 'Unknown Course';
                        
                        // First, try createdChatId if available
                        let chatId = createdChatId;
                        
                        // If not, find matching chat in store
                        if (!chatId) {
                          const matchingChat = Object.entries(chats).find(([id, chat]) => {
                            if (chat.chatType !== 'class' || !chat.courseData) return false;
                            const chatCourseCode = (chat.courseData.courseCode || '').toLowerCase().trim();
                            const chatCourseName = (chat.courseData.courseName || '').toLowerCase().trim();
                            const targetCode = courseCode.toLowerCase().trim();
                            const targetName = courseName.toLowerCase().trim();
                            
                            return (chatCourseCode && targetCode && chatCourseCode === targetCode) ||
                                   (chatCourseName && targetName && chatCourseName === targetName);
                          });
                          
                          chatId = matchingChat?.[0] || null;
                        }
                        
                        if (!chatId) {
                          toast.error('Course chat not found', {
                            description: 'Please click "Create Course Chat" first, then you can access the feed.',
                          });
                          return;
                        }
                        
                        // Navigate to feed
                        router.push(`/dashboard/course/${encodeURIComponent(chatId)}/feed`);
                      }}
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto border-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 py-6 px-8 text-lg rounded-full"
                    >
                      <MessageSquare className="mr-2 w-5 h-5" />
                      Go to Course Feed
                    </Button>
                  )} */}
                </div>
              )}
            </div>
          )}
          {/* Privacy/processing disclaimer */}
          <div className="mt-auto pt-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 px-3 py-1.5 rounded-full">
              <Shield className="w-3.5 h-3.5" />
              <span>Secure & Private Processing</span>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 max-w-md">
              Your syllabus is processed securely to extract text. Extracted course data is stored in your account to enable AI-powered course assistance. You can delete your course data at any time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
