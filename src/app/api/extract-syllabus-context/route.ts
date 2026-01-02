import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds max for AI extraction

const SyllabusExtractionSchema = z.object({
  syllabusText: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { syllabusText } = SyllabusExtractionSchema.parse(body);

const prompt = `Extract course information from this syllabus and return ONLY valid JSON. Use null for missing fields.

IMPORTANT: Look carefully for the professor/instructor name. It might be listed as:
- "Instructor:", "Professor:", "Instructor Name:", "Faculty:", "Teacher:"
- In a header section or contact information
- After "Dr.", "Prof.", "Mr.", "Ms.", or similar titles
- In email addresses (extract the name before @)

JSON format:
{
  "courseName": "string or null",
  "courseCode": "string or null", 
  "professor": "string or null (full name including title if present, e.g. 'Dr. Sarah Johnson' or 'Prof. John Smith')",
  "university": "string or null",
  "semester": "string or null",
  "year": "string or null",
  "classTime": "string describing meeting days/times or null",
  "department": "string or null",
  "topics": ["array of strings"],
  "assignments": [{"name": "string", "dueDate": "YYYY-MM-DD or null"}],
  "exams": [{"name": "string", "date": "YYYY-MM-DD or null"}]
}

Syllabus:
${syllabusText}

JSON:`;

    // Use Google AI Gemini 3 Flash Preview for syllabus analysis
    let aiResponse: string;
    let selectedModel: string;
    
    try {
      console.log('🤖 Using Google AI Gemini 3 Flash Preview for syllabus analysis...', { syllabusTextLength: syllabusText.length });
      
      const googleApiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE;
      
      if (!googleApiKey) {
        throw new Error('Google AI API key not configured');
      }
      
      // Add timeout to Google AI API call (20 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 20000); // 20 seconds timeout
      
      let response: Response;
      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${googleApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Google AI API request timed out after 20 seconds');
        }
        throw fetchError;
      }

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        selectedModel = 'google';
        console.log('✅ Google AI succeeded for syllabus analysis, response length:', aiResponse.length);
      } else {
        const errorData = await response.text();
        console.log('Google AI error response:', errorData);
        throw new Error(`Google AI failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Google AI failed:', error);
      return NextResponse.json({
        success: false,
        error: 'AI service is temporarily unavailable. Please try again later.'
      }, { status: 500 });
    }

    const aiResponseObj = {
      answer: aiResponse,
      provider: selectedModel,
      shouldRespond: true,
      timestamp: new Date().toISOString(),
      sources: [],
    };

    // Clean the response to extract JSON
    let jsonString = aiResponse.trim();
    console.log('Raw AI response:', aiResponse);
    console.log('Response length:', aiResponse.length);
    
    // Remove any markdown code blocks
    jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Find JSON object boundaries
    const jsonStart = jsonString.indexOf('{');
    const jsonEnd = jsonString.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
    }

    console.log('Cleaned JSON string:', jsonString);

    let extractedData;
    try {
      extractedData = JSON.parse(jsonString);
      console.log('Successfully parsed JSON:', extractedData);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Failed to parse JSON string:', jsonString);
      
      // Fallback: return a basic structure
      extractedData = {
        courseName: null,
        courseCode: null,
        professor: null,
        university: null,
        semester: null,
        year: null,
        classTime: null,
        department: null,
        topics: [],
        assignments: [],
        exams: []
      };
    }

    // Fallback extraction for professor if missing
    if (!extractedData.professor) {
      const fallbackProfessor = extractProfessorName(syllabusText);
      if (fallbackProfessor) {
        extractedData.professor = fallbackProfessor;
        console.log('Professor extracted via fallback:', fallbackProfessor);
      }
    }

    return NextResponse.json({ success: true, extractedData });
  } catch (error: any) {
    console.error('Error extracting syllabus context:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      extractedData: {
        courseName: null,
        courseCode: null,
        professor: null,
        university: null,
        semester: null,
        year: null,
        classTime: null,
        department: null,
        topics: [],
        assignments: [],
        exams: []
      }
    }, { status: 500 });
  }
}

function extractProfessorName(text: string): string | null {
  if (!text) return null;

  const patterns = [
    /(?:instructor|professor|teacher|faculty|course director)\s*[:\-–]\s*([^\r\n]+)/i,
    /(Dr\.|Prof\.|Professor)\s+[A-Z][\w'.-]*(?:\s+[A-Z][\w'.-]*){0,2}/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let result = match[1] || match[0];
      result = result.replace(/(email|office hours|phone).*/i, '').trim();
      result = result.replace(/[-–—:,]$/, '').trim();
      return result;
    }
  }

  return null;
}
