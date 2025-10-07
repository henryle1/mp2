import "./ListPage.css";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { getPopularMovies, searchMovies, getGenres } from "../api/tmdb";
import { FaStar } from "react-icons/fa";

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

interface MovieListResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

const StarIcon = FaStar as React.ElementType;

export default function ListPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [sortOption, setSortOption] = useState("popularity.desc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    getGenres()
      .then((fetchedGenres) => setGenres(fetchedGenres))
      .catch((error) => {
        console.error("Failed to fetch genres", error);
        setGenres([]);
      });
  }, []);

  const fetchMovies = useCallback(async (page: number, searchTerm: string) => {
    const trimmedQuery = searchTerm.trim();
    setIsLoading(true);

    try {
      let data: MovieListResponse;

      if (trimmedQuery.length > 1) {
        data = await searchMovies(trimmedQuery, page);
      } else {
        data = await getPopularMovies(page);
      }

      setMovies(data.results ?? []);
      setTotalPages(Math.max(1, data.total_pages ?? 1));
    } catch (error) {
      console.error("Failed to fetch movies", error);
      setMovies([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies(currentPage, query);
  }, [currentPage, query, fetchMovies]);

  useEffect(() => {
    if (!isFilterOpen) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(target) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(target)
      ) {
        setIsFilterOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isFilterOpen]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setCurrentPage(1);
  };

  const handleGenreClick = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  const toggleFilterPanel = () => {
    setIsFilterOpen((prev) => !prev);
  };

  const clearFilters = () => {
    setSelectedGenres([]);
  };

  const handleGoHome = () => {
    setQuery("");
    setSelectedGenres([]);
    setSortOption("popularity.desc");
    setIsFilterOpen(false);
    setCurrentPage(1);
    searchInputRef.current?.focus();
  };

  const filteredAndSortedMovies = useMemo(() => {
    let result = [...movies];

    if (selectedGenres.length > 0) {
      result = result.filter((movie) =>
        selectedGenres.every((genreId) => movie.genre_ids.includes(genreId))
      );
    }

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
        default:
          return b.vote_average - a.vote_average;
      }
    });

    return result;
  }, [movies, selectedGenres, sortOption]);

  const movieIds = useMemo(
    () => filteredAndSortedMovies.map((movie) => movie.id),
    [filteredAndSortedMovies]
  );

  const handleCardClick = (movie: Movie) => {
    navigate(`/movie/${movie.id}`, { state: { movieIds } });
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  const renderMovieGrid = () => {
    if (filteredAndSortedMovies.length === 0) {
      return <div className="empty-state">No movies found.</div>;
    }

    return (
      <div className="movie-grid">
        {filteredAndSortedMovies.map((movie) => (
          <button
            key={movie.id}
            type="button"
            className="movie-card-link"
            onClick={() => handleCardClick(movie)}
          >
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
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="list-page">
      <h1>TMDB Movie Explorer</h1>

      <div className="page-actions">
        <button type="button" className="page-action-btn" onClick={handleGoHome}>
          Home
        </button>
        <button type="button" className="page-action-btn" onClick={() => navigate("/gallery")}>
          Gallery
        </button>
      </div>

      <input
        ref={searchInputRef}
        type="text"
        className="search-bar"
        placeholder="Search for movies..."
        value={query}
        onChange={handleSearch}
      />

      <div className="filter-controls">
        <div className="filter-group">
          <button
            ref={filterButtonRef}
            type="button"
            className={`filter-toggle ${isFilterOpen ? "open" : ""}`}
            onClick={toggleFilterPanel}
            aria-expanded={isFilterOpen}
            aria-controls="genre-filter-panel"
          >
            Filter Genres{selectedGenres.length > 0 ? ` (${selectedGenres.length})` : ""}
          </button>
          {isFilterOpen && (
            <div
              id="genre-filter-panel"
              className="filter-dropdown"
              ref={filterPanelRef}
              role="dialog"
              aria-label="Filter genres"
            >
              <div className="filter-dropdown-header">
                <span>Genres</span>
                {selectedGenres.length > 0 && (
                  <button type="button" className="filter-clear-btn" onClick={clearFilters}>
                    Clear
                  </button>
                )}
              </div>
              <div className="filter-options">
                {genres.map((genre) => (
                  <label
                    key={genre.id}
                    className={`filter-option ${selectedGenres.includes(genre.id) ? "active" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(genre.id)}
                      onChange={() => handleGenreClick(genre.id)}
                    />
                    <span>{genre.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <select
          className="sort-dropdown"
          value={sortOption}
          onChange={(event) => setSortOption(event.target.value)}
        >
          <option value="popularity.desc">Sort by Popularity</option>
          <option value="rating.desc">Rating (High to Low)</option>
          <option value="rating.asc">Rating (Low to High)</option>
          <option value="release_date.desc">Release Date (Newest)</option>
          <option value="release_date.asc">Release Date (Oldest)</option>
          <option value="title.asc">Title (A-Z)</option>
          <option value="title.desc">Title (Z-A)</option>
        </select>
      </div>

      {isLoading ? <div className="loading">Loading...</div> : renderMovieGrid()}

      <div className="pagination-controls">
        <button type="button" onClick={goToPreviousPage} disabled={currentPage === 1}>
          Previous
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <button type="button" onClick={goToNextPage} disabled={currentPage >= totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}
