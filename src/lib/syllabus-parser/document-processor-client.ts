/**
 * @fileOverview Client-Side Document Processing for Syllabus Parsing
 * 
 * Handles extraction of text from various document formats (client-side only)
 */

export interface DocumentText {
  text: string;
  format: 'pdf' | 'docx' | 'txt' | 'image';
  confidence?: number;
  metadata?: {
    pages?: number;
    language?: string;
    [key: string]: any;
  };
}

export class DocumentProcessorClient {
  
  /**
   * Extract text from PDF document (uses server-side API)
   */
  static async extractFromPDF(file: File): Promise<DocumentText> {
    try {
      // Ensure we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('PDF extraction requires browser environment');
      }
      
      // Ensure file is valid
      if (!(file instanceof File)) {
        throw new Error('Invalid file object');
      }
      
      // Convert file to FormData for server
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('📤 Sending PDF to server:', { fileName: file.name, fileSize: file.size });
      
      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData
      }).catch((fetchError) => {
        console.error('❌ Fetch error:', fetchError);
        throw new Error(`Network error: ${fetchError.message}`);
      });
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}));
          // Check if API provided helpful alternatives
          if (errorData.alternatives && Array.isArray(errorData.alternatives)) {
            throw new Error('PDFs can be tricky - try uploading a DOCX instead and we\'ll handle the rest!');
          }
          throw new Error(errorData.error || 'PDFs can be tricky - try uploading a DOCX instead and we\'ll handle the rest!');
        } else {
          // Non-JSON response (likely 404 or HTML error page)
          throw new Error('PDFs can be tricky - try uploading a DOCX instead and we\'ll handle the rest!');
        }
      }
      
      const result = await response.json();
      
      if (!result.success || !result.text) {
        throw new Error('PDFs can be tricky - try uploading a DOCX instead and we\'ll handle the rest!');
      }
      
      return {
        text: result.text,
        format: 'pdf',
        metadata: {
          pages: result.metadata?.pageCount || result.metadata?.pages,
          fileName: result.metadata?.fileName,
          fileSize: result.metadata?.fileSize
        }
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // If it's already our friendly message, use it
      if (errorMessage.includes('PDFs can be tricky')) {
        throw new Error(errorMessage);
      }
      
      throw new Error('PDFs can be tricky - try uploading a DOCX instead and we\'ll handle the rest!');
    }
  }
  
  /**
   * Extract text from DOCX document
   */
  static async extractFromDOCX(file: File): Promise<DocumentText> {
    // Dynamic import to avoid SSR issues
    const mammoth = await import('mammoth');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      return {
        text: result.value.trim(),
        format: 'docx',
        metadata: {
          messages: result.messages
        }
      };
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('DOCX files can be tricky - try uploading a TXT file instead and we\'ll handle the rest!');
    }
  }
  
  /**
   * Extract text from plain text file
   */
  static async extractFromTXT(file: File): Promise<DocumentText> {
    try {
      const text = await file.text();
      return {
        text: text.trim(),
        format: 'txt'
      };
    } catch (error) {
      console.error('TXT extraction error:', error);
      throw new Error('TXT files can be tricky - try copying the content and pasting it into a new TXT file, or upload a DOCX instead!');
    }
  }
  
  /**
   * Extract text from image using OCR
   */
  static async extractFromImage(file: File): Promise<DocumentText> {
    // Dynamic import to avoid SSR issues
    const Tesseract = await import('tesseract.js');
    
    try {
      const { data: { text, confidence } } = await Tesseract.default.recognize(file, 'eng', {
        logger: m => console.log(m)
      });
      
      return {
        text: text.trim(),
        format: 'image',
        confidence: confidence / 100,
        metadata: {
          language: 'eng'
        }
      };
    } catch (error) {
      console.error('OCR extraction error:', error);
      throw new Error('Failed to extract text from image');
    }
  }
  
  /**
   * Main extraction method that determines file type and calls appropriate processor
   */
  static async extractText(file: File): Promise<DocumentText> {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    // Determine file type
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return this.extractFromPDF(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      return this.extractFromDOCX(file);
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return this.extractFromTXT(file);
    } else if (
      fileType.startsWith('image/') ||
      fileName.match(/\.(jpg|jpeg|png|gif|bmp|tiff)$/)
    ) {
      return this.extractFromImage(file);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }
  
  /**
   * Validate file before processing
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff'
    ];
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }
    
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return { valid: false, error: 'Unsupported file type' };
    }
    
    return { valid: true };
  }
}
