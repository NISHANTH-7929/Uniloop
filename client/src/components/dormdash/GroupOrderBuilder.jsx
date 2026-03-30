import React, { useState } from 'react';

const GroupOrderBuilder = ({ onAddItem, onUpdateShareCharge, items, shareCharge }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [localCharge, setLocalCharge] = useState(shareCharge || 0);

  const handleAdd = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onAddItem({ name, quantity });
      setName('');
      setQuantity(1);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
      <h4 style={{ margin: "0 0 15px", color: "#fff", fontSize: "1.1rem" }}>Add Your Items</h4>
      <form onSubmit={handleAdd} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input 
          type="text" 
          placeholder="Item name" 
          className="neon-input"
          style={{ flex: 1, padding: "8px 12px" }} 
          value={name} 
          onChange={e => setName(e.target.value)} 
        />
        <input 
          type="number" 
          min="1" 
          className="neon-input"
          style={{ width: "80px", padding: "8px 12px" }} 
          value={quantity} 
          onChange={e => setQuantity(e.target.value)} 
        />
        <button type="submit" disabled={!name} className="btn-neon primary" style={{ opacity: !name ? 0.5 : 1 }}>Add</button>
      </form>

      {items.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", border: "1px solid var(--border-glass)", borderRadius: "8px", background: "rgba(255,255,255,0.02)" }}>
          {items.map((it, idx) => (
            <li key={idx} style={{ padding: "10px 15px", borderBottom: idx === items.length - 1 ? 'none' : '1px solid var(--border-glass)', display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
              <span>{it.quantity}x {it.name}</span>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginTop: "20px" }}>
        <label style={{ color: "var(--text-secondary)", fontSize: "0.9rem", whiteSpace: "nowrap" }}>Your contribution to Dasher fee (₹):</label>
        <input 
          type="number" 
          min="0"
          value={localCharge}
          onChange={(e) => {
            setLocalCharge(e.target.value);
            onUpdateShareCharge(Number(e.target.value));
          }}
          className="neon-input"
          style={{ width: "100px", textAlign: "center", padding: "8px" }}
        />
      </div>
    </div>
  );
};

export default GroupOrderBuilder;
