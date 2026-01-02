import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds max for AI extraction

const SyllabusExtractionSchema = z.object({
  syllabusText: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { syllabusText } = SyllabusExtractionSchema.parse(body);
    
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
      }, { status: 500 });
    }
    
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

const prompt = `Extract course information from this syllabus and return ONLY valid JSON. Use null for missing fields.

IMPORTANT: Look carefully for the professor/instructor name. It might be listed as:
- "Instructor:", "Professor:", "Instructor Name:", "Faculty:", "Teacher:"
- In a header section or contact information
- After "Dr.", "Prof.", "Mr.", "Ms.", or similar titles
- In email addresses (extract the name before @)

CRITICAL DATE EXTRACTION RULES:
- Dates MUST be extracted in YYYY-MM-DD format (e.g., "2025-01-15", "2025-03-20")
- Look for dates in various formats: "January 15, 2025", "1/15/2025", "15-Jan-2025", "Jan 15", etc.
- Convert all dates to YYYY-MM-DD format
- If only month/day is given, infer the year from the semester/year context
- If the syllabus says "Fall 2025" and an assignment is due "October 15", use "2025-10-15"
- If no year is specified, use the current academic year (2025)
- DO NOT use null for dates that are clearly stated in the syllabus
- Common date patterns to look for:
  * "Due: [date]", "Due Date: [date]", "Deadline: [date]"
  * "Exam on [date]", "Test on [date]", "Midterm: [date]"
  * Assignment schedules, exam schedules, calendar sections

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

    // Use OpenAI GPT-4o Mini for syllabus analysis
    let aiResponse: string;
    let selectedModel: string;
    
    try {
      console.log('🤖 Using OpenAI GPT-4o Mini for syllabus analysis...', { syllabusTextLength: syllabusText.length });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting course information from syllabi. Return ONLY valid JSON. Use null for missing fields.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      });
      
      aiResponse = completion.choices[0]?.message?.content || '';
      selectedModel = 'openai';
      console.log('✅ OpenAI GPT-4o Mini succeeded for syllabus analysis, response length:', aiResponse.length);
    } catch (error: any) {
      console.error('OpenAI failed:', error);
      const errorMessage = error?.message || error?.error?.message || 'Unknown error';
      console.error('OpenAI error details:', errorMessage, error?.response?.status, error?.status);
      return NextResponse.json({
        success: false,
        error: errorMessage
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
