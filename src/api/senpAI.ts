import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userPrompt = request.body.prompt;
        const apiKey = process.env.CLAUDE_API_KEY;

        // AI LOGIC HERE

    }
    catch (error) {
        console.error("Error: ", error);
        return response.status(500).json({ error: 'Failed to generate' });
    }
}