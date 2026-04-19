# AI AGENT SERVERLESS BLUEPRINT
*(Originally created for ANITRACK 2.0 - SenpAI)*

This document is a reusable map for wiring an AI agent into any project that needs Tool Calling (i.e., the AI fetches live data from a third-party service before answering). It covers a React frontend calling a Vercel Serverless backend.

---

## Why Serverless Functions?

Serverless functions act as a secure middleman between your frontend and AI APIs. They are used for three reasons:

1. **Hiding secrets** — API keys (Gemini, Anthropic, etc.) never touch the browser.
2. **Bypassing CORS** — the browser blocks direct calls to third-party APIs. The serverless function makes those calls on the server side, where CORS doesn't apply.
3. **Heavy lifting** — complex AI loops and large data processing happen on the server, not the user's device.

---

## Setup

Before creating any files, install the Vercel Node adapter:

```bash
npm install -D @vercel/node
```

Then install your chosen AI SDK (see the Provider Swap Guide below).

---

## Project Architecture

Split your logic into three distinct layers:

```
api/                        ← Vercel reads serverless functions from here (root level)
  agent.ts                  ← THE BRAIN: manages the AI conversation loop
  animeData.ts              ← THE HANDS: tool schema + fetch logic (rename per project)
  types/
    ai.ts                   ← THE RULES: TypeScript interfaces
src/
  components/
    YourChatComponent.tsx   ← Frontend UI — calls /api/agent via fetch()
```

> **Critical:** Vercel's serverless functions must live in the **root-level `/api/` folder**, not inside `/src/api/`. If your files are in `src/api/`, Vercel will not find them and will throw confusing build errors.

---

## 1. Types (`api/types/ai.ts`)

**Rule of thumb:** Never use `any`. Use strict interfaces for your own data, and `unknown` for unpredictable data coming from the AI.

**What stays the same across every project:** `ToolDefinition`, `AiRequest`, `AiResponse`.

**What you change per project:** `MyToolArgs` and `MyToolResult` — rename and redefine these to match the data your specific tool needs and returns.

```typescript
// api/types/ai.ts

// ─────────────────────────────────────────────
// A. GENERIC AI TYPES — keep these every project
// ─────────────────────────────────────────────
export interface ToolDefinition {
    name: string;
    description: string;
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
    arguments?: Record<string, unknown>; // unknown = safer than any for AI output
    toolRequest?: unknown;
    finalHumanReadableText?: string;
}

// ─────────────────────────────────────────────
// B. PROJECT-SPECIFIC TYPES — change these per project
// ─────────────────────────────────────────────

// What arguments does the AI send to the tool?
export interface MyToolArgs {
    queryParameter: string;
}

// What does the tool return back to the AI?
export interface MyToolResult {
    dataField1: string;
    dataField2: number;
}
```

---

## 2. The Tool File (`api/myTool.ts`)

This file has two jobs:
- **The schema** — a description the AI reads to know *when* and *how* to call this tool.
- **The execution function** — the actual code that fetches the real data.

**What stays the same across every project:** the file structure (schema + execution function).

**What you change per project:** the tool `name`, `description`, `parameters`/`inputSchema`, the argument types, and the fetch logic inside the execution function.

> **Important:** The `description` field does not tell the AI *how to behave*. It tells the AI *what this tool does* and *under what specific conditions it should be called*. Be highly descriptive.

> **Provider note:** The tool schema format differs by AI provider. See the Provider Swap Guide below.

```typescript
// api/myTool.ts — Generic template
import type { MyToolArgs, MyToolResult } from './types/ai';

// The schema — what you advertise to the AI
// Gemini format uses `parameters`, Anthropic uses `input_schema`
export const mySpecificTool = {
    name: "fetch_external_data",        // underscore_separated
    description: "Fetches X from Y database. Use this ONLY when the user asks about Z.",
    parameters: {                        // ← Gemini format (change to input_schema for Anthropic)
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

// The execution function — hits the real API or database
export async function executeMyTool(args: MyToolArgs): Promise<MyToolResult> {
    console.log(`[Tool] Executing with:`, args);

    // REPLACE WITH YOUR ACTUAL FETCH LOGIC:
    // const res = await fetch(`https://api.example.com/data?q=${args.queryParameter}`);
    // const data = await res.json();

    return {
        dataField1: "placeholder",
        dataField2: 0
    };
}
```

---

## 3. The Agent File (`api/agent.ts`)

This is your serverless endpoint. It handles incoming POST requests, runs the AI loop, and manages the tool "handoff" — sending the AI's tool request to your execution function, then sending the result back to the AI.

**What stays the same across every project:** the Vercel handler structure, the `if (request.method !== 'POST')` guard, the try/catch, and the overall loop shape (initial call → check for tool use → handoff → return final text).

**What you change per project:** the AI SDK, the model name, the system prompt, and the tool/argument names.

```typescript
// api/agent.ts — Generic template (provider-agnostic pseudocode)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { mySpecificTool, executeMyTool } from './myTool';
import type { MyToolArgs, MyToolResult } from './types/ai';

