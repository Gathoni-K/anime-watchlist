# ANITRACK 2.0.

-The new version features an AI agent that provides custom anime recommendations to the user.

-SenpAI is the name of our AI agent and AI of choice is Gemini.

-We will achieve this using a serverless function.

-Serverless functions are used when one needs a backend to do a specific task, mostly:

1.to hide secrets, like API Keys.

2.bypassing CORS errors, acts as a middleman preventing the usual blockage by browser from directly talking to third-party APIs.

3.heavy lifting, a massive calculation etc.

-The general template for this file would be:

    //api/senpai.ts
    //the api folder is created at the root folder.

    import type { VercelRequest, VercelResponse } from '@vercel/node';

    export default async function handler(
        request: VercelRequest,
        response: VercelResponse
    ) {
        if (request.method !== 'POST'){
            return response.status(405).json({error: 'Method not allowed' });
        }

        try {
            const userPrompt = request.body.prompt;
            const apiKey = process.env.MY_SECRET_AP_KEY;

            <!-- AI LOGIC GOES HERE -->
        }
        catch (error) {
            console.error("Error: ", error);
            return response.status(500).json({ error: 'Failed to generate '});
        }
    }

-Install vercel/node using:

    npm install -D @vercel/node

-This is done before creating the file.