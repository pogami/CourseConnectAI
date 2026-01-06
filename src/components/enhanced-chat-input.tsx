"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  SentIcon,
  ImageUploadIcon,
  Mic01Icon,
  MicOff01Icon,
  BotIcon,
  Brain01Icon,
  Book01Icon,
  Loading01Icon,
  ArrowDown01Icon,
  Add01Icon,
  Tick01Icon
} from 'hugeicons-react';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils';
import { SearchMenu } from './search-menu';
import { useChatStore } from '@/hooks/use-chat-store';
import { useRouter } from 'next/navigation';
import { useSentimentAnalysis } from '@/hooks/use-sentiment-analysis';
import { VoiceVisualizer } from './voice-visualizer';
// Removed Ollama import - now using API routes

interface EnhancedChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSend: (shouldCallAI?: boolean, aiResponseType?: 'concise' | 'detailed' | 'conversational' | 'analytical') => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFileUpload?: (file: File) => void;
  onFileProcessed?: (processedFile: any) => void;
  onSearchSelect?: (searchType: string, query: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  isPublicChat?: boolean;
  isClassChat?: boolean;
  isSending?: boolean;
  onStop?: () => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export function EnhancedChatInput({
  value,
  onChange,
  onSend,
  onKeyPress,
  onFileUpload,
  onFileProcessed,
  onSearchSelect,
  placeholder,
  disabled = false,
  className = "",
  isPublicChat = false,
  isClassChat = false,
  isSending = false,
  onStop,
  onTypingStart,
  onTypingStop
}: EnhancedChatInputProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { chats } = useChatStore();
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAIMention, setShowAIMention] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; size: number; type: string; url?: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isProcessingOCR, setIsProcessingOCR] = useState<Record<string, boolean>>({});
  const [aiResponseType, setAiResponseType] = useState<'concise' | 'detailed' | 'conversational' | 'analytical'>('concise');
  const [showResponseTypeDropdown, setShowResponseTypeDropdown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea with smooth growth up to 5 lines
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    
    // Calculate line height (font-size * line-height)
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24;
    const maxHeight = lineHeight * 5; // 5 lines max
    
    // Reset height to compute scrollHeight correctly
    el.style.height = 'auto';
    const scrollHeight = el.scrollHeight;
    
    // If content exceeds 5 lines, set max height and enable scrolling
    if (scrollHeight > maxHeight) {
      el.style.height = `${maxHeight}px`;
      el.style.overflowY = 'auto';
    } else {
      el.style.height = `${scrollHeight}px`;
      el.style.overflowY = 'hidden';
    }
    
    // Also handle width expansion for long lines
    el.style.width = '100%';
  }, [value]);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle pasted files directly
  const handlePastedFile = (file: File) => {
    try {
      console.log('📋 Pasted file:', file.name, file.type, file.size);
      
      if (!file || !file.name) {
        console.error('Invalid file object:', file);
        return;
      }

      // Check file size (50MB limit)
      const maxFileSize = 50 * 1024 * 1024;
      if (file.size > maxFileSize) {
        alert(`File "${file.name}" must be less than 50MB`);
        return;
      }

      // Check if we already have too many files (5 max)
      if (selectedFiles.length >= 5) {
        alert('Maximum 5 files allowed at once');
        return;
      }

      // Add to selected files
      setSelectedFiles(prev => [...prev, file]);
      
      // Create preview
      const preview = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };
      setFilePreviews(prev => [...prev, preview]);
      
      console.log('📋 File added successfully:', file.name);
    } catch (error) {
      console.error('Error handling pasted file:', error);
    }
  };

  // Handle paste events for files
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      try {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === 'file') {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
              console.log('📋 Processing pasted file:', file.name, file.type);
              handlePastedFile(file);
            }
          }
        }
      } catch (error) {
        console.error('Error handling paste event:', error);
      }
    };

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('paste', handlePaste);
      return () => inputElement.removeEventListener('paste', handlePaste);
    }
  }, []);

  // Check for @ mentions
  useEffect(() => {
    const hasAIMention = value.includes('@ai') || value.includes('@AI');
    setShowAIMention(hasAIMention);
  }, [value]);

  // Load composer state (no longer needed for expand functionality)
  useEffect(() => {
    // Expanded state removed - auto-expansion handles this now
  }, []);

  useEffect(() => {
    // No need to save expanded state since we removed the expand functionality
  }, []);

  // Set appropriate placeholder based on chat type
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    if (isClassChat && isPublicChat) {
      return isMobile ? "Type @ai to call AI" : "Type @ai to call AI (Classmate chat coming soon)";
    } else if (isPublicChat) {
      return isMobile ? "Type @ai to call AI" : "Type @ai to call AI (Community chat coming soon)";
    } else {
      return isMobile ? "Ask anything" : "Ask CourseConnect AI anything";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e);
    
    // Handle typing indicators
    if (e.target.value.length > 0 && !isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    } else if (e.target.value.length === 0 && isTyping) {
      setIsTyping(false);
      onTypingStop?.();
    }
    // Adjust height immediately while typing
    const el = inputRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
      el.scrollTop = el.scrollHeight;
    }
  };

  // Use keydown (keypress is deprecated and unreliable for Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Handle Ctrl+A / Cmd+A to select all text
    if ((e.key === 'a' || e.key === 'A') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      const textarea = inputRef.current;
      if (textarea) {
        textarea.select();
      }
      return;
    }

    if (onKeyPress) {
      onKeyPress(e);
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Only send if not currently sending/thinking
      if (!isSending) {
        handleSend();
      }
    }
  };

  const handleSend = () => {
    // If there are files selected, send them (with or without text)
    if (selectedFiles.length > 0) {
      if (onFileProcessed) {
        // Send as a single payload so UI can render a grid on one message
        onFileProcessed({ files: selectedFiles, text: value.trim() });
      } else {
        // Fallback: send each file individually
        selectedFiles.forEach((file) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: 10 }));
          setTimeout(() => setUploadProgress(prev => ({ ...prev, [file.name]: 60 })), 100);
          setTimeout(() => setUploadProgress(prev => ({ ...prev, [file.name]: 100 })), 200);
          onFileUpload?.(file);
        });
      }
      // Clear selection after dispatch
      setSelectedFiles([]);
      setFilePreviews([]);
      setUploadProgress({});
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else if (value.trim()) {
      // No file, just text
      // Pass the AI response type to onSend
      const shouldCallAI = !isPublicChat || value.includes('@ai') || value.includes('@AI');
      onSend(shouldCallAI, aiResponseType);
      onTypingStop?.();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File upload triggered', e.target.files);
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processOCR = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) return null;
    
    try {
      setIsProcessingOCR(prev => ({ ...prev, [file.name]: true }));
      
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const base64Image = await base64Promise;
      const mimeType = base64Image.split(',')[0].split(':')[1].split(';')[0];
      
      // Call OCR API
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: base64Image,
          mimeType: mimeType
        }),
      });
      
      if (!response.ok) {
        throw new Error('OCR processing failed');
      }
      
      const data = await response.json();
      return data.text || null;
    } catch (error) {
      console.error('OCR error:', error);
      return null;
    } finally {
      setIsProcessingOCR(prev => ({ ...prev, [file.name]: false }));
    }
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Allow any file type - just check size
    const maxFileSize = 50 * 1024 * 1024; // 50MB limit
    
    // Respect maximum of 5 total files including already selected
    const remaining = Math.max(0, 5 - selectedFiles.length);
    const limited = files.slice(0, remaining);

    const valid: File[] = [];
    for (const f of limited) {
      if (f.size > maxFileSize) {
        alert(`File "${f.name}" must be less than 50MB`);
        continue;
      }
      // Allow any file type
      valid.push(f);
    }

    if (valid.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const previews = valid.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined
    }));
    setSelectedFiles(prev => [...prev, ...valid]);
    setFilePreviews(prev => [...prev, ...previews]);
    
    // Process OCR for images (extract text but don't show it in input)
    // The extracted text will be sent as document context, not as visible message text
    for (const file of valid) {
      if (file.type.startsWith('image/')) {
        // Extract text silently - it will be used as context for the AI
        // but won't appear in the user's message bubble
        await processOCR(file);
        // Don't append to input - let the chat page handle it as document context
      }
    }
    
    inputRef.current?.focus();
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the container itself
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };
  
  const removeFile = (name?: string) => {
    if (!name) {
      setSelectedFiles([]);
      setFilePreviews([]);
      setUploadProgress({});
    } else {
      setSelectedFiles(prev => prev.filter(f => f.name !== name));
      setFilePreviews(prev => prev.filter(p => p.name !== name));
      setUploadProgress(prev => { const { [name]: _, ...rest } = prev; return rest; });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => {
    console.log('📁 Upload button clicked');
    if (fileInputRef.current) {
      console.log('📁 File input found, triggering click');
      fileInputRef.current.click();
    } else {
      console.error('📁 File input ref not found');
    }
  };

  const toggleVoice = async () => {
    console.log('🎤 Microphone button clicked, isVoiceActive:', isVoiceActive);
    
    if (!isVoiceActive) {
      try {
        // Check if browser supports speech recognition
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          console.log('🎤 Speech recognition not supported');
          alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
          return;
        }

        // Check if we're on HTTPS (required for Web Speech API in production)
        if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          console.log('🎤 HTTPS required for speech recognition');
          alert('Voice input requires a secure connection (HTTPS). Please ensure you are using https:// in the URL.');
          return;
        }

        // Request microphone permission first
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (permError: any) {
          console.error('🎤 Microphone permission denied:', permError);
          alert('Microphone access is required for voice input. Please allow microphone access in your browser settings and try again.');
          return;
        }

        console.log('🎤 Speech recognition supported, creating recognition instance');
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = true; // Enable real-time results
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          console.log('🎤 Speech recognition started');
          setIsVoiceActive(true);
        };
        
        recognition.onresult = (event: any) => {
          console.log('🎤 Speech recognition result:', event);
          
          let interimTranscript = '';
          let finalTranscript = '';
          
          // Process all results
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Use final transcript if available, otherwise use interim
          const transcriptToUse = finalTranscript || interimTranscript;
          
          if (transcriptToUse) {
            const currentValue = value;
            const newValue = currentValue + (currentValue ? ' ' : '') + transcriptToUse;
            console.log('🎤 Speech recognized:', transcriptToUse);
            console.log('🎤 Current value:', currentValue);
            console.log('🎤 New value:', newValue);
            
            // Try multiple approaches to update the input
            try {
              // Approach 1: Create a proper synthetic event
              const syntheticEvent = {
                target: { value: newValue },
                currentTarget: { value: newValue }
              } as React.ChangeEvent<HTMLTextAreaElement>;
              onChange(syntheticEvent);
              console.log('🎤 Updated via synthetic event');
            } catch (error) {
              console.error('🎤 Error with synthetic event:', error);
            }
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('🎤 Speech recognition error:', event.error);
          setIsVoiceActive(false);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            alert('Microphone access is required for voice input. Please allow microphone access in your browser settings and try again.');
          } else if (event.error === 'no-speech') {
            // Just turn off silently or with a toast for no-speech
            console.log('🎤 No speech detected');
            setIsVoiceActive(false);
          } else if (event.error === 'network') {
            // Network errors can be due to HTTPS, CSP, or actual network issues
            const isHttps = window.location.protocol === 'https:';
            if (!isHttps) {
              alert('Voice input requires a secure connection (HTTPS). Please use https:// in the URL.');
            } else {
              alert('Voice input requires a stable internet connection. If the issue persists, please try refreshing the page or use text input instead.');
            }
          } else if (event.error === 'aborted') {
            // User stopped it, just turn off silently
            console.log('🎤 Speech recognition aborted');
            setIsVoiceActive(false);
          } else {
            console.warn(`Speech recognition error: ${event.error}`);
            alert(`Voice input error: ${event.error}. Please try again or use text input.`);
          }
        };
        
        recognition.onend = () => {
          console.log('🎤 Speech recognition ended');
          setIsVoiceActive(false);
        };
        
        console.log('🎤 Starting speech recognition...');
        recognition.start();
      } catch (error) {
        console.error('🎤 Error accessing microphone:', error);
        alert('Microphone access is required for voice input. Please allow microphone access and try again.');
      }
    } else {
      console.log('🎤 Stopping speech recognition');
      // Stop recognition if it's running
      setIsVoiceActive(false);
    }
  };

  const isDark = theme === 'dark';

  const hasPreviews = filePreviews.length > 0;
  const courseChats = Object.values(chats || {}).filter((c: any) => c?.chatType === 'class') as any[];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResponseTypeDropdown(false);
      }
    };

    if (showResponseTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showResponseTypeDropdown]);

  const handleResponseTypeSelect = (type: 'concise' | 'detailed' | 'conversational' | 'analytical') => {
    setAiResponseType(type);
    setShowResponseTypeDropdown(false);
    console.log('🎨 Response style changed to:', type);
  };

  return (
    <div className={cn("relative w-full chat-input-container", className)}>
      {/* AI Mention Indicator */}
      {showAIMention && isPublicChat && (
        <div className={cn(
          "absolute -top-10 left-2 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 z-10 shadow-lg border backdrop-blur-sm animate-in slide-in-from-bottom-2 duration-200",
          isDark 
            ? "bg-gradient-to-r from-purple-900/90 to-blue-900/90 text-purple-100 border-purple-700/50" 
            : "bg-gradient-to-r from-purple-50 to-blue-50 text-purple-800 border-purple-200/50"
        )}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <BotIcon className="h-4 w-4" />
            <span>AI will respond</span>
          </div>
          <div className="text-xs opacity-75">
            Press Enter to send
          </div>
        </div>
      )}

      {/* Main Input Container */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "chat-input-container relative flex flex-col gap-2 sm:gap-3 px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-200",
          isDragging && "bg-blue-500/10 dark:bg-blue-500/20 ring-2 ring-blue-500/50 dark:ring-blue-400/50 rounded-xl",
          // No background, shadow, or border - let parent handle styling
          "bg-transparent"
        )}
        style={{
          minHeight: hasPreviews ? (isMobile ? '100px' : '140px') : '44px',
          alignItems: 'flex-end',
          overflow: 'visible',
          height: 'auto'
        }}
      >
        {/* Drop Zone Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/10 dark:bg-blue-500/20 backdrop-blur-sm rounded-xl border-2 border-dashed border-blue-500 dark:border-blue-400">
            <div className="flex flex-col items-center gap-2 text-blue-600 dark:text-blue-400">
              <ImageUploadIcon className="h-8 w-8" />
              <span className="text-sm font-medium">Drop your file here</span>
            </div>
          </div>
        )}
        
        {/* File Previews Above Text Area */}
        {hasPreviews && (
          <div className="flex items-center gap-3 w-full flex-wrap"> 
            {filePreviews.map((f) => (
                <div key={f.name} className="relative inline-block rounded-lg overflow-hidden border border-border/60 shadow-md bg-background group">
                {f.type.startsWith('image/') ? (
                  <img 
                    src={f.url} 
                    alt={f.name} 
                    className="h-20 w-20 object-cover bg-white" 
                  />
                ) : f.type === 'application/pdf' ? (
                  <div className={cn(
                    "h-20 w-20 flex items-center justify-center bg-muted/40",
                    isDark ? "bg-gray-800/60" : "bg-gray-100"
                  )}>
                    <div className="flex flex-col items-center justify-center p-1 text-center">
                      <Book01Icon className="h-7 w-7 text-primary mb-0.5" />
                      <span className="text-[10px] leading-tight line-clamp-2 px-1 max-w-[4.5rem]">{f.name}</span>
                    </div>
                  </div>
                ) : (
                  <div className={cn(
                    "h-20 w-20 flex items-center justify-center bg-muted/40",
                    isDark ? "bg-gray-800/60" : "bg-gray-100"
                  )}>
                    <div className="flex flex-col items-center justify-center p-1 text-center">
                      <Book01Icon className="h-7 w-7 text-primary mb-0.5" />
                      <span className="text-[10px] leading-tight line-clamp-2 px-1 max-w-[4.5rem]">{f.name}</span>
                    </div>
                  </div>
                )}
                  <button
                    onClick={() => removeFile(f.name)}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors z-10 opacity-0 group-hover:opacity-100"
                    title="Remove file"
                  >
                    ×
                  </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Row with Icons and Text */}
        <div className="flex items-end gap-2 w-full">
          {/* Plus Icon Button (Left) */}
          <button
            onClick={triggerFileInput}
            disabled={disabled}
            className={cn(
              "h-8 w-8 flex items-center justify-center cursor-pointer rounded-lg",
              "hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-200",
              "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            title="Upload files"
          >
            <Add01Icon className="h-5 w-5" />
          </button>

          {/* Course selector removed per request */}

          {/* Search Menu - Temporarily hidden */}
          {false && onSearchSelect && (
            <SearchMenu
              onSearchSelect={onSearchSelect!}
              disabled={disabled || isSending}
            />
          )}

          {/* Input Field */}
          {isVoiceActive ? (
            <div className="flex-1 flex items-center h-full min-h-[44px]">
              <VoiceVisualizer isActive={isVoiceActive} />
            </div>
          ) : (
            <textarea
              ref={inputRef}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              disabled={disabled}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              className={cn(
                "flex-1 bg-transparent border-0 outline-none resize-none",
                "text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
                "transition-all duration-300 ease-in-out",
                isMobile ? "text-sm" : "text-base",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              rows={1}
              style={{ 
                fontSize: isMobile ? '14px' : '16px', 
                lineHeight: '1.5',
                minHeight: '24px',
                transition: 'height 0.2s ease-in-out, overflow 0.2s ease-in-out'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                const lineHeight = parseFloat(getComputedStyle(target).lineHeight) || 24;
                const maxHeight = lineHeight * 5; // 5 lines max
                
                // Reset height to compute scrollHeight correctly
                target.style.height = 'auto';
                const scrollHeight = target.scrollHeight;
                
                // If content exceeds 5 lines, set max height and enable scrolling
                if (scrollHeight > maxHeight) {
                  target.style.height = `${maxHeight}px`;
                  target.style.overflowY = 'auto';
                } else {
                  target.style.height = `${scrollHeight}px`;
                  target.style.overflowY = 'hidden';
                }
              }}
            />
          )}

          {/* Voice Icon */}
          <div
            onClick={toggleVoice}
            className={cn(
              "h-8 w-8 flex items-center justify-center cursor-pointer rounded-full transition-all duration-300",
              isVoiceActive
                ? "bg-red-500/20 text-red-500 dark:text-red-400 ring-2 ring-red-500/50" 
                : "hover:bg-gray-100 dark:hover:bg-muted/50 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {isVoiceActive ? (
              <MicOff01Icon className="h-5 w-5" />
            ) : (
              <Mic01Icon className="h-5 w-5" />
            )}
          </div>

          {/* Send/Stop Button */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isVoiceActive) {
                toggleVoice();
              } else if (isSending && onStop) {
                onStop();
              } else {
                handleSend();
              }
            }}
            disabled={
              disabled || 
              (isSending && !onStop) || 
              (!isSending && !isVoiceActive && !value.trim() && selectedFiles.length === 0)
            }
            title={isVoiceActive ? "Stop recording" : (isSending ? "Stop generating" : "Send message")}
            className={cn(
              "h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200",
              isVoiceActive
                ? "bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700" // Voice Active State - Same as AI Stop
                : isSending 
                  ? "bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700" // Stop State
                  : (value.trim().length > 0 || selectedFiles.length > 0)
                    ? "bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700" // Active Send State
                    : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed", // Disabled Send State
              (disabled || (isSending && !onStop)) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isVoiceActive ? (
              /* STOP ICON: Same square as AI stop */
              <div className="w-2.5 h-2.5 bg-current rounded-[1px]" />
            ) : isSending ? (
              /* STOP ICON: Static square */
              <div className="w-2.5 h-2.5 bg-current rounded-[1px]" />
            ) : (
              /* SEND ICON: Original upward arrow */
              <svg 
                className="h-4 w-4 text-white" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          multiple
          accept="*/*"
          className="hidden"
        />
      </div>
    </div>
  );
}