import React from 'react';

const CanteenItemCard = ({ item, onAdd }) => {
  return (
    <div className="glass-panel hover:shadow-[0_10px_30px_rgba(0,212,255,0.15)] transition-all duration-300" style={{ overflow: "hidden", display: "flex", flexDirection: "column", transform: "translateY(0)" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-5px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
      <div style={{ height: "140px", width: "100%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>No Image Available</div>
        )}
      </div>
      <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ margin: "0 0 5px", color: "#fff", fontSize: "1.1rem" }}>{item.name}</h3>
          <p style={{ margin: "0", color: "var(--accent-cyan)", fontSize: "0.85rem", fontWeight: "bold", textTransform: "uppercase" }}>{item.canteenName}</p>
        </div>
        <div style={{ marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#fff" }}>₹{item.price}</span>
          <button 
            disabled={!item.available}
            onClick={() => onAdd(item)}
            className={`btn-neon ${item.available ? 'primary' : ''}`}
            style={{ padding: "6px 16px", fontSize: "0.85rem", opacity: item.available ? 1 : 0.4 }}
          >
            {item.available ? 'Add' : 'Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanteenItemCard;
