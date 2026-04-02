import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import AdminBooks from "./components/AdminBooks.tsx";

// BrowserRouter wraps the entire app so React Router can manage URL-based navigation.
// The routes.json file in the public folder ensures Azure serves index.html for all routes.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Main bookstore (browse + cart) */}
        <Route path="/" element={<App />} />

        {/* Admin page for adding, editing, and deleting books */}
        <Route path="/adminbooks" element={<AdminBooks />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
