'use client';

// Feature flag: Set to false to disable the floating chat button
const FLOATING_CHAT_BUTTON_ENABLED = false;

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AtSign, GraduationCap } from 'lucide-react';
import { SentIcon, ImageUploadIcon, Mic01Icon, MicOff01Icon } from 'hugeicons-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/hooks/use-chat-store';
import { auth } from '@/lib/firebase/client-simple';

// Helper function to get guest display name from localStorage
const getGuestDisplayName = (): string => {
  if (typeof window === 'undefined') return 'Guest User';
  try {
    const guestUser = localStorage.getItem('guestUser');
    if (guestUser) {
      const parsed = JSON.parse(guestUser);
      return parsed.displayName || 'Guest User';
    }
  } catch (error) {
    console.warn('Failed to parse guest user from localStorage:', error);
  }
  return 'Guest User';
};

export function FloatingChatButton() {
  // Component deactivated - floating pill disabled
  if (!FLOATING_CHAT_BUTTON_ENABLED) {
    return null;
  }

  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { chats, addMessage, setCurrentTab } = useChatStore();
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setValue((prev) => prev + (prev ? ' ' : '') + transcript);
          setIsVoiceActive(false);
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsVoiceActive(false);
          if (event.error === 'not-allowed') {
            alert('Microphone permission denied. Please allow microphone access in your browser settings.');
          }
        };

        recognitionInstance.onend = () => {
          setIsVoiceActive(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as Element)?.closest('[data-dropdown-trigger]')
      ) {
        setShowCourseDropdown(false);
      }
    };

    if (showCourseDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCourseDropdown]);

  // Don't show on chat page itself
  if (pathname === '/dashboard/chat') {
    return null;
  }

  // Get class chats
  const classChats = Object.values(chats).filter(
    (chat) => chat.chatType === 'class'
  );

  const handleSend = async () => {
    // Don't send if there's no message and no file
    if (!value.trim() && !selectedFile) return;

    const messageText = value.trim();

    // If a chat is selected, send to that chat and redirect
    if (selectedChatId) {
      const selectedChat = chats[selectedChatId];
      const isClassChat = selectedChat?.chatType === 'class';

      const isGuest = user?.isGuest || user?.isAnonymous;
      const userName = isGuest ? getGuestDisplayName() : (user?.displayName || 'Anonymous');
      
      const userMessage: any = {
        id: `msg-${Date.now()}-${Math.random()}`,
        text: messageText,
        sender: 'user' as const,
        name: userName,
        userId: user?.uid || 'guest',
        timestamp: Date.now(),
      };

      // Add file if selected
      if (selectedFile) {
        const fileUrl = URL.createObjectURL(selectedFile);
        userMessage.file = {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          url: fileUrl
        };
        setSelectedFile(null); // Clear after adding
      }

      try {
        // Set the current tab before adding message
        setCurrentTab(selectedChatId);
        // Add message to the selected chat
        await addMessage(selectedChatId, userMessage);
        
        // Clear input and selection before redirect
        setValue('');
        setSelectedChatId(null);
        setSelectedFile(null);

        // If it's a class chat, trigger AI response
        if (isClassChat) {
          try {
            const apiEndpoint = '/api/chat/class';
            
            // Get conversation history including the message we just sent
            const recentMessages = selectedChat?.messages?.slice(-10) || [];
            const conversationHistory = recentMessages.map((msg: any) => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)
            }));
            
            // Add the user message we just sent to the history
            conversationHistory.push({
              role: 'user' as const,
              content: messageText
            });
            
            const requestBody = {
              question: messageText,
              context: selectedChat?.title || 'General Chat',
              conversationHistory: conversationHistory,
              shouldCallAI: true,
              userId: user?.uid,
              chatId: selectedChatId,
              chatTitle: selectedChat?.title,
            };

            // Add course data for class chats
            if (selectedChat?.courseData) {
              requestBody.courseData = selectedChat.courseData;
              requestBody.metadata = selectedChat.metadata;
            }

            // Call AI API (don't await - let it run in background after redirect)
            fetch(apiEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            })
              .then(async (response) => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                
                if (data.success && data.answer) {
                  const aiMessage = {
                    id: `ai-${Date.now()}-${Math.random()}`,
                    text: data.answer,
                    sender: 'bot' as const,
                    name: 'CourseConnect AI',
                    timestamp: Date.now(),
                  };
                  // Add AI response to the chat
                  await addMessage(selectedChatId, aiMessage);
                }
              })
              .catch((error) => {
                console.error('Error getting AI response:', error);
              });
          } catch (error) {
            console.error('Error triggering AI response:', error);
          }
        }

        // Redirect to that chat
        router.push(`/dashboard/chat?tab=${encodeURIComponent(selectedChatId)}`);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    } else {
      // Default behavior: redirect to general chat with message and file
      sessionStorage.setItem('floating-chat-message', messageText);
      
      // If there's a file, store it for the chat page to pick up
      if (selectedFile) {
        const fileUrl = URL.createObjectURL(selectedFile);
        sessionStorage.setItem('floating-chat-file', JSON.stringify({
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          url: fileUrl
        }));
        setSelectedFile(null);
      }
      
      router.push('/dashboard/chat');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Ctrl+A / Cmd+A to select all text
    if ((e.key === 'a' || e.key === 'A') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (textareaRef.current) {
        textareaRef.current.select();
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = async () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge for voice input.');
      return;
    }

    if (!isVoiceActive) {
      try {
        setIsVoiceActive(true);
        recognition.start();
        textareaRef.current?.focus();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsVoiceActive(false);
      }
    } else {
      recognition.stop();
      setIsVoiceActive(false);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Store file locally - will be sent when user clicks send
    setSelectedFile(file);
    
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAtClick = () => {
    setShowCourseDropdown(!showCourseDropdown);
  };

  const handleSelectChat = (chatId: string | null) => {
    setSelectedChatId((prev) => {
      if (chatId === null) {
        return null;
      }
      return prev === chatId ? null : chatId;
    });
    setShowCourseDropdown(false);
    // Focus the textarea after selection
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div
        className={cn(
          "relative flex items-center gap-3 px-6 py-3 shadow-lg border-2",
          "bg-white dark:bg-gray-800 backdrop-blur-xl",
          "border-gray-200 dark:border-gray-700",
          "hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-300"
        )}
        style={{
          borderRadius: '26px',
          minHeight: '52px'
        }}
      >
        {/* Upload Icon */}
        <div
          className={cn(
            "relative z-10 h-8 w-8 flex items-center justify-center cursor-pointer flex-shrink-0 rounded-lg",
            "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200",
            selectedFile
              ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          )}
          onClick={handleFileUpload}
          title={selectedFile ? `Selected: ${selectedFile.name}` : "Upload file"}
        >
          <ImageUploadIcon className="h-5 w-5" />
        </div>
        
        {/* Show selected file name */}
        {selectedFile && (
          <div className="absolute -top-8 left-0 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-md max-w-[200px] truncate">
            {selectedFile.name}
          </div>
        )}
        
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          multiple
          accept="*/*"
          className="hidden"
        />

        {/* @ Course Selector Button */}
        <div className="relative" ref={dropdownRef}>
          <div
            data-dropdown-trigger
            onClick={handleAtClick}
            className={cn(
              "relative z-10 h-8 w-8 flex items-center justify-center cursor-pointer flex-shrink-0 rounded-lg",
              "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200",
              selectedChatId
                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            )}
            title={selectedChatId ? `Sending to: ${chats[selectedChatId]?.title || 'Selected course'}` : "Select course to send message"}
          >
            <AtSign className="h-5 w-5" />
          </div>

          {/* Dropdown Menu */}
          {showCourseDropdown && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
              {classChats.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No courses available. Upload a syllabus to get started.
                </div>
              ) : (
                <div className="p-1">
                  {classChats.map((chat) => {
                    const isSelected = selectedChatId === chat.id;
                    return (
                      <button
                        key={chat.id}
                        onClick={() => handleSelectChat(chat.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                          "hover:bg-gray-100 dark:hover:bg-gray-700",
                          isSelected &&
                            "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        )}
                        aria-pressed={isSelected}
                      >
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {chat.courseData?.courseCode || chat.title || 'Untitled Course'}
                          </span>
                          {isSelected && (
                            <span className="text-xs text-blue-600 dark:text-blue-200">
                              (selected)
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <p className="text-[11px] text-blue-500 dark:text-blue-300 mt-1">
                            Click again to deselect
                          </p>
                        )}
                      </button>
                    );
                  })}
                  {selectedChatId && (
                    <div className="mt-1 border-t border-gray-200 dark:border-gray-700 pt-2">
                      <button
                        onClick={() => handleSelectChat(null)}
                        className="w-full text-left px-3 py-1.5 rounded-md text-xs font-medium text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Clear selection
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Field */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedFile
              ? `Message with ${selectedFile.name}...`
              : selectedChatId
              ? `Message ${chats[selectedChatId]?.courseData?.courseCode || chats[selectedChatId]?.title || 'course'}...`
              : 'Ask anything...'
          }
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          className={cn(
            "w-full bg-transparent text-base border-0 outline-none focus:outline-none placeholder:opacity-60 resize-none",
            "text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          )}
          rows={1}
          style={{ 
            fontSize: '14px',
            maxHeight: '120px'
          }}
        />

        {/* Mic Button */}
        <div
          onClick={handleMicClick}
          className={cn(
            "relative z-10 h-8 w-8 flex items-center justify-center cursor-pointer flex-shrink-0 rounded-lg",
            "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200",
            isVoiceActive
              ? "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          )}
          title={isVoiceActive ? "Stop recording" : "Start voice input"}
        >
          {isVoiceActive ? (
            <MicOff01Icon className="h-5 w-5" />
          ) : (
            <Mic01Icon className="h-5 w-5" />
          )}
        </div>

        {/* Send Button (minimal, no gradient circle) */}
        <div
          onClick={handleSend}
          className={cn(
            "relative z-10 h-8 w-8 flex items-center justify-center cursor-pointer flex-shrink-0 rounded-lg",
            "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200",
            "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100",
            (!value.trim() && !selectedFile) && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Send"
        >
          <SentIcon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

