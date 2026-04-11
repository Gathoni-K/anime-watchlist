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

## Tool calling.

-This is used whenever our AI Needs access to data from a third party service.

-The generic template for this would be:

    <!-- Define Interfaces. -->

    export interface ToolDefinition {
        name: string;
        description: string;
        inputSchema: Record<string, any>;
        //usually a JSON schema object
    }

    <!-- Define what we send to the AI API -->
    export interface AiRequest {
        prompt?: string;
        history?: any[];
        toolsAvailable: ToolDefinition[];
        newToolData?: any;
    }

    <!-- Defining what our response from the AI API is -->
    export interface AiResponse {
        reasonForStopping: 'I_NEED_A_TOOL' | 'FINISHED' | 'ERROR';
        toolName?:string;
        arguments?: Record<string, any>;
        toolRequest?: any;
        finalHumanReadableText?: string;
    }

    declare function callAiApi(request: AiRequest): Promise<AiResponse>;
    declare function yourNormalFunction(args: Record<string, any>): Promise<any>;

    export async function handleAiLogic(userPrompt: string) : Promise<string> {

        const myTools: ToolDefinition[] = [
            name: "get_data_from_somewhere",
            description: "Explain exactly when the AI should use this",
            inputSchema: {
                type: "object",
                properties: {
                    param1: {type: "string" }
                },
                required: ["param1"]
            }
        ]
    

    let aiResponse: AiResponse = await callAiApi({
        prompt: userPrompt,
        toolsAvailable: myTools
    });

    if (aiResponse.reasonForStopping === 'I_NEED_A_TOOL') {
        
        const requestedTool = aiResponse.toolName;
        const aiArguments = aiResponse.arguments;

        let freshData: any;
        //use a strict type here

        if(requestedTool === "get_data_from_somewhere" && aiArguments) {
            freshData = await normalFunction(aiArguments);
        }

    <!-- THE HANDOFF
    -Call the AI API response a second time, passing the original history and the new data fetched -->
        aiResponse = await callAiApi({
            history: [userPrompt, aiReponse,toolRequest],
            newToolData: freshData,
            toolsAvailable: myTools
        });
    }

    return aiReponse.finalHumanReadbaleText ?? 'Sorry, I lost my train of thought!';

    }