// Replace with your actual SDK initialisation
const aiClient = initAiClient(process.env.YOUR_API_KEY!);

export async function handleAiLogic(userPrompt: string): Promise<string> {

    // 1. Initial call to the AI
    const firstResponse = await aiClient.chat({
        model: "your-model-name",
        systemPrompt: "You are a helpful assistant.",
        tools: [mySpecificTool],
        message: userPrompt
    });

    // 2. Did the AI request a tool?
    const toolCall = firstResponse.toolCall;

    if (toolCall && toolCall.name === 'fetch_external_data') {
        const aiArguments = toolCall.args as MyToolArgs;

        // 3. Execute the tool
        const freshData: MyToolResult = await executeMyTool(aiArguments);

        // 4. Handoff — send the tool result back to the AI
        const finalResponse = await aiClient.chat({
            model: "your-model-name",
            tools: [mySpecificTool],
            history: [
                { role: "user", content: userPrompt },
                { role: "assistant", content: firstResponse.raw }
            ],
            toolResult: {
                name: 'fetch_external_data',
                data: freshData
            }
        });

        return finalResponse.text ?? "Sorry, I lost my train of thought!";
    }

    // 5. No tool needed — return the direct answer
    return firstResponse.text ?? "Sorry, I couldn't generate a response.";
}

