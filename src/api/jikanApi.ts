// file containing our api handling functions
/*

What do we need to do?
-Import our api url from our '.env' file.
-Building our url.
-Do the actual fetching and store in a variable.
-Convert our response from a json format to js object

*/
import type { Anime } from '../types/anime';

export const fetchAnime = async (name: string):Promise<Anime> => {
    //build our data fetching function passing id as the parameter, all anime will be identified by their id, fetched from the api
    try {
    const apiUrl = `https://api.jikan.moe/v4/anime?q=${name}`;
    //build our url and replace the id with the parameter we are supposed to receive,
    const response = await fetch(apiUrl);
    //fetch data needed for  our url
    if (!response.ok) {
        throw new Error(`HTTP ERROR! STATUS: ${response.status}`);
        //checks if our data fetching is successful, response in the range 200-299
    }
    const data = await response.json();
    //line of code responsible for converting our data from json to js object
    const firstResult = data.data[0];

    //need to destructure the data received from our API.
    const cleanData : Anime = {
        title: firstResult.title,
        mal_id: firstResult.mal_id,
        episodes: firstResult.episodes,
        status: firstResult.status,
        image: firstResult.images.jpg.image_url,
        watchStatus : "watching",

    };
    return cleanData;
    //return the data we have fetched from our api.
    /*
    while destructuring our data, our property names should be similar to our type property 
    names which are similar to the data we receive from our API.
    */

    } catch (error) {
        throw error;
    }
}

