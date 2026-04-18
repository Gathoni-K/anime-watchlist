// api/tools/animeData.ts

import { Anthropic } from '@anthropic-ai/sdk';
import type { AnimeSearchArgs, AnimeDetails } from '../types/ai';

// 1. Define it strictly as Anthropic.Tool so TS enforces the literal types
export const getAnimeDataTool: Anthropic.Tool = {
    name: "get_anime_data",
    description: "Fetches detailed information about a specific anime title, including synopsis, genres, release year, and average score. Use this whenever the user asks for details or stats about a specific show.",
    input_schema: {
        type: "object", // TS now knows this is specifically the literal "object"
        properties: {
            searchQuery: { 
                type: "string", 
                description: "The name of the anime to search for" 
            }
        },
        required: ["searchQuery"]
    }
};

// 2. The execution function remains the same
export async function fetchAnimeData(args: AnimeSearchArgs): Promise<AnimeDetails> {
    console.log(`[Backend] Fetching data for: ${args.searchQuery}`);
    
    // REPLACE WITH YOUR ACTUAL FETCH
    return {
        title: args.searchQuery,
        synopsis: "This is a placeholder synopsis. Replace with real API data.",
        releaseYear: 2024,
        score: 9.0,
        genres: ["Action", "Adventure"]
    }; 
}