import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { text, filename, format } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }
    
    // Use OpenAI GPT-4o Mini for intelligent parsing
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }
    
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });
    
    const prompt = `You are an expert at parsing academic syllabi. Extract structured information from the following syllabus text and return it as valid JSON.

SYLLABUS TEXT:
${text}

CRITICAL: You must return ONLY valid JSON. No additional text, no explanations, no markdown formatting.

CRITICAL DATE EXTRACTION RULES:
- Dates MUST be extracted in YYYY-MM-DD format (e.g., "2025-01-15", "2025-03-20")
- Look for dates in various formats: "January 15, 2025", "1/15/2025", "15-Jan-2025", "Jan 15", "10/15", etc.
- Convert all dates to YYYY-MM-DD format
- If only month/day is given, infer the year from the semester/year context in the syllabus
- If the syllabus says "Fall 2025" and an assignment is due "October 15", use "2025-10-15"
- If no year is specified, use the current academic year (2025)
- DO NOT use null for dates that are clearly stated in the syllabus text
- Common date patterns to look for:
  * "Due: [date]", "Due Date: [date]", "Deadline: [date]", "Submit by: [date]"
  * "Exam on [date]", "Test on [date]", "Midterm: [date]", "Final: [date]"
  * Assignment schedules, exam schedules, calendar sections, timeline sections
- Be thorough - scan the entire document for dates, not just obvious sections

CRITICAL CLASS TIME & LOCATION EXTRACTION RULES:
- For schedule items: Extract meeting days, times, and locations from the schedule section
- If the course is asynchronous/online/async, the schedule should indicate this and classTime should be "Asynchronous" or "Async" or "Online"
- Look for keywords: "asynchronous", "async", "online", "remote", "virtual", "no meeting times", "self-paced"
- If class has specific meeting times, extract them exactly (e.g., "MWF 9:00 AM - 9:50 AM", "T/Th 2:00 PM - 3:30 PM")
- For location: Extract the building and room number if available (e.g., "Science Building Room 201", "Langdale Hall 300")
- If the course is async/online, location should be "Online"
- If no location is found and course is not async, use "Not specified" or "Not found"
- Look for location patterns: "Room", "Building", "Hall", "Campus", "Location:", "Meets in:", "Classroom:"
- Combine multiple schedule items if the class meets multiple times per week

Extract the following information and return as JSON:

{
  "courseInfo": {
    "title": "Course title or null",
    "instructor": "Instructor name or null", 
    "credits": "Number of credits or null",
    "semester": "Semester name or null",
    "year": "Academic year or null",
    "courseCode": "Course code or null",
    "department": "Department name or null",
    "classTime": "string describing meeting days/times, 'Asynchronous'/'Async'/'Online' for async courses, or null (extract from schedule)",
    "location": "string with building and room if IRL, 'Online' if async, 'Not specified' or 'Not found' if none (extract from schedule)"
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
      "dueDate": "YYYY-MM-DD format or null (MUST extract actual dates from syllabus, do not use null if date is present)",
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

    // Use GPT-4o Mini for syllabus parsing
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at parsing academic syllabi. Extract structured information and return ONLY valid JSON. No additional text, no explanations, no markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });
    
    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }
    
    // Parse the JSON response (OpenAI JSON mode should return clean JSON)
    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      // Fallback: try to clean up if there's any markdown
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      try {
        parsedData = JSON.parse(cleanContent);
      } catch (e) {
        console.error('Failed to parse OpenAI response as JSON:', content);
        throw new Error('Invalid JSON response from AI');
      }
    }
    
    // Add metadata
    parsedData.metadata = {
      parsedAt: new Date().toISOString(),
      source: filename,
      format: format
    };
    
    return NextResponse.json(parsedData);
    
  } catch (error: any) {
    console.error('AI extraction error:', error);
    const errorMessage = error?.message || error?.error?.message || 'Unknown error';
    console.error('OpenAI error details:', errorMessage, error?.response?.status, error?.status);
    return NextResponse.json({ 
      error: errorMessage,
      details: error?.response?.data || error?.error || 'Unknown error'
    }, { status: 500 });
  }
}
