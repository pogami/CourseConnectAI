/**
 * PDF Storage and Text Extraction with Coordinates
 * Stores PDFs and extracts text with positions for highlighting
 */

export interface PDFTextItem {
  page: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  transform: number[];
}

export interface StoredPDF {
  id: string;
  chatId: string;
  fileName: string;
  fileUrl: string;
  fileData?: ArrayBuffer; // Store for highlighting
  textItems: PDFTextItem[];
  fullText: string;
  uploadedAt: number;
}

// Store PDFs in memory (in production, use IndexedDB or Firestore)
const pdfStorage = new Map<string, StoredPDF>();

/**
 * Extract text with coordinates from PDF
 */
export async function extractPDFWithCoordinates(file: File): Promise<{
  textItems: PDFTextItem[];
  fullText: string;
}> {
  try {
    // Load pdfjs-dist from CDN
    const pdfjsLib = await loadPDFJS();
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    const textItems: PDFTextItem[] = [];
    let fullText = '';

    // Extract text from each page with coordinates
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      textContent.items.forEach((item: any) => {
        const transform = item.transform || [1, 0, 0, 1, 0, 0];
        const x = transform[4];
        const y = transform[5];
        const width = item.width || 0;
        const height = item.height || 0;

        textItems.push({
          page: pageNum,
          text: item.str,
          x,
          y,
          width,
          height,
          transform,
        });

        fullText += item.str + ' ';
      });

      fullText += '\n';
    }

    return { textItems, fullText: fullText.trim() };
  } catch (error: any) {
    console.error('Error extracting PDF with coordinates:', error);
    throw new Error('Failed to extract PDF: ' + error.message);
  }
}

/**
 * Load PDF.js from CDN
 */
function loadPDFJS(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('PDF extraction must run in browser'));
      return;
    }

    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = window.pdfjsLib || window.pdfjs;
      if (pdfjsLib) {
        window.pdfjsLib = pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjsLib);
      } else {
        reject(new Error('PDF.js not found after loading'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
    document.head.appendChild(script);
  });
}

/**
 * Store PDF for a chat
 */
export function storePDF(chatId: string, file: File, fileUrl: string, textItems: PDFTextItem[], fullText: string): string {
  const pdfId = `${chatId}-${Date.now()}`;
  const storedPDF: StoredPDF = {
    id: pdfId,
    chatId,
    fileName: file.name,
    fileUrl,
    textItems,
    fullText,
    uploadedAt: Date.now(),
  };

  pdfStorage.set(pdfId, storedPDF);
  
  // Also store in localStorage for persistence
  try {
    const stored = localStorage.getItem(`pdf-${chatId}`);
    const pdfs = stored ? JSON.parse(stored) : [];
    pdfs.push({
      ...storedPDF,
      fileData: null, // Don't store binary data
    });
    localStorage.setItem(`pdf-${chatId}`, JSON.stringify(pdfs));
  } catch (e) {
    console.warn('Failed to store PDF in localStorage:', e);
  }

  return pdfId;
}

/**
 * Get stored PDFs for a chat
 */
export function getStoredPDFs(chatId: string): StoredPDF[] {
  try {
    const stored = localStorage.getItem(`pdf-${chatId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to get PDFs from localStorage:', e);
  }
  
  // Fallback to memory storage
  return Array.from(pdfStorage.values()).filter(pdf => pdf.chatId === chatId);
}

/**
 * Find text in PDF and return highlights
 */
export function findTextInPDF(pdfId: string, searchText: string): Array<{
  page: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}> {
  const pdf = pdfStorage.get(pdfId);
  if (!pdf) {
    // Try to get from localStorage
    const pdfs = getStoredPDFs(pdf.chatId || '');
    const found = pdfs.find(p => p.id === pdfId);
    if (!found) return [];
    
    // Reconstruct from stored data
    return findTextInTextItems(found.textItems, searchText);
  }

  return findTextInTextItems(pdf.textItems, searchText);
}

/**
 * Find text in text items
 */
function findTextInTextItems(
  textItems: PDFTextItem[],
  searchText: string
): Array<{
  page: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}> {
  const lowerSearch = searchText.toLowerCase();
  const matches: Array<{
    page: number;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }> = [];

  // Search for exact matches or partial matches
  textItems.forEach(item => {
    const itemText = item.text.toLowerCase();
    if (itemText.includes(lowerSearch) || lowerSearch.includes(itemText)) {
      matches.push({
        page: item.page,
        text: item.text,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      });
    }
  });

  return matches;
}

/**
 * Parse AI response to find relevant text snippets
 */
export function parseAIResponseForHighlights(
  aiResponse: string,
  pdfTextItems: PDFTextItem[]
): Array<{
  page: number;
  text: string;
}> {
  const highlights: Array<{ page: number; text: string }> = [];
  
  // Look for quoted text, percentages, specific terms
  const patterns = [
    /"([^"]+)"/g, // Quoted text
    /(\d+%)/g, // Percentages
    /(midterm|final|exam|assignment|quiz|test)/gi, // Common terms
    /(worth|worths|worth of)\s+(\d+%)/gi, // "worth 20%"
  ];

  patterns.forEach(pattern => {
    const matches = aiResponse.matchAll(pattern);
    for (const match of matches) {
      const searchText = match[1] || match[0];
      if (searchText) {
        // Find in PDF
        const found = findTextInTextItems(pdfTextItems, searchText);
        found.forEach(item => {
          if (!highlights.some(h => h.page === item.page && h.text === item.text)) {
            highlights.push({
              page: item.page,
              text: item.text,
            });
          }
        });
      }
    }
  });

  return highlights;
}

