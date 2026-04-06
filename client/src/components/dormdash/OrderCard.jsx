import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChargeDisplay from './ChargeDisplay';

const OrderCard = ({ order, isDasherFeed }) => {
  const navigate = useNavigate();
  const { _id, pickupLocation, dropLocation, charge, status, items, updatedAt } = order;

  const itemCount = items ? items.reduce((acc, current) => acc + current.quantity, 0) : 0;
  
  const timeStr = new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Link to={`/dormdash/order/${_id}`} className="glass-panel" style={{ display: "block", padding: "20px", textDecoration: "none", marginBottom: "15px", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-neon)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-glass)"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
        <div>
          <span style={{
            display: "inline-block", padding: "4px 10px", fontSize: "0.75rem", fontWeight: "bold", borderRadius: "6px", textTransform: "uppercase", letterSpacing: "1px",
            background: status === 'open' ? 'rgba(0, 212, 255, 0.1)' : ['accepted', 'ACCEPTED_BY_DASHER', 'CONFIRMED_BY_USER'].includes(status) ? 'rgba(112, 0, 255, 0.1)' : ['delivered', 'COMPLETED'].includes(status) ? 'rgba(0, 255, 136, 0.1)' : status === 'cancelled' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.1)',
            color: status === 'open' ? 'var(--accent-cyan)' : ['accepted', 'ACCEPTED_BY_DASHER', 'CONFIRMED_BY_USER'].includes(status) ? 'var(--accent-purple)' : ['delivered', 'COMPLETED'].includes(status) ? '#00ff88' : status === 'cancelled' ? '#ff4444' : '#fff',
            border: `1px solid ${status === 'open' ? 'rgba(0, 212, 255, 0.3)' : ['accepted', 'ACCEPTED_BY_DASHER', 'CONFIRMED_BY_USER'].includes(status) ? 'rgba(112, 0, 255, 0.3)' : ['delivered', 'COMPLETED'].includes(status) ? 'rgba(0, 255, 136, 0.3)' : status === 'cancelled' ? 'rgba(255, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.3)'}`
          }}>
            {status.replace('_', ' ')}
          </span>
          {order.isGroupOrder && <span style={{ marginLeft: "10px", display: "inline-block", padding: "4px 10px", fontSize: "0.75rem", fontWeight: "bold", borderRadius: "6px", background: "rgba(255, 0, 200, 0.1)", color: "var(--accent-pink)", border: "1px solid rgba(255, 0, 200, 0.3)", textTransform: "uppercase" }}>Group</span>}
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold", color: "#fff" }}>₹{charge}</p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{timeStr}</p>
        </div>
      </div>

      <div style={{ borderLeft: "2px dashed rgba(255,255,255,0.1)", marginLeft: "8px", padding: "10px 0 10px 20px", display: "flex", flexDirection: "column", gap: "15px", position: "relative" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "-28px", top: "4px", width: "14px", height: "14px", background: "#ff4444", borderRadius: "50%", border: "3px solid var(--bg-secondary)" }}></div>
          <p style={{ margin: "0 0 2px", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>From</p>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pickupLocation}</p>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "-28px", top: "4px", width: "14px", height: "14px", background: "#00ff88", borderRadius: "50%", border: "3px solid var(--bg-secondary)" }}></div>
          <p style={{ margin: "0 0 2px", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>To</p>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dropLocation}</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "15px", borderTop: "1px solid var(--border-glass)", paddingTop: "15px" }}>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            {itemCount} items
          </div>
          {order.requester && order.requester.averageRating !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "10px" }}>
              <span style={{ color: "#ffcc00" }}>⭐</span>
              <span>{order.requester.averageRating.toFixed(1)}</span>
              <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>({order.requester.trustScore}%)</span>
            </div>
          )}
        </div>
        {!['open', 'cancelled'].includes(status) && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              navigate('/dormdash/messages', { state: { conversationId: order.chatThreadId || order._id, threadType: 'dormdash' } });
            }}
            className="btn-neon" 
            style={{ padding: "4px 10px", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "5px" }}
          >
             <span>💬 Contact</span>
          </button>
        )}
      </div>
    </Link>
  );
};

export default OrderCard;
