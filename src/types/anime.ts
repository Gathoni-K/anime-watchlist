// file containing types for the data we are to receive.
//data we are fetching from our api include: title, image, number of episodes and status


export type Anime = {
    mal_id: number;
    title: string;
    episodes: number;
    status: string;
    image: {
        jpg: {
            image_url: string;
        }
    };
    watchStatus: "watching" | "completed";
}
//type defining the data we are to receive from our api.
