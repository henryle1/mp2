import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaStar, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { getMovieDetails } from "../api/tmdb";
import LoadingSpinner from "../components/LoadingSpinner";
import "./DetailPage.css";

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  runtime: number;
  genres: { id: number; name: string }[];
  homepage?: string | null;
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
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!movie) {
    return <div className="error-message">Movie not found.</div>;
  }

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : "";

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "";

  return (
    <div className="detail-page" style={{ backgroundImage: `url(${backdropUrl})` }}>
      <div className="backdrop-overlay" />
      <div className="detail-content">
        <button onClick={() => navigate("/")} className="back-button">
          Back to List
        </button>
        <div className="detail-main">
          {posterUrl ? (
            <img src={posterUrl} alt={movie.title} className="detail-poster" />
          ) : (
            <div className="detail-poster placeholder">No Poster Available</div>
          )}
          <div className="detail-info">
            <h1>
              {movie.title} ({movie.release_date.substring(0, 4)})
            </h1>
            <div className="detail-meta">
              <span>{movie.release_date}</span>
              <span>|</span>
              <span className="genres">{movie.genres.map((genre) => genre.name).join(", ")}</span>
              <span>|</span>
              <span>{movie.runtime} min</span>
            </div>
            <div className="detail-rating">
              <StarIcon className="star-icon" />
              <span>{movie.vote_average.toFixed(1)} / 10</span>
            </div>
            {movie.overview && (
              <>
                <h3>Overview</h3>
                <p className="overview">{movie.overview}</p>
              </>
            )}
            {movie.homepage && (
              <a href={movie.homepage} target="_blank" rel="noreferrer" className="official-site">
                Official Website
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="navigation-arrows">
        <button type="button" onClick={() => handleNavigation("prev")} disabled={!canNavigateBetweenMovies}>
          <ArrowLeftIcon /> Previous
        </button>
        <button type="button" onClick={() => handleNavigation("next")} disabled={!canNavigateBetweenMovies}>
          Next <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}
