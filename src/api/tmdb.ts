import axios from "axios";

const token = process.env.REACT_APP_TMDB_ACCESS_TOKEN;

export const tmdb = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  },
});

export async function searchMovies(query: string, page = 1) {
  const res = await tmdb.get("/search/movie", {
    params: { query, include_adult: false, language: "en-US", page },
  });
  return res.data;
}

export async function getPopularMovies(page = 1) {
  const res = await tmdb.get("/movie/popular", {
    params: { language: "en-US", page },
  });
  return res.data;
}

export async function getMovieDetails(id: number) {
  const res = await tmdb.get(`/movie/${id}`, {
    params: { language: "en-US" },
  });
  return res.data;
}

export async function getGenres() {
  const res = await tmdb.get("/genre/movie/list", {
    params: { language: "en-US" },
  });
  return res.data.genres;
}
