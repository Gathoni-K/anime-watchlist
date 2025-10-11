import './App.css';
import React from 'react';
import {  useEffect, useState } from 'react';
import Input from './Component/Input';
import MainWrapper from './Component/MainWrapper';  
import type { Anime } from './types/anime';
import { fetchAnime } from './api/jikanApi';

function App() {
  // const [loading, setLoading] = useState(boolean);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  //the initial value is an empty array.
  const handleAddAnime= async (name: string) => {
    //function to handle what happens.
    // setLoading(true);
    const newAnime = await fetchAnime(name);
    setAnimeList(prev => [...prev, newAnime]);
    // setLoading(false);
  }
  useEffect(()=> {
    const saved = localStorage.getItem("animeList");
    if(saved) {
      setAnimeList(JSON.parse(saved));
    }
  }, [])
  // the block of code above will handle data persistence, storing our anime in localStorage.
  useEffect(()=> {
    localStorage.setItem("animeList", JSON.stringify(animeList));
  }, [animeList])
  //this function runs every time animeList changes
  const handleDeleteAnime = (id: number) => {
    setAnimeList(prev => prev.filter(anime => anime.mal_id !== id));
  }
  /* 
  our function excludes the anime with a matching mal_id.
  then proceeds to update the state with the new array.

  */

  
  return (
    <>
      <Input onAddAnime={handleAddAnime}/>
      <MainWrapper animeList={animeList} onDeleteAnime={handleDeleteAnime}/>
    </>
  )
}

export default App
