import "./ListPage.css";
import React, { useEffect, useState, useMemo } from "react";
import { getPopularMovies, searchMovies, getGenres } from "../api/tmdb";
import { FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  genre_ids: number[];
  release_date: string;
}

interface Genre {
  id: number;
  name: string;
}

const StarIcon = FaStar as React.ElementType;

export default function ListPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [sortOption, setSortOption] = useState("popularity.desc");

  useEffect(() => {
    // Initial fetch of popular movies and genres
    Promise.all([getPopularMovies(), getGenres()]).then(([movies, genres]) => {
      setMovies(movies);
      setGenres(genres);
      setIsLoading(false);
    });
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setIsLoading(true);
    if (q.length > 1) {
      setMovies(await searchMovies(q));
    } else {
      setMovies(await getPopularMovies());
    }
    setIsLoading(false);
  };

  const handleGenreClick = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  const filteredAndSortedMovies = useMemo(() => {
    let result = [...movies];

    // 1. filtering
    if (selectedGenres.length > 0) {
      result = result.filter((movie) =>
        selectedGenres.every((genreId) => movie.genre_ids.includes(genreId))
      );
    }

    // 2. sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case "title.asc":
          return a.title.localeCompare(b.title);
        case "title.desc":
          return b.title.localeCompare(a.title);
        case "rating.desc":
          return b.vote_average - a.vote_average;
        case "rating.asc":
          return a.vote_average - b.vote_average;
        case "release_date.desc":
          return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
        case "release_date.asc":
            return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
        default: // popularity.desc
          return b.vote_average - a.vote_average; // TMDB popular sort fallback
      }
    });

    return result;
  }, [movies, selectedGenres, sortOption]);

  const movieIds = useMemo(() => filteredAndSortedMovies.map(m => m.id), [filteredAndSortedMovies]);

  return (
    <div className="list-page">
      <h1>TMDB Movie Explorer</h1>
      <input
        type="text"
        className="search-bar"
        placeholder="Search for movies..."
        value={query}
        onChange={handleSearch}
      />

      <div className="filter-controls">
        <div className="genre-filters">
            {genres.map(genre => (
                <button
                    key={genre.id}
                    className={`genre-btn ${selectedGenres.includes(genre.id) ? 'active' : ''}`}
                    onClick={() => handleGenreClick(genre.id)}
                >
                    {genre.name}
                </button>
            ))}
        </div>
        <select className="sort-dropdown" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="popularity.desc">Sort by Popularity</option>
            <option value="rating.desc">Rating (High to Low)</option>
            <option value="rating.asc">Rating (Low to High)</option>
            <option value="release_date.desc">Release Date (Newest)</option>
            <option value="release_date.asc">Release Date (Oldest)</option>
            <option value="title.asc">Title (A-Z)</option>
            <option value="title.desc">Title (Z-A)</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="movie-grid">
          {filteredAndSortedMovies.map((movie) => (
            <Link to={`/movie/${movie.id}`} key={movie.id} className="movie-card-link" state={{ movieIds }}>
              <div className="movie-card">
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                    alt={movie.title}
                    className="movie-poster"
                  />
                ) : (
                  <div className="no-image">No Image</div>
                )}
                <div className="movie-info">
                  <h3>{movie.title}</h3>
                  <p className="movie-rating">
                    <StarIcon className="star-icon" /> {movie.vote_average.toFixed(1)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

