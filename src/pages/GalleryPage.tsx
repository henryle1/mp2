import "./GalleryPage.css";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPopularMovies, getGenres } from "../api/tmdb";
import LoadingSpinner from "../components/LoadingSpinner";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  genre_ids: number[];
}

interface Genre {
  id: number;
  name: string;
}

export default function GalleryPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [minimumRating, setMinimumRating] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getPopularMovies(), getGenres()]).then(([popularMovies, fetchedGenres]) => {
      setMovies(popularMovies);
      setGenres(fetchedGenres);
      setIsLoading(false);
    });
  }, []);

  const handleToggleGenre = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleClearFilters = () => {
    setSelectedGenres([]);
    setMinimumRating(0);
  };

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesGenres =
        selectedGenres.length === 0 || selectedGenres.every((genreId) => movie.genre_ids.includes(genreId));
      const matchesRating = movie.vote_average >= minimumRating;
      return matchesGenres && matchesRating;
    });
  }, [movies, selectedGenres, minimumRating]);

  const movieIds = useMemo(() => filteredMovies.map((movie) => movie.id), [filteredMovies]);

  const handleCardClick = (movie: Movie) => {
    navigate(`/movie/${movie.id}`, { state: { movieIds } });
  };

  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <div>
          <button type="button" className="gallery-nav-btn" onClick={() => navigate("/")}>
            {"< Back to Search"}
          </button>
        </div>
        <h1>Movie Poster Gallery</h1>
      </header>

      <section className="gallery-filters">
        <div className="gallery-filter-group">
          <h2>Filter by Genres</h2>
          <div className="gallery-filter-options">
            {genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                className={`gallery-filter-chip ${selectedGenres.includes(genre.id) ? "active" : ""}`}
                onClick={() => handleToggleGenre(genre.id)}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
        <div className="gallery-filter-group">
          <h2>Minimum Rating</h2>
          <div className="rating-slider">
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={minimumRating}
              onChange={(event) => setMinimumRating(Number(event.target.value))}
            />
            <span>{minimumRating.toFixed(1)}+</span>
          </div>
        </div>
        <div className="gallery-filter-actions">
          <button type="button" className="gallery-clear-btn" onClick={handleClearFilters}>
            Clear Filters
          </button>
        </div>
      </section>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="gallery-grid">
          {filteredMovies.map((movie) => (
            <button
              key={movie.id}
              type="button"
              className="gallery-card"
              onClick={() => handleCardClick(movie)}
            >
              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  className="gallery-poster"
                />
              ) : (
                <div className="gallery-no-image">No Poster</div>
              )}
              <div className="gallery-card-overlay">
                <h3>{movie.title}</h3>
                <p>{movie.vote_average.toFixed(1)} / 10</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
