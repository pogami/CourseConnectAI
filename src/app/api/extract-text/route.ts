import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ 
        success: false,
        error: 'No file provided' 
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    let text = '';
    let metadata: any = {};

    // Handle PDF files
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      try {
        const data = await pdfParse(buffer);
        text = data.text;
        metadata = {
          pageCount: data.numpages,
          info: data.info
        };
      } catch (error: any) {
        console.error('PDF parsing error:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to parse PDF. Please try a DOCX file instead.',
          text: ''
        }, { status: 400 });
      }
    }
    // Handle DOCX files
    else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
        metadata = {
          messages: result.messages
        };
      } catch (error: any) {
        console.error('DOCX parsing error:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to parse DOCX. Please try a TXT file instead.',
          text: ''
        }, { status: 400 });
      }
    }
    // Handle TXT files
    else if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    }
    else {
      return NextResponse.json({
        success: false,
        error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.',
        text: ''
      }, { status: 400 });
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No text content found in file.',
        text: ''
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      text: text.trim(),
      metadata
    });

  } catch (error: any) {
    console.error('Text extraction error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to extract text',
      text: ''
    }, { status: 500 });
  }
}

