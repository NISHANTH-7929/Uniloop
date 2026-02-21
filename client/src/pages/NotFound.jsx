import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NotFound.css";

const QUOTES = [
  "Not all who wander are lost — sometimes they're just redirected.",
  "The page you seek is on a coffee break.",
  "This is not the URL you're looking for. Move along.",
  "404: The internet is teasing you playfully.",
  "Adventure awaits — but not at this address.",
  "Oops. Even maps have holes sometimes.",
  "You found a secret 404 — award yourself a cookie.",
  "Our hamsters are recharging the servers. Try later.",
  "The page escaped. We're sending a search party.",
  "Houston, we have a problem. Page not found.",
  "The digital wind blew this page away.",
  "You've ventured into the void. Nothing but space here.",
  "Looks like this link is lost in the matrix.",
  "This page has entered another dimension.",
  "Error 404: Reality distortion field active."
];

export default function NotFound() {
  const navigate = useNavigate();
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    setQuoteIdx(Math.floor(Math.random() * QUOTES.length));
  }, []);

  const changeQuote = () => {
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * QUOTES.length);
    } while (nextIdx === quoteIdx);
    setQuoteIdx(nextIdx);
  };

  return (
    <div className="notfound-wrapper">
      <div className="bg-animation">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
        <div className="particle-layer particle-1"></div>
        <div className="particle-layer particle-2"></div>
      </div>

      <div className="notfound-glass-panel">
        <div className="glitch-container">
          <h1 className="glitch-text" data-text="404">404</h1>
        </div>
        <h2 className="notfound-title">Lost in the Cosmos</h2>

        <div className="quote-container">
          <p className="animated-quote" key={quoteIdx}>
            "{QUOTES[quoteIdx]}"
          </p>
        </div>

        <div className="button-cluster">
          <button className="neon-btn secondary" onClick={() => navigate(-1)}>
            <span className="btn-text">Go Back</span>
          </button>
          <button className="neon-btn primary" onClick={() => navigate('/dashboard')}>
            <span className="btn-text">Return Home</span>
          </button>
          <button className="neon-btn tertiary" onClick={changeQuote}>
            <span className="btn-text">Next Quote</span>
          </button>
        </div>
      </div>
    </div>
  );
}
