'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X, Loader2, MessageSquare, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentProcessorClient } from '@/lib/syllabus-parser/document-processor-client';
import { BotResponse } from '@/components/bot-response';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  extractedText: string;
  metadata: {
    pageCount?: number;
    lineCount?: number;
    extractionMethod?: string;
    pages?: { [pageNumber: number]: string[] }; // Page number -> array of lines
    lines?: { [lineNumber: number]: { page: number; content: string } }; // Line number -> page and content
  };
  uploadDate: Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Citation[];
  timestamp: Date;
}

interface Citation {
  fileId: string;
  fileName: string;
  page?: number;
  line?: number;
  excerpt: string;
}

export default function TestSyllabusCitationsPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const documentProcessor = new DocumentProcessorClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Parse citations from AI response and highlight them
  const parseCitations = (text: string, files: UploadedFile[]): React.ReactNode => {
    // Pattern to match [Source: filename, Page X, Line Y]
    const citationPattern = /\[Source:\s*([^,]+),\s*Page\s*(\d+),\s*Line\s*(\d+)\]/gi;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = citationPattern.exec(text)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Extract citation details
      const fileName = match[1].trim();
      const page = parseInt(match[2]);
      const line = parseInt(match[3]);

      // Find the file to get excerpt
      const file = files.find(f => f.name === fileName);
      const lineData = file?.metadata.lines?.[line];

      // Add highlighted citation
      parts.push(
        <span
          key={`citation-${match.index}`}
          className="inline-flex items-center gap-1 px-2 py-1 mx-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs font-medium cursor-help"
          title={lineData ? `"${lineData.content.substring(0, 100)}..."` : `Page ${page}, Line ${line}`}
        >
          📎 {fileName} (P{page}, L{line})
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : <>{text}</>;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        toast({
          title: "Processing file...",
          description: `Extracting text from ${file.name}`,
        });

        // Extract text with metadata
        let extractedText = '';
        let metadata: UploadedFile['metadata'] = {
          pages: {},
          lines: {},
        };

        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          // PDF extraction with page tracking
          const response = await fetch('/api/parse-pdf', {
            method: 'POST',
            body: (() => {
              const formData = new FormData();
              formData.append('file', file);
              return formData;
            })(),
          });

          if (!response.ok) {
            throw new Error('Failed to parse PDF');
          }

          const result = await response.json();
          extractedText = result.text;
          metadata.pageCount = result.metadata?.pageCount || 1;
          metadata.extractionMethod = result.metadata?.extractionMethod || 'pdf-parse';

          // Split text into pages (approximate - PDF parsing doesn't always give exact page breaks)
          // We'll split by approximate page length
          const wordsPerPage = Math.ceil(extractedText.split(/\s+/).length / (metadata.pageCount || 1));
          const words = extractedText.split(/\s+/);
          
          for (let page = 1; page <= (metadata.pageCount || 1); page++) {
            const startWord = (page - 1) * wordsPerPage;
            const endWord = page * wordsPerPage;
            const pageText = words.slice(startWord, endWord).join(' ');
            const pageLines = pageText.split('\n').filter(line => line.trim().length > 0);
            metadata.pages![page] = pageLines;
            
            // Create line index
            let lineNumber = 1;
            for (const line of pageLines) {
              metadata.lines![lineNumber] = {
                page,
                content: line.trim(),
              };
              lineNumber++;
            }
          }
          metadata.lineCount = Object.keys(metadata.lines!).length;

        } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
          // TXT extraction with line tracking
          extractedText = await file.text();
          const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
          metadata.lineCount = lines.length;
          metadata.pages = { 1: lines }; // TXT files are treated as single page
          
          // Create line index
          lines.forEach((line, index) => {
            metadata.lines![index + 1] = {
              page: 1,
              content: line.trim(),
            };
          });

        } else if (
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.name.toLowerCase().endsWith('.docx')
        ) {
          // DOCX extraction
          const result = await documentProcessor.extractTextFromDocx(file);
          extractedText = result.text;
          const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
          metadata.lineCount = lines.length;
          metadata.pages = { 1: lines }; // DOCX files treated as single page for now
          
          // Create line index
          lines.forEach((line, index) => {
            metadata.lines![index + 1] = {
              page: 1,
              content: line.trim(),
            };
          });
        } else {
          throw new Error('Unsupported file type');
        }

        const uploadedFile: UploadedFile = {
          id: fileId,
          file,
          name: file.name,
          type: file.type,
          size: file.size,
          extractedText,
          metadata,
          uploadDate: new Date(),
        };

        setUploadedFiles(prev => [...prev, uploadedFile]);

        toast({
          title: "File processed! ✅",
          description: `${file.name} - ${metadata.lineCount || 0} lines extracted`,
        });

      } catch (error: any) {
        console.error('File upload error:', error);
        toast({
          variant: 'destructive',
          title: "Upload failed",
          description: error.message || 'Failed to process file',
        });
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const findSourcesInText = (query: string, files: UploadedFile[]): Citation[] => {
    const citations: Citation[] = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2); // Filter out short words

    files.forEach(file => {
      const textLower = file.extractedText.toLowerCase();
      
      // Find matching lines with context
      Object.entries(file.metadata.lines || {}).forEach(([lineNumStr, lineData]) => {
        const lineNum = parseInt(lineNumStr);
        const lineLower = lineData.content.toLowerCase();
        
        // Check if line contains any query words
        const matches = queryWords.filter(word => lineLower.includes(word));
        if (matches.length > 0) {
          // Calculate relevance score
          const relevance = matches.length / queryWords.length;
          
          if (relevance > 0.2) { // At least 20% of query words match
            // Get surrounding context (previous and next lines)
            const prevLineNum = lineNum - 1;
            const nextLineNum = lineNum + 1;
            const prevLine = file.metadata.lines?.[prevLineNum]?.content || '';
            const nextLine = file.metadata.lines?.[nextLineNum]?.content || '';
            
            const excerpt = [prevLine, lineData.content, nextLine]
              .filter(l => l.trim().length > 0)
              .join(' ')
              .substring(0, 200);
            
            citations.push({
              fileId: file.id,
              fileName: file.name,
              page: lineData.page,
              line: lineNum,
              excerpt: excerpt + (excerpt.length >= 200 ? '...' : ''),
            });
          }
        }
      });
    });

    // Sort by relevance (more matches = higher relevance) and return top 5
    return citations
      .sort((a, b) => {
        // Simple sort - could be improved with better relevance scoring
        return 0;
      })
      .slice(0, 5);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || uploadedFiles.length === 0) {
      toast({
        variant: 'destructive',
        title: "Missing information",
        description: "Please upload a syllabus and enter a question",
      });
      return;
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // Find relevant sources
    const sources = findSourcesInText(input, uploadedFiles);

    try {
      // Prepare context with source information
      const contextText = uploadedFiles.map(file => 
        `[FILE: ${file.name}]\n${file.extractedText.substring(0, 5000)}`
      ).join('\n\n---\n\n');

      // Create enhanced context with source markers and line numbers
      const contextWithSources = uploadedFiles.map((file, idx) => {
        const fileMarker = `[FILE_SOURCE_${idx + 1}: ${file.name}]`;
        
        // Add line numbers to the text for better citation tracking
        let numberedText = '';
        Object.entries(file.metadata.lines || {}).forEach(([lineNum, lineData]) => {
          numberedText += `[Line ${lineNum}, Page ${lineData.page}] ${lineData.content}\n`;
        });
        
        return `${fileMarker}\n${numberedText}`;
      }).join('\n\n---\n\n');

      // Create a source reference guide for the AI
      const sourceGuide = uploadedFiles.map((file, idx) => {
        return `File ${idx + 1}: "${file.name}" (${file.metadata.lineCount || 0} lines, ${file.metadata.pageCount || 1} pages)`;
      }).join('\n');

      const enhancedMessage = `${input}

CRITICAL CITATION REQUIREMENTS:
- You have access to ${uploadedFiles.length} uploaded syllabus file(s): ${sourceGuide}
- When you reference ANY information from these files, you MUST cite the source
- Use this exact citation format: [Source: filename, Page X, Line Y]
- Include citations inline with your answer, not at the end
- If you reference multiple sources, cite each one separately
- Be specific about page and line numbers when available

Example citation format:
"The course meets on Mondays and Wednesdays [Source: syllabus.pdf, Page 1, Line 15] and the final exam is on December 15th [Source: syllabus.pdf, Page 3, Line 42]."`;

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: enhancedMessage, // API expects 'question', not 'message'
          context: contextWithSources,
          chatId: 'test-citations-chat',
          shouldCallAI: true,
          isPublicChat: false,
          conversationHistory: messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({
              role: m.role,
              content: m.content,
            })),
        }),
      });

      if (!response.ok) {
        let errorMessage = `Failed to get AI response: ${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
          }
        } catch (e) {
          // Use default error message
        }
        throw new Error(errorMessage);
      }

      // Check if response body exists
      if (!response.body) {
        throw new Error('No response body received from server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      const assistantMessageId = `msg-${Date.now()}-assistant`;

      let assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        sources: sources,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsStreaming(false);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const data = JSON.parse(line);
              
              if (data.type === 'content') {
                fullResponse += data.content;
                
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: fullResponse }
                    : msg
                ));
                scrollToBottom();
              } else if (data.type === 'done') {
                setIsStreaming(false);
                break;
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Unknown error from AI service');
              }
            } catch (e: any) {
              // If it's not JSON, it might be a partial chunk - skip it
              if (e instanceof SyntaxError) {
                // Not valid JSON, might be partial data - continue
                continue;
              } else {
                // Re-throw other errors
                throw e;
              }
            }
          }
        }
      } catch (streamError: any) {
        console.error('Streaming error:', streamError);
        throw new Error(`Streaming error: ${streamError.message || 'Failed to read response stream'}`);
      } finally {
        setIsStreaming(false);
        scrollToBottom();
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        variant: 'destructive',
        title: "Error",
        description: error.message || 'Failed to get AI response',
      });
      setIsStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Syllabus Citation Test Page
            </CardTitle>
            <CardDescription>
              Upload syllabi and ask questions. The AI will show exact sources (file, page, line) for its answers.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Syllabus Files
            </CardTitle>
            <CardDescription>
              Supports PDF, DOCX, and TXT files. Each file will be indexed with page and line numbers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload Files
                  </>
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
              </span>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Uploaded Files:</h3>
                {uploadedFiles.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.metadata.lineCount || 0} lines
                          {file.metadata.pageCount && ` • ${file.metadata.pageCount} pages`}
                          {file.metadata.extractionMethod && ` • ${file.metadata.extractionMethod}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(file.id)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Messages */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Ask Questions
              </CardTitle>
              <CardDescription>
                Ask questions about your uploaded syllabi. Responses will include source citations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div className="space-y-4 h-[500px] overflow-y-auto pr-2">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet. Ask a question about your uploaded syllabi!</p>
                    </div>
                  </div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`rounded-lg p-4 max-w-[80%] ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">
                          {parseCitations(message.content, uploadedFiles)}
                        </div>
                        
                        {/* Additional Citations from Source Detection */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <p className="text-xs font-semibold mb-2 opacity-70">
                              Detected Sources:
                            </p>
                            <div className="space-y-2">
                              {message.sources.map((source, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs bg-background/50 rounded p-2"
                                >
                                  <p className="font-medium">
                                    📄 {source.fileName}
                                  </p>
                                  <p className="opacity-70">
                                    {source.page !== undefined && `Page ${source.page}`}
                                    {source.page !== undefined && source.line !== undefined && ' • '}
                                    {source.line !== undefined && `Line ${source.line}`}
                                  </p>
                                  <p className="opacity-60 mt-1 italic">
                                    "{source.excerpt}"
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isStreaming && (
                  <div className="flex gap-3 justify-start">
                    <div className="rounded-lg p-4 bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask a question about your syllabus..."
                  className="min-h-[80px]"
                  disabled={isStreaming || uploadedFiles.length === 0}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isStreaming || !input.trim() || uploadedFiles.length === 0}
                  className="self-end"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Send'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Info Sidebar */}
          <Card>
            <CardHeader>
              <CardTitle>File Information</CardTitle>
            </CardHeader>
            <CardContent>
              {uploadedFiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Upload files to see their information here
                </p>
              ) : (
                <div className="space-y-4">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="space-y-2">
                      <h4 className="font-semibold text-sm">{file.name}</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Type: {file.type || 'Unknown'}</p>
                        <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
                        <p>Lines: {file.metadata.lineCount || 0}</p>
                        {file.metadata.pageCount && (
                          <p>Pages: {file.metadata.pageCount}</p>
                        )}
                        {file.metadata.extractionMethod && (
                          <p>Method: {file.metadata.extractionMethod}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

