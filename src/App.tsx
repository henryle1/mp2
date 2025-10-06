import React from "react";
import { Routes, Route } from "react-router-dom";
import ListPage from "./pages/ListPage";
import GalleryPage from "./pages/GalleryPage";
import DetailPage from "./pages/DetailPage";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/movie/:movieId" element={<DetailPage />} />
      </Routes>
    </div>
  );
}

export default App;
