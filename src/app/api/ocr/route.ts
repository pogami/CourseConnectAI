import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log("📸 OCR API: Received request");
  try {
    const { image, mimeType } = await request.json();

    if (!image) {
      console.error("❌ OCR API: No image provided");
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Clean base64 data if it contains the prefix
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    console.log("🔍 OCR API: Image data length:", base64Data.length, "Mime:", mimeType);

    const model = "gpt-4o";
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are an expert OCR tool. Your task is to extract all text from the provided image, especially handwritten notes. Return ONLY the extracted text. Do not include any conversational filler, greetings, or explanations. Maintain the original formatting and structure as much as possible."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all text from this image exactly as it appears." },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${base64Data}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      // Use max_completion_tokens for newer models (o1, o3), max_tokens for older models
      ...(model.startsWith('o1') || model.startsWith('o3') 
        ? { max_completion_tokens: 2000 }
        : { max_tokens: 2000 }
      ),
    });

    const text = response.choices[0]?.message?.content || "";
    console.log("✅ OCR API: Extraction successful, length:", text.length);

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("🚨 OCR API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process image" },
      { status: 500 }
    );
  }
}
