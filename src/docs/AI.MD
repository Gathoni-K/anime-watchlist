```markdown
# AI AGENT SERVERLESS BLUEPRINT
*(Originally created for ANITRACK 2.0 - SenpAI)*

This document serves as a map for building an AI agent that requires access to third-party services (Tool Calling). It is designed for a frontend framework (like React) calling a Serverless backend.

### Why Serverless Functions?
Serverless functions are used as a backend to do specific tasks, mostly:
1. **To hide secrets:** Keeping API Keys (like Gemini or Anthropic keys) out of the frontend browser.
2. **Bypassing CORS errors:** Acting as a middleman, preventing the usual blockage by the browser when directly talking to third-party APIs.
3. **Heavy lifting:** Offloading massive calculations or complex AI loops from the user's device.

### Setup
Before creating the files, install the Vercel Node package:
```bash
npm install -D @vercel/node
```

---

## 📁 Project Architecture 

To keep the codebase scalable, we split our logic into three distinct parts:
1. **`types.ts` (The Rules):** Strict TypeScript definitions to avoid using `any`.
2. **`api/tools/` (The Hands / Action Logic):** Contains tool schemas (advertisements for the AI) and the physical functions that fetch external data.
3. **`api/agent.ts` (The Brain / AI Logic):** The serverless endpoint that manages the conversation loop, talks to the AI API, and hands data back and forth.

---

## 1. Defining Interfaces (`api/types.ts`)

**Rule of thumb:** Never use `any`. Use strict interfaces for your own data, and `unknown` for unpredictable data coming from the AI.

```typescript
// api/types.ts

// ---------------------------------------------------------
// A. GENERIC AI TYPES (Keep these for every project)
// ---------------------------------------------------------
export interface ToolDefinition {
    name: string;
    description: string; // The "advertisement" so the AI knows when to use it
    inputSchema: {
        type: string;
        properties: Record<string, { type: string; description?: string }>;
        required: string[];
    };
}

export interface AiRequest {
    prompt?: string;
    history?: { role: string; content: string }[]; 
    toolsAvailable: ToolDefinition[];
    newToolData?: unknown; 
}

export interface AiResponse {
    reasonForStopping: 'I_NEED_A_TOOL' | 'FINISHED' | 'ERROR';
    toolName?: string;
    arguments?: Record<string, unknown>; // Unpredictable AI output is 'unknown'
    toolRequest?: unknown;
    finalHumanReadableText?: string;
}

// ---------------------------------------------------------
// B. PROJECT-SPECIFIC TYPES (Change these per project)
// ---------------------------------------------------------

// What arguments does the tool need from the AI? (e.g., AnimeSearchArgs)
export interface MyToolArgs {
    queryParameter: string; 
}

// What does the tool return to the AI? (e.g., AnimeDetails)
export interface MyToolResult {
    dataField1: string;
    dataField2: number;
}
```

---

## 2. The Tool Folder (`api/tools/myTool.ts`)

This file contains the description the AI reads, and the actual execution logic. 

**Important:** The `description` field does *not* tell the AI how to behave. It tells the AI exactly what this tool does and under what specific conditions it should be called. Be highly descriptive.

```typescript
// api/tools/myTool.ts
import { ToolDefinition, MyToolArgs, MyToolResult } from '../types';

// 1. The definition we send to the AI
export const mySpecificTool: ToolDefinition = {
    name: "fetch_external_data", // Strict, underscore-separated name
    description: "Fetches specific data from X database. Use this ONLY when the user asks about Y.",
    inputSchema: {
        type: "object",
        properties: {
            queryParameter: { 
                type: "string", 
                description: "The specific item to search for" 
            }
        },
        required: ["queryParameter"]
    }
};

// 2. The actual function that hits the third-party API/Database
export async function executeMyTool(args: MyToolArgs): Promise<MyToolResult> {
    console.log(`Executing tool with arguments:`, args);
    
    // REPLACE THIS WITH ACTUAL FETCH LOGIC
    // e.g., const response = await fetch(`https://api.example.com/data?q=${args.queryParameter}`);
    
    return {
        dataField1: "Example string data",
        dataField2: 100
    }; 
}
```

---

## 3. The Main API File (`api/agent.ts`)

This is your serverless endpoint. It handles the POST request, initializes the AI, and manages the "handoff" loop if the AI requests a tool.

```typescript
// api/agent.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { mySpecificTool, executeMyTool } from './tools/myTool';
import { AiRequest, AiResponse, MyToolArgs, MyToolResult } from './types';

// Placeholder for the actual SDK call (e.g., Gemini's generateContent)
declare function callAiApi(request: AiRequest): Promise<AiResponse>;

