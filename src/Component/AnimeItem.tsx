/*
Compnent holding our individual anime items, our individual 'tasks'

*/
import React from 'react';
import { MdDeleteOutline, MdOutlineRadioButtonUnchecked } from "react-icons/md";
import styles from './AnimeItem.module.css';

const AnimeItem = ({ anime, onDelete }) => {
    return (
    <div className={styles.animeItem}>
        <div className="animeImg">
            <img src={anime.image} alt={anime.title} />
        </div>
        <div className={styles.animeInfo}>
            <div className={styles.info}>
                <h4>Title: {anime.title} </h4>
                <p>No of episodes: {anime.episodes} </p>
                <p>Status: {anime.status} </p>
            </div>
            <div className={styles.button}>
            <MdOutlineRadioButtonUnchecked />
            <MdDeleteOutline onClick={()=> onDelete(anime.mal_id)} />
            </div>
        </div>
    </div>
    )
}

export default AnimeItem
