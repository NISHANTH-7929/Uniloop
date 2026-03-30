import React from 'react';
import BadgeChip from './BadgeChip';

const ProfileScoreCard = ({ user }) => {
  if (!user || !user.dormDash) return null;
  const { dormDash } = user;

  const getAvg = (total, count) => count > 0 ? (total / count).toFixed(1) : "N/A";

  return (
    <div className="glass-panel" style={{ padding: "30px", maxWidth: "500px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
        <div style={{ height: "70px", width: "70px", borderRadius: "50%", background: "rgba(0, 212, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1.8rem", color: "var(--accent-cyan)", border: "2px solid var(--accent-cyan)", overflow: "hidden" }}>
           {user.avatar ? <img src={user.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={user.name}/> : user.name?.charAt(0)}
        </div>
        <div>
          <h2 style={{ margin: "0 0 5px", color: "#fff", fontSize: "1.5rem" }}>{user.name || user.email?.split('@')[0]}</h2>
          <p style={{ margin: 0, color: "var(--accent-cyan)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>DormDash Member</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "30px" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--border-glass)", padding: "15px", textAlign: "center" }}>
          <p style={{ margin: "0 0 5px", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold" }}>Requester Rating</p>
          <p style={{ margin: 0, color: "#fff", fontSize: "1.8rem", fontWeight: "bold" }}>⭐ {getAvg(dormDash.ratings.asRequester.total, dormDash.ratings.asRequester.count)}</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--border-glass)", padding: "15px", textAlign: "center" }}>
          <p style={{ margin: "0 0 5px", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold" }}>Dasher Rating</p>
          <p style={{ margin: 0, color: "#fff", fontSize: "1.8rem", fontWeight: "bold" }}>⭐ {getAvg(dormDash.ratings.asDasher.total, dormDash.ratings.asDasher.count)}</p>
        </div>
      </div>

      <div style={{ marginBottom: "25px" }}>
        <span style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "10px" }}>Badges Earned:</span>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {dormDash.badges && dormDash.badges.length > 0 ? (
            dormDash.badges.map((badge, idx) => <BadgeChip key={idx} badge={badge} />)
          ) : (
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>No badges yet.</span>
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "20px", color: "var(--text-secondary)", fontSize: "0.9rem", display: "flex", justifyContent: "space-between" }}>
        <span>Completed Orders:</span>
        <strong style={{ color: "#fff", fontSize: "1.1rem" }}>{dormDash.ordersCompleted}</strong>
      </div>
    </div>
  );
};

export default ProfileScoreCard;
