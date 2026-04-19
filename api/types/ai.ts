// 1. Define exactly what your anime fetch function returns
export interface AnimeDetails {
    title: string;
    synopsis: string;
    releaseYear: number;
    score: number;
    genres: string[];
}

// 2. Define the arguments your tool expects to receive from the AI
export interface AnimeSearchArgs {
    searchQuery: string;
}

// 3. Strict Tool Definition 
export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: Record<string, { type: string; description?: string }>;
        required: string[];
    };
}

// 4. Strict AI Request/Response (Mocking the SDK)
export interface AiRequest {
    prompt?: string;
    history?: { role: string; content: string }[]; // Strict history array
    toolsAvailable: ToolDefinition[];
    newToolData?: unknown; // 'unknown' is safer than 'any'. It forces you to validate before using.
}

export interface AiResponse {
    reasonForStopping: 'I_NEED_A_TOOL' | 'FINISHED' | 'ERROR';
    toolName?: string;
    arguments?: Record<string, unknown>; // We don't know exactly what the AI will send, so 'unknown' is safest
    toolRequest?: unknown;
    finalHumanReadableText?: string;
}