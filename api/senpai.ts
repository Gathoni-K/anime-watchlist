import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAnimeDataTool, fetchAnimeData } from './animeData';
import type { AnimeSearchArgs, AnimeDetails } from './types/ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function handleAiLogic(userPrompt: string): Promise<string> {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: "You are SenpAI, an expert anime recommender. Be polite, energetic, and occasionally use anime terminology.",
        tools: [{ functionDeclarations: [getAnimeDataTool] }]
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(userPrompt);
    const response = result.response;

    // Check if Gemini wants to use a tool
    const functionCall = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;

    if (functionCall && functionCall.name === 'get_anime_data') {
        const aiArguments = functionCall.args as unknown as AnimeSearchArgs;
        const freshData: AnimeDetails = await fetchAnimeData(aiArguments);

        // Send tool result back to Gemini
        const finalResult = await chat.sendMessage([{
            functionResponse: {
                name: 'get_anime_data',
                response: freshData
            }
        }]);

        const finalText = finalResult.response.text();
        return finalText || "Sorry, I lost my train of thought!";
    }

    return response.text() || "Sorry, I couldn't generate a response.";
}

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userPrompt = request.body.prompt;
        if (!userPrompt) {
            return response.status(400).json({ error: 'Missing prompt in request body' });
        }

        const finalAnswer = await handleAiLogic(userPrompt);
        return response.status(200).json({ text: finalAnswer });

    } catch (error) {
        console.error("Endpoint Error: ", error);
        return response.status(500).json({ error: 'Failed to generate response' });
    }
}