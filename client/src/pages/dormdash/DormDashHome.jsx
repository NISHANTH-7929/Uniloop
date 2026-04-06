import React from 'react';
import { Link } from 'react-router-dom';

const DormDashHome = () => {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 className="text-gradient" style={{ fontSize: "3rem", marginBottom: "15px" }}>DormDash</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto" }}>
          The fastest way to get your cravings delivered to your dorm room, by your fellow students.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "40px" }}>
        <div className="glass-panel hover:shadow-[0_10px_30px_rgba(112,0,255,0.2)] transition-all duration-300" style={{ padding: "30px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(112, 0, 255, 0.2)", filter: "blur(30px)", borderRadius: "50%" }}></div>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🍔</div>
          <h2 style={{ color: "#fff", marginBottom: "10px", fontSize: "1.5rem" }}>Hungry?</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "25px", fontSize: "0.95rem" }}>
            Order from any active campus canteen and a dasher will bring it to you.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link to="/dormdash/canteen" className="btn-neon primary" style={{ width: "100%" }}>Browse Menus</Link>
            <Link to="/dormdash/new-order" className="btn-neon" style={{ width: "100%", borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" }}>Custom Order</Link>
          </div>
        </div>

        <div className="glass-panel hover:shadow-[0_10px_30px_rgba(0,212,255,0.2)] transition-all duration-300" style={{ padding: "30px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(0, 212, 255, 0.2)", filter: "blur(30px)", borderRadius: "50%" }}></div>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🛵</div>
          <h2 style={{ color: "#fff", marginBottom: "10px", fontSize: "1.5rem" }}>Want to Dash?</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "25px", fontSize: "0.95rem" }}>
            Help out your peers, earn badges, and make some quick pocket money.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link to="/dormdash/dasher" className="btn-neon primary" style={{ width: "100%" }}>Dasher Dashboard</Link>
            <Link to="/dormdash/dasher/earnings" className="btn-neon" style={{ width: "100%" }}>View Earnings</Link>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "20px", textAlign: "center", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "15px", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: "0 0 5px", color: "#fff", fontSize: "1.1rem" }}>My Activity</h3>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>Check out your recent orders and group carts.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/dormdash/messages" className="btn-neon" style={{ padding: "8px 16px", borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" }}>Messages</Link>
          <Link to="/dormdash/group-order" className="btn-neon" style={{ padding: "8px 16px", borderColor: "var(--accent-pink)", color: "var(--accent-pink)" }}>Group Orders</Link>
          <Link to="/dormdash/my-orders" className="btn-neon primary" style={{ padding: "8px 16px" }}>View My Orders</Link>
        </div>
      </div>
    </div>
  );
};

export default DormDashHome;
