import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { getAnimeDataTool, fetchAnimeData } from './animeData';
import type { AnimeSearchArgs, AnimeDetails } from '../types/ai';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

export async function handleAiLogic(userPrompt: string): Promise<string> {
    const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307", 
        max_tokens: 1024,
        system: "You are SenpAI, an expert anime recommender. Be polite, energetic, and occasionally use anime terminology.",
        messages: [{ role: "user", content: userPrompt }],
        tools: [getAnimeDataTool as Anthropic.Tool] 
    });

    if (message.stop_reason === 'tool_use') {
        const toolUseBlock = message.content.find(block => block.type === 'tool_use');
        
        if (toolUseBlock && toolUseBlock.type === 'tool_use' && toolUseBlock.name === 'get_anime_data') {
            const aiArguments = toolUseBlock.input as unknown as AnimeSearchArgs;
            const freshData: AnimeDetails = await fetchAnimeData(aiArguments);

            const finalResponse = await anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 1024,
                system: "You are SenpAI, an expert anime recommender. Be polite, energetic, and occasionally use anime terminology.",
                tools: [getAnimeDataTool as Anthropic.Tool], 
                messages: [
                    { role: "user", content: userPrompt },
                    { role: "assistant", content: message.content }, 
                    {
                        role: "user",
                        content: [
                            {
                                type: "tool_result",
                                tool_use_id: toolUseBlock.id,
                                content: JSON.stringify(freshData) 
                            }
                        ]
                    }
                ]
            });

            const finalBlock = finalResponse.content[0];
            return finalBlock.type === 'text' ? finalBlock.text : "Sorry, I lost my train of thought!";
        }
    }

    const initialBlock = message.content[0];
    return initialBlock.type === 'text' ? initialBlock.text : "Sorry, I couldn't generate a response.";
}

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({error: 'Method not allowed'});
    }

    try {
        const userPrompt = request.body.prompt;
        if (!userPrompt) {
            return response.status(400).json({ error: 'Missing prompt in request body' });
        }

        const finalAnswer = await handleAiLogic(userPrompt);
        return response.status(200).json({ text: finalAnswer });
    }
    catch (error) {
        console.error("Endpoint Error: ", error);
        return response.status(500).json({ error: 'Failed to generate response' });
    }
}