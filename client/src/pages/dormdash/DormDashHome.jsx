import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Bike, MessageSquare, Users2, History, LayoutDashboard } from "lucide-react";

const DormDashHome = () => {
  return (
    <div className="page-wrapper container" style={{ maxWidth: "1000px" }}>
      <div style={{ textAlign: "center", marginBottom: "60px" }}>
        <h1 className="text-gradient" style={{ fontSize: "3.5rem", marginBottom: "16px" }}>DormDash</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
          The fastest way to get your cravings delivered to your dorm room, by your fellow students.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "32px", marginBottom: "48px" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ 
            width: "80px", height: "80px", background: "rgba(76, 175, 80, 0.1)", 
            borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", 
            justifyContent: "center", margin: "0 auto 24px", color: "var(--primary)" 
          }}>
            <ShoppingBag size={40} />
          </div>
          <h2 style={{ marginBottom: "12px" }}>Hungry?</h2>
          <p style={{ marginBottom: "32px" }}>
            Order from any active campus canteen and a dasher will bring it to you.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link to="/dormdash/canteen" className="btn-neon primary" style={{ width: "100%" }}>Browse Menus</Link>
            <Link to="/dormdash/new-order" className="btn-neon" style={{ width: "100%" }}>Custom Order</Link>
          </div>
        </div>

        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ 
            width: "80px", height: "80px", background: "rgba(255, 179, 0, 0.1)", 
            borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", 
            justifyContent: "center", margin: "0 auto 24px", color: "var(--secondary)" 
          }}>
            <Bike size={40} />
          </div>
          <h2 style={{ marginBottom: "12px" }}>Want to Dash?</h2>
          <p style={{ marginBottom: "32px" }}>
            Help out your peers, earn badges, and make some quick pocket money.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link to="/dormdash/dasher" className="btn-neon primary" style={{ width: "100%" }}>Dasher Dashboard</Link>
            <Link to="/dormdash/dasher/earnings" className="btn-neon" style={{ width: "100%" }}>View Earnings</Link>
          </div>
        </div>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "24px", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: "0 0 4px" }}>My Activity</h3>
          <p style={{ margin: 0 }}>Check out your recent orders and group carts.</p>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link to="/dormdash/messages" className="btn-neon">
            <MessageSquare size={18} />
            <span>Messages</span>
          </Link>
          <Link to="/dormdash/group-order" className="btn-neon">
            <Users2 size={18} />
            <span>Group Orders</span>
          </Link>
          <Link to="/dormdash/my-orders" className="btn-neon primary">
            <History size={18} />
            <span>My Orders</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DormDashHome;