// --- THE AI LOOP ---
export async function handleAiLogic(userPrompt: string): Promise<string> {
    
    // 1. Equip the tools
    const availableTools: ToolDefinition[] = [mySpecificTool];

    // 2. Initial Call to AI
    let aiResponse: AiResponse = await callAiApi({
        prompt: userPrompt,
        toolsAvailable: availableTools
    });

    // 3. Check if AI wants to use a tool
    if (aiResponse.reasonForStopping === 'I_NEED_A_TOOL') {
        
        const requestedTool = aiResponse.toolName;
        
        // Safely cast the unknown AI arguments to our strict TypeScript interface
        const aiArguments = aiResponse.arguments as unknown as MyToolArgs;

        // Strictly type the data we are about to fetch
        let freshData: MyToolResult | null = null;

        // 4. Route to the correct tool execution function
        if (requestedTool === "fetch_external_data" && aiArguments?.queryParameter) {
            freshData = await executeMyTool(aiArguments);
        }

        // 5. THE HANDOFF: Send the fetched data back to the AI to formulate an answer
        aiResponse = await callAiApi({
            history: [
                { role: "user", content: userPrompt },
                { role: "assistant", content: "Tool requested..." } // Mock history
            ],
            newToolData: freshData,
            toolsAvailable: availableTools
        });
    }

    // 6. Return final text
    return aiResponse.finalHumanReadableText ?? 'Sorry, an error occurred.';
}

// --- VERCEL ENDPOINT HANDLER ---
export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    // Only allow POST requests
    if (request.method !== 'POST'){
        return response.status(405).json({error: 'Method not allowed' });
    }

    try {
        const userPrompt = request.body.prompt;
        // Access environment variables securely here
        const aiApiKey = process.env.AI_API_KEY; 

        // Trigger the AI logic loop
        const finalAnswer = await handleAiLogic(userPrompt);
        
        // Send back to frontend
        return response.status(200).json({ text: finalAnswer });
    }
    catch (error) {
        console.error("Endpoint Error: ", error);
        return response.status(500).json({ error: 'Failed to generate response' });
    }
}

```

-For claude AI, the implementation of the above template would be:

    import type { VercelRequest, VercelResponse } from '@vercel/node';
    import Anthropic from '@anthropic-ai/sdk';

    // 1. Import your actual specific anime logic and types
    import { getAnimeDataTool, fetchAnimeData } from './animeData';
    import { AnimeDetails, AnimeSearchArgs } from '../types/ai'; 
    // (Notice we deleted AiRequest and AiResponse, we don't need them for Claude)

    // Initialize the Claude Client
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY, 
    });

    // --- THE CLAUDE AI LOOP ---
    export async function handleAiLogic(userPrompt: string): Promise<string> {
    
    // 1. Initial Call to Claude
    const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307", 
        max_tokens: 1024,
        messages: [{ role: "user", content: userPrompt }],
        // 2. Use your actual tool import here
        tools: [getAnimeDataTool] 
    });

    // 2. Check if Claude wants to use a tool
    if (message.stop_reason === 'tool_use') {
        
        // Find the specific block where Claude asked for the tool
        const toolUseBlock = message.content.find(block => block.type === 'tool_use');
        
        // Make sure the name matches the `name` you gave getAnimeDataTool
        if (toolUseBlock && toolUseBlock.name === 'get_anime_data') {
            
            // Extract arguments and safely cast them to your Anime arguments
            const aiArguments = toolUseBlock.input as unknown as AnimeSearchArgs;
            
            // 3. Execute your actual fetch function
            const freshData: AnimeDetails = await fetchAnimeData(aiArguments);

            // 4. THE HANDOFF: Send it all back to Claude
            const finalResponse = await anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 1024,
                tools: [getAnimeDataTool], // Pass the actual tool again
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

            // 5. Safely return the final text to keep TS happy
            const finalBlock = finalResponse.content[0];
            return finalBlock.type === 'text' ? finalBlock.text : "Sorry, an error occurred.";
        }
    }

    // 6. If Claude didn't need a tool, just return its normal answer safely
    const initialBlock = message.content[0];
    return initialBlock.type === 'text' ? initialBlock.text : "Sorry, an error occurred.";
    }

    // --- VERCEL ENDPOINT HANDLER ---
    export default async function handler(
        request: VercelRequest,
        response: VercelResponse
    ) {
        if (request.method !== 'POST') return response.status(405).json({error: 'Method not allowed'});

        try {
            const finalAnswer = await handleAiLogic(request.body.prompt);
            return response.status(200).json({ text: finalAnswer });
        }
        catch (error) {
            console.error("Endpoint Error: ", error);
            return response.status(500).json({ error: 'Failed to generate response' });
        }
    }


---

### 📝 Checklist for Using This Template in a New Project
Whenever you copy this template for a new project, follow these steps to wire it up:
1. [ ] Update your `.env` variables and ensure they match the names in `api/agent.ts`.
2. [ ] In `types.ts`, replace `MyToolArgs` and `MyToolResult` with interfaces that match the actual data your new project needs.
3. [ ] In `api/tools/`, rename the tool file, update the `name` (use underscores), and write a highly specific `description`.
4. [ ] In `api/tools/`, write the actual `fetch()` or Database query inside the execution function.
5. [ ] In `api/agent.ts`, replace the dummy `callAiApi` implementation with the actual SDK logic (Gemini, Claude, OpenAI, etc.).


## CONNECTING TO THE FRONTEND





