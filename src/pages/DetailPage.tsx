import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getMovieDetails } from '../api/tmdb';
import { FaStar, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import LoadingSpinner from '../components/LoadingSpinner';
import './DetailPage.css';

// 接口定义 (无变化)
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
}

// ------------------- FIX START -------------------
// 使用类型断言告诉 TypeScript 这些图标是合法的组件
const StarIcon = FaStar as React.ElementType;
const ArrowLeftIcon = FaArrowLeft as React.ElementType;
const ArrowRightIcon = FaArrowRight as React.ElementType;
// -------------------- FIX END --------------------


export default function DetailPage() {
  const { movieId } = useParams<{ movieId: string }>();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { movieIds } = location.state || { movieIds: [] };

  useEffect(() => {
    if (!movieId) return;

    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const details = await getMovieDetails(parseInt(movieId, 10));
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

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (!movieId || movieIds.length === 0) return;
    
    const currentIndex = movieIds.indexOf(parseInt(movieId, 10));
    if (currentIndex === -1) return;

    let nextIndex;
    if (direction === 'next') {
        nextIndex = (currentIndex + 1) % movieIds.length;
    } else {
        nextIndex = (currentIndex - 1 + movieIds.length) % movieIds.length;
    }
    
    const nextMovieId = movieIds[nextIndex];
    navigate(`/movie/${nextMovieId}`, { state: { movieIds } });
  }

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;
  if (!movie) return <div className="error-message">Movie not found.</div>;

  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` 
    : '';

  return (
    <div className="detail-page" style={{ backgroundImage: `url(${backdropUrl})` }}>
      <div className="backdrop-overlay"></div>
      <div className="detail-content">
        <button onClick={() => navigate('/')} className="back-button">← Back to List</button>
        <div className="detail-main">
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            className="detail-poster"
          />
          <div className="detail-info">
            <h1>{movie.title} ({movie.release_date.substring(0, 4)})</h1>
            <div className="detail-meta">
              <span>{movie.release_date}</span>
              <span>•</span>
              <span className="genres">{movie.genres.map(g => g.name).join(', ')}</span>
              <span>•</span>
              <span>{movie.runtime} min</span>
            </div>
            <div className="detail-rating">
              {/* FIX: 使用新的变量名 */}
              <StarIcon className="star-icon" />
              <span>{movie.vote_average.toFixed(1)} / 10</span>
            </div>
            <h3>Overview</h3>
            <p className="overview">{movie.overview}</p>
          </div>
        </div>
      </div>
      <div className="navigation-arrows">
        {/* FIX: 使用新的变量名 */}
        <button onClick={() => handleNavigation('prev')}><ArrowLeftIcon /> Previous</button>
        <button onClick={() => handleNavigation('next')}>Next <ArrowRightIcon /></button>
      </div>
    </div>
  );
}