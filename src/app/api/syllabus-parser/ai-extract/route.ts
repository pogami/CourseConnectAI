import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, filename, format } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }
    
    // Use Google AI Gemini 3 Flash Preview for intelligent parsing
    const googleApiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE;
    
    if (!googleApiKey) {
      return NextResponse.json({ error: 'Google AI API key not configured' }, { status: 500 });
    }
    
    const prompt = `You are an expert at parsing academic syllabi. Extract structured information from the following syllabus text and return it as valid JSON.

SYLLABUS TEXT:
${text}

CRITICAL: You must return ONLY valid JSON. No additional text, no explanations, no markdown formatting.

Extract the following information and return as JSON:

{
  "courseInfo": {
    "title": "Course title or null",
    "instructor": "Instructor name or null", 
    "credits": "Number of credits or null",
    "semester": "Semester name or null",
    "year": "Academic year or null",
    "courseCode": "Course code or null",
    "department": "Department name or null"
  },
  "schedule": [
    {
      "day": "Day of week or null",
      "time": "Time or null", 
      "location": "Location or null",
      "type": "lecture/lab/discussion/exam/office_hours or null",
      "description": "Description or null"
    }
  ],
  "assignments": [
    {
      "name": "Assignment name or null",
      "type": "homework/exam/project/quiz/paper/presentation or null",
      "dueDate": "YYYY-MM-DD format or null",
      "weight": "Percentage as number or null",
      "description": "Description or null",
      "instructions": "Instructions or null"
    }
  ],
  "gradingPolicy": {
    "breakdown": {},
    "scale": {},
    "policies": []
  },
  "readings": [
    {
      "title": "Reading title or null",
      "author": "Author name or null",
      "required": "true/false or null",
      "week": "Week number or null",
      "chapter": "Chapter or null", 
      "pages": "Page numbers or null",
      "type": "textbook/article/handout/online or null"
    }
  ],
  "policies": {
    "attendance": "Attendance policy or null",
    "late": "Late work policy or null", 
    "academic_integrity": "Academic integrity policy or null",
    "technology": "Technology policy or null",
    "other": []
  },
  "contacts": {
    "instructor": {
      "name": "Instructor name or null",
      "email": "Email or null",
      "phone": "Phone or null", 
      "office": "Office location or null",
      "office_hours": "Office hours or null"
    },
    "tas": []
  },
  "confidence": 0.85,
  "requiresReview": false,
  "extractedFields": ["title", "instructor"],
  "missingFields": ["readings", "policies"]
}

IMPORTANT: Return ONLY the JSON object above, with actual values extracted from the syllabus text. Use null for missing information.`;

    // Use Gemini 3 Flash Preview for syllabus parsing
    const model = 'gemini-3-flash-preview';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`, {
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
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google AI API failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No content returned from Google AI');
    }
    
    // Clean up the response - remove any markdown formatting
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse Google AI response as JSON:', cleanContent);
      throw new Error('Invalid JSON response from AI');
    }
    
    // Add metadata
    parsedData.metadata = {
      parsedAt: new Date().toISOString(),
      source: filename,
      format: format
    };
    
    return NextResponse.json(parsedData);
    
  } catch (error) {
    console.error('AI extraction error:', error);
    return NextResponse.json({ 
      error: 'Failed to extract syllabus information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
