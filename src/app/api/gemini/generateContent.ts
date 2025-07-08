import { GoogleGenAI } from '@google/genai';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const context = `Your task is to identify the closest metro stations to the user's current location and destination.
To do that you need to ask the user for their current location and destination or to deduce it from the user's message.

You need to determined the closest metro station from the location and the destination. Be very carefull when writing the name and match perfectly the original name of the station. Once you determined the closest stations, output the following JSON object:
{
  "from_station": "Closest Station Name to Start",
  "to_station": "Closest Station Name to Destination"
}
CRITICAL INSTRUCTIONS:
- Do not invent the user location or destination, it should be mentionned or deduced. 
- You must NEVER output any JSON or code block until BOTH the starting point and destination are known.
- When BOTH locations are known, you MUST output ONLY the raw JSON object.
- DO NOT add any text, explanations, or comments before or after the JSON.
- DO NOT say "Okay, I understand" or any similar phrases.
- DO NOT use phrases like "Here is the JSON" or "The result is".
- The response must be ONLY the JSON object, nothing else.
`;

export async function generateGeminiResponse(
  userMessage: string,
  history?: { from: string; text: string }[]
) {
  let fullPrompt = context + '\n\n';
  if (history && history.length > 0) {
    fullPrompt += history.map(msg => `${msg.from === 'user' ? 'Utilisateur' : 'Assistant'}: ${msg.text}`).join('\n') + '\n';
  }
  fullPrompt += `Utilisateur: ${userMessage}`;

  const contents = [
    { parts: [{ text: fullPrompt }] }
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents,
  });
  return response.text;
} 