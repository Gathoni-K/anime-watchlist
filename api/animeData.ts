import type { AnimeSearchArgs, AnimeDetails } from './types/ai';

// Gemini function declaration format (no Anthropic types needed)
export const getAnimeDataTool = {
    name: "get_anime_data",
    description: "Fetches detailed information about a specific anime title, including synopsis, genres, release year, and average score. Use this whenever the user asks for details or stats about a specific show.",
    parameters: {
        type: "object",
        properties: {
            searchQuery: {
                type: "string",
                description: "The name of the anime to search for"
            }
        },
        required: ["searchQuery"]
    }
};

export async function fetchAnimeData(args: AnimeSearchArgs): Promise<AnimeDetails> {
    console.log(`[Backend] Fetching data for: ${args.searchQuery}`);
    return {
        title: args.searchQuery,
        synopsis: "This is a placeholder synopsis. Replace with real API data.",
        releaseYear: 2024,
        score: 9.0,
        genres: ["Action", "Adventure"]
    };
}