import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./NotFound.css";

const quotes = [
  { text: "Not all who wander are lost.", author: "— J.R.R. Tolkien" },
  { text: "The only real mistake is the one from which we learn nothing.", author: "— Henry Ford" },
  { text: "Life is either a daring adventure or nothing at all.", author: "— Helen Keller" },
  { text: "In the middle of difficulty lies opportunity.", author: "— Albert Einstein" },
  { text: "Do not go where the path may lead, go instead where there is no path.", author: "— Ralph Waldo Emerson" }
];

const NotFound = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % quotes.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="nf-wrap">
      <div className="nf-sky">
        <div className="cloud c1" />
        <div className="cloud c2" />
        <div className="cloud c3" />
        <svg className="plane" viewBox="0 0 24 24" aria-hidden>
          <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="currentColor" />
        </svg>
      </div>

      <main className="nf-card">
        <div className="nf-code">404</div>
        <h2>We couldn't find that page</h2>

        <div className="nf-quote" key={idx}>
          <p className="q-text">"{quotes[idx].text}"</p>
          <p className="q-author">{quotes[idx].author}</p>
        </div>

        <div className="nf-actions">
          <Link to="/" className="btn btn-primary">
            Return Home
          </Link>
          <Link to="/contact" className="btn btn-outline-secondary">
            Contact Support
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
