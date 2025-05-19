import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Gemini AI client
export function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set")
  }

  return new GoogleGenerativeAI(apiKey)
}

// Helper function to extract JSON from a potentially markdown-formatted string
function extractJsonFromResponse(text: string): string {
  // Check if the response is wrapped in markdown code blocks
  const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/
  const match = text.match(jsonRegex)

  if (match && match[1]) {
    // Return the content inside the code block
    return match[1].trim()
  }

  // If no code blocks found, return the original text
  return text.trim()
}

// Generate content with Gemini AI
export async function generateContent(prompt: string): Promise<string> {
  const genAI = createGeminiClient()
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  try {
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    console.error("Error generating content with Gemini AI:", error)
    throw error
  }
}

// Parse structured data with Gemini AI
export async function parseStructuredData<T>(prompt: string): Promise<T | null> {
  const genAI = createGeminiClient()
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Extract JSON from potentially markdown-formatted response
    const jsonString = extractJsonFromResponse(text)

    // Try to parse as JSON
    try {
      return JSON.parse(jsonString) as T
    } catch (e) {
      console.error("Failed to parse JSON from Gemini response:", e)
      console.log("Raw response:", text)
      console.log("Extracted JSON string:", jsonString)
      return null
    }
  } catch (error) {
    console.error("Error parsing structured data with Gemini AI:", error)
    throw error
  }
}
