"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Send01Icon,
  Upload01Icon,
  Microphone01Icon,
  MicrophoneOff01Icon,
  BotIcon,
  Brain01Icon,
  Book01Icon,
  Loading01Icon,
  Square01Icon
} from 'hugeicons-react';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils';
import { SearchMenu } from './search-menu';
import { useChatStore } from '@/hooks/use-chat-store';
import { useRouter } from 'next/navigation';
// Removed Ollama import - now using API routes

interface EnhancedChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSend: (shouldCallAI?: boolean) => void;
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    
    // Reset height to compute scrollHeight correctly
    el.style.height = 'auto';
    // Set height to scrollHeight - no cap, let it expand naturally
    el.style.height = el.scrollHeight + 'px';
    
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
    if (onKeyPress) {
      onKeyPress(e);
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
      // Always use onSend() - handleSendMessage will detect search mode automatically
      const shouldCallAI = !isPublicChat || value.includes('@ai') || value.includes('@AI');
      onSend(shouldCallAI);
      onTypingStop?.();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File upload triggered', e.target.files);
    const files = Array.from(e.target.files || []);
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
    inputRef.current?.focus();
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
          if (event.error === 'not-allowed') {
            alert('Microphone access is required for voice input. Please allow microphone access and try again.');
          } else if (event.error === 'no-speech') {
            alert('No speech detected. Please try again.');
          } else {
            alert(`Speech recognition error: ${event.error}`);
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
        className={cn(
          "chat-input-container relative flex flex-col gap-3 px-4 py-3",
          // No background, shadow, or border - let parent handle styling
          "bg-transparent"
        )}
        style={{
          minHeight: hasPreviews ? '140px' : '44px',
          alignItems: 'flex-end',
          overflow: 'visible',
          height: 'auto'
        }}
      >
        
        {/* File Previews Above Text Area */}
        {hasPreviews && (
          <div className="flex items-center gap-3 w-full"> 
            {filePreviews.slice(0, 3).map((f) => (
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
        <div className="flex items-end gap-3 w-full">
          {/* File Upload Icon (Left) */}
          <div
            onClick={triggerFileInput}
            className={cn(
              "h-8 w-8 flex items-center justify-center cursor-pointer rounded-lg",
              "hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-200",
              "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Upload01Icon className="h-5 w-5" />
          </div>

          {/* Course selector removed per request */}

          {/* Search Menu - Temporarily hidden */}
          {false && onSearchSelect && (
            <SearchMenu
              onSearchSelect={onSearchSelect}
              disabled={disabled || isSending}
            />
          )}

          {/* Input Field */}
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className={cn(
              "flex-1 bg-transparent text-base border-0 outline-none resize-none",
              "text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            rows={1}
            style={{ 
              fontSize: '16px', 
              minHeight: '24px',
              maxHeight: '200px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />

          {/* Voice Icon */}
          <div
            onClick={toggleVoice}
            className={cn(
              "h-8 w-8 flex items-center justify-center cursor-pointer rounded-full",
              "hover:bg-gray-100 dark:hover:bg-muted/50 transition-colors duration-200",
              isVoiceActive
                ? "text-red-500 dark:text-red-400" 
                : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {isVoiceActive ? (
              <MicrophoneOff01Icon className="h-5 w-5" />
            ) : (
              <Microphone01Icon className="h-5 w-5" />
            )}
          </div>

          {/* Send / Stop Icon */}
          <button
            onClick={isSending ? onStop : handleSend}
            disabled={disabled || (isSending && !onStop)}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-full transition-all duration-200",
              isSending
                ? "text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-gray-100 dark:hover:bg-muted/50"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-muted/50",
              (disabled || (isSending && !onStop)) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSending ? (
              <Square01Icon className="h-5 w-5" />
            ) : (
              <Send01Icon className="h-5 w-5" />
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