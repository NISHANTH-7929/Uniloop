import React from 'react';

const BadgeChip = ({ badge }) => {
  return (
    <span 
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mr-2 mb-2" 
      style={{ background: "rgba(0, 212, 255, 0.1)", color: "var(--accent-cyan)", border: "1px solid rgba(0, 212, 255, 0.3)" }}
    >
      {badge === 'Reliable Dasher' && '🛵 '}
      {badge === 'Speed Demon' && '⚡ '}
      {badge === 'Top Requester' && '⭐ '}
      {badge === 'Campus Dasher' && '🏢 '}
      {badge}
    </span>
  );
};

export default BadgeChip;
