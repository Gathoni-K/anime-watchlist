**Planning out our app**

**User journey**
-User inputs the name of the movie, api fetches our movie, displays the information about the movie, user adds movie to watchlist using button then the movie is displayed on the body.
-Is basically a to-do app but for movies, only difference is that we are fetching data from an API.


**Data Structure**
-Defining the data we will fetch from our API.
-We need the title in japanese or english, the image, the number of episodes, the status.

**API planning**
-Use 'Jikan API'.
-Search by title.

**User interactions**
Search anime, add to list, remove from list and marked as watch.

**Defining the different UI states**
-empty state: only input showing.
-searching state: add button shown here
-search results: anime fetched from API.
-watchlist view: anime added to body and an option to mark it completed or delete it is present.
-error state : when anime is not found.


**Setting up our app**
-Run:
    'npm install react-icons'
this will install all the icons.

**Components needed**
Input: will have our input button and our add button
MainWrapper: component where all our anime will go.
AnimeItem: individual component holding a single anime with all its info, is a child of the MainWrapper


**Setting up the states in my app**
-You do not need to define a state variable for a single UI state.
-To figure out states:
1.Start with the user actions, things the user can do: 
    type in input, click search, add anime to list, delete anime.
2.Identify the data that changes: list of anime in our watchlist, results from API search and if we are waiting for our API.

loading: tracks when the API calls are happening.
animeList: store user's permanent watchlist
<!-- searchResults: stores temporary API search results. -->
<!-- we will not use the have state because it needs a more complex UI, say if I want to preview the search results before actually adding it to our body. -->


**Build in layers approach**
1.Static UI first.
2.Add state management.
3.API integration.
4.Polish and error handling.

**Folders added for our app**
the api folder contains the function that will handle the API call.
-the types folder contains the types for our data structure.
-the components of course contains our components.
-We will be styling our app using CSS modules.


**Logic Implementation**
-Type anime name → Click "Add" → API call → Immediately add to animeList → Display in MainWrapper

-Defining the state setter function:
What does setLoading do? 
fetches data from our api

What does setAnimeLIst do?
-When one has clicked the add button, adds data fetched from our api as an item.
Mapping will be done in our MainWrapper component, where every anime is added as an individual item to our body.

**Adding and deleting functionality**
-Will be handled in our AnimeItem component.

**Typing our app**
States: 
-one only needs to type the state if they are either null or undefined or if they're complex initial states.


**useEffect() hook**
-Lets one perform side effects inour components.
-Common use cases:
    1.Fetching data.
    2.Setting up subscriptions.
    3.Manual DOM manipulations.
    4.localStorage.
    4.Timers, intervals.

-Think of it like "Do this stuff after the component renders but only when these specific things change."
-Persistence logic stays where the state it is persisting.
-most of our logic is handled in our main app component, state logic stays with state owner