// Vercel endpoint handler — this part never changes
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
```

---

## Provider Swap Guide

The overall loop structure never changes. What changes per provider is: the SDK import, the client initialisation, the tool schema format, and how you read the tool call and final text from the response.

### Gemini (Google) — Free tier available

```bash
npm install @google/generative-ai
```

```typescript
// api/agent.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { mySpecificTool, executeMyTool } from './myTool';
import type { MyToolArgs, MyToolResult } from './types/ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function handleAiLogic(userPrompt: string): Promise<string> {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: "You are a helpful assistant.",
        tools: [{ functionDeclarations: [mySpecificTool] }]
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(userPrompt);
    const response = result.response;

    // Check for tool call
    const functionCall = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;

    if (functionCall && functionCall.name === 'fetch_external_data') {
        const aiArguments = functionCall.args as MyToolArgs;
        const freshData: MyToolResult = await executeMyTool(aiArguments);

        // Handoff
        const finalResult = await chat.sendMessage([{
            functionResponse: {
                name: 'fetch_external_data',
                response: freshData
            }
        }]);

        return finalResult.response.text() || "Sorry, I lost my train of thought!";
    }

    return response.text() || "Sorry, I couldn't generate a response.";
}
```

**Tool schema format for Gemini** — use `parameters`:
```typescript
export const mySpecificTool = {
    name: "fetch_external_data",
    description: "...",
    parameters: {                   // ← Gemini uses `parameters`
        type: "object",
        properties: { queryParameter: { type: "string", description: "..." } },
        required: ["queryParameter"]
    }
};
```

**Gemini free tier limits:**
- `gemini-2.0-flash` has a per-minute and a daily request cap. If you hit it, wait until midnight Pacific Time for the daily quota to reset.
- If you hit the per-minute cap, wait ~60 seconds and retry.

---

### Anthropic (Claude) — Paid only

```bash
npm install @anthropic-ai/sdk
```

```typescript
// api/agent.ts
import Anthropic from '@anthropic-ai/sdk';   // default import, NOT named { Anthropic }
import { mySpecificTool, executeMyTool } from './myTool';
import type { MyToolArgs, MyToolResult } from './types/ai';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function handleAiLogic(userPrompt: string): Promise<string> {
    const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: "You are a helpful assistant.",
        messages: [{ role: "user", content: userPrompt }],
        tools: [mySpecificTool as Anthropic.Tool]
    });

    if (message.stop_reason === 'tool_use') {
        const toolUseBlock = message.content.find(block => block.type === 'tool_use');

        if (toolUseBlock && toolUseBlock.type === 'tool_use' && toolUseBlock.name === 'fetch_external_data') {
            const aiArguments = toolUseBlock.input as unknown as MyToolArgs;
            const freshData: MyToolResult = await executeMyTool(aiArguments);

            // Handoff
            const finalResponse = await anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 1024,
                system: "You are a helpful assistant.",
                tools: [mySpecificTool as Anthropic.Tool],
                messages: [
                    { role: "user", content: userPrompt },
                    { role: "assistant", content: message.content },
                    {
                        role: "user",
                        content: [{
                            type: "tool_result",
                            tool_use_id: toolUseBlock.id,
                            content: JSON.stringify(freshData)
                        }]
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
```

**Tool schema format for Anthropic** — use `input_schema`:
```typescript
export const mySpecificTool: Anthropic.Tool = {
    name: "fetch_external_data",
    description: "...",
    input_schema: {                 // ← Anthropic uses `input_schema`
        type: "object",
        properties: { queryParameter: { type: "string", description: "..." } },
        required: ["queryParameter"]
    }
};
```

> **Common Anthropic gotcha:** Always use the default import (`import Anthropic from '@anthropic-ai/sdk'`), not the named import (`import { Anthropic }`). The named import resolves to `undefined` and causes a cryptic esbuild error downstream.

---

## 4. Connecting to the Frontend

The frontend never talks to the AI directly. It only talks to your `/api/agent` endpoint. This keeps your API keys safe and avoids CORS errors.

**What stays the same across every project:** the `fetch()` call shape, the loading state pattern, and the message list structure.

**What you change per project:** the component's UI, the placeholder text, and any project-specific message formatting.

### Generic React Chat Component

```tsx
// src/components/AiChat.tsx
import React, { useState } from 'react';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

export default function AiChat() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'Hello! How can I help you today?' }  // ← change greeting
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage = inputText.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/agent', {   // ← must match your api filename
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userMessage }),
            });

            if (!response.ok) throw new Error('Network error');

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'ai', content: data.text }]);

        } catch (error) {
            console.error("Fetch error:", error);
            setMessages(prev => [...prev, {
                role: 'ai',
                content: 'Sorry, something went wrong. Please try again.'  // ← change error message
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div>
            <div>
                {messages.map((msg, i) => (
                    <div key={i} className={msg.role}>
                        {msg.content}
                    </div>
                ))}
                {isLoading && <div>AI is thinking...</div>}
            </div>

            <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Type your message..."
            />
            <button onClick={handleSend} disabled={isLoading || !inputText.trim()}>
                Send
            </button>
        </div>
    );
}
```

### The Contract Between Frontend and Backend

The frontend and backend communicate through a simple JSON contract. As long as both sides honour it, the UI and the AI logic are completely independent of each other.

| Direction | Shape |
|---|---|
| Frontend → Backend | `POST /api/agent` with body `{ prompt: "user's message" }` |
| Backend → Frontend | `200 OK` with body `{ text: "AI's response" }` |
| Backend → Frontend (error) | `500` with body `{ error: "Failed to generate response" }` |

The frontend reads `data.text`. The backend writes `response.status(200).json({ text: finalAnswer })`. Those two must always match.

---

## Environment Variables

Store all API keys in a `.env` file at the project root. Never commit this file.

```bash
# .env
GEMINI_API_KEY=your_key_here
# or
ANTHROPIC_API_KEY=your_key_here
```

If deploying to Vercel, also add them in **Vercel Dashboard → Your Project → Settings → Environment Variables**.

---

## Common Errors & What They Actually Mean

| Error | Real Cause |
|---|---|
| `Expected identifier but found "}"` (esbuild) | A file you import doesn't exist at that path, or has a broken import of its own. Run `npx tsc --noEmit` for the real error location. |
| `404 Not Found` on a model name | Your SDK version is too old and doesn't know the model. Run `npm install @google/generative-ai@latest` and retry. |
| `429 Too Many Requests` | You hit the free tier rate limit. Wait ~60 seconds (per-minute cap) or until midnight Pacific Time (daily cap). |
| `400 credit balance too low` | Your Anthropic account has no credits. Add credits at console.anthropic.com or switch to Gemini. |
| `named import { Anthropic } resolves to undefined` | Use `import Anthropic from '@anthropic-ai/sdk'` (default import), not `{ Anthropic }`. |
| Vercel can't find your API file | Your file is in `src/api/` but Vercel only reads from the root `/api/` folder. Move files to root `/api/`. |

---

## New Project Checklist

When copying this blueprint to a new project:

- [ ] Install `@vercel/node` and your chosen AI SDK
- [ ] Create root-level `/api/` folder (not inside `/src/`)
- [ ] Add your API key to `.env` and to Vercel Environment Variables
- [ ] In `api/types/ai.ts`, rename `MyToolArgs` and `MyToolResult` to match your project's data
- [ ] In your tool file, write a specific `description`, update the `name` (use underscores), and replace the placeholder fetch with your real API call
- [ ] In `api/agent.ts`, update the model name, system prompt, and tool/argument names
- [ ] In your React component, make sure `fetch('/api/your-filename')` matches your actual API filename
- [ ] Make sure the frontend reads `data.text` and the backend writes `{ text: finalAnswer }`