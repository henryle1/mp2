import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaStar, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { getMovieDetails } from "../api/tmdb";
import "./DetailPage.css";

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date: string;
  runtime: number;
  genres: { id: number; name: string }[];
  homepage?: string | null;
  tagline?: string | null;
  original_language: string;
}

const StarIcon = FaStar as React.ElementType;
const ArrowLeftIcon = FaArrowLeft as React.ElementType;
const ArrowRightIcon = FaArrowRight as React.ElementType;
const MOVIE_IDS_STORAGE_KEY = "tmdb.movieIds";

export default function DetailPage() {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movieIds, setMovieIds] = useState<number[]>(() => {
    try {
      const stored = sessionStorage.getItem(MOVIE_IDS_STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored) as number[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const state = location.state as { movieIds?: number[] } | null;
    if (state?.movieIds && state.movieIds.length > 0) {
      setMovieIds(state.movieIds);
    }
  }, [location.state]);

  useEffect(() => {
    try {
      if (movieIds.length > 0) {
        sessionStorage.setItem(MOVIE_IDS_STORAGE_KEY, JSON.stringify(movieIds));
      }
    } catch {
      /* ignore storage write errors */
    }
  }, [movieIds]);

  useEffect(() => {
    if (!movieId) {
      setError("Movie identifier is missing.");
      setIsLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const details = await getMovieDetails(Number(movieId));
        setMovie(details);
      } catch (err) {
        setError("Failed to fetch movie details.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [movieId]);

  const canNavigateBetweenMovies = useMemo(
    () => movieIds.length > 0,
    [movieIds]
  );

  const handleNavigation = (direction: "prev" | "next") => {
    if (!movieId || !canNavigateBetweenMovies) {
      return;
    }

    const currentId = Number(movieId);
    const currentIndex = movieIds.indexOf(currentId);
    if (currentIndex === -1) {
      return;
    }

    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % movieIds.length
        : (currentIndex - 1 + movieIds.length) % movieIds.length;

    const nextMovieId = movieIds[nextIndex];
    navigate(`/movie/${nextMovieId}`, { state: { movieIds } });
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!movie) {
    return <div className="error-message">Movie not found.</div>;
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const formattedReleaseDate = movie.release_date
    ? new Date(movie.release_date).toLocaleDateString()
    : "Unknown";
  const runtimeLabel = movie.runtime ? `${movie.runtime} min` : "Runtime unknown";
  const ratingLabel = `${movie.vote_average.toFixed(1)} / 10 (${movie.vote_count} votes)`;
  const languageLabel = movie.original_language.toUpperCase();

  return (
    <div className="detail-page">
      <div className="detail-wrapper">
        <header className="detail-header">
          <button type="button" className="back-button" onClick={() => navigate("/")}>
            Back to List
          </button>
          <div className="detail-stepper">
            <button
              type="button"
              onClick={() => handleNavigation("prev")}
              disabled={!canNavigateBetweenMovies}
            >
              <ArrowLeftIcon /> Previous
            </button>
            <button
              type="button"
              onClick={() => handleNavigation("next")}
              disabled={!canNavigateBetweenMovies}
            >
              Next <ArrowRightIcon />
            </button>
          </div>
        </header>

        <article className="detail-card">
          <div className="detail-poster-container">
            {posterUrl ? (
              <img src={posterUrl} alt={movie.title} className="detail-poster" />
            ) : (
              <div className="detail-poster placeholder">No Poster Available</div>
            )}
          </div>

          <div className="detail-body">
            <div className="detail-title-group">
              <h1 className="detail-title">
                {movie.title}
                {releaseYear ? <span className="detail-year">({releaseYear})</span> : null}
              </h1>
              {movie.tagline && <p className="detail-tagline">{movie.tagline}</p>}
            </div>

            <dl className="detail-meta">
              <div>
                <dt>Release Date</dt>
                <dd>{formattedReleaseDate}</dd>
              </div>
              <div>
                <dt>Runtime</dt>
                <dd>{runtimeLabel}</dd>
              </div>
              <div>
                <dt>Language</dt>
                <dd>{languageLabel}</dd>
              </div>
              <div>
                <dt>Rating</dt>
                <dd className="detail-rating">
                  <StarIcon className="star-icon" /> {ratingLabel}
                </dd>
              </div>
            </dl>

            <div className="detail-genres">
              {movie.genres.map((genre) => (
                <span key={genre.id}>{genre.name}</span>
              ))}
            </div>

            {movie.overview && (
              <section className="detail-section">
                <h2>Overview</h2>
                <p>{movie.overview}</p>
              </section>
            )}

            {movie.homepage && (
              <a
                href={movie.homepage}
                target="_blank"
                rel="noreferrer"
                className="detail-link"
              >
                Official Website
              </a>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
