import React, { useEffect, useState } from 'react';
import api from '../../api/dormdashApi';
import OrderCard from '../../components/dormdash/OrderCard';
import { useDormDash } from '../../context/DormDashContext';
import { RefreshCcw } from 'lucide-react';

const EarningsLog = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('earnings'); // 'earnings', 'requested', 'ongoing'
  const { state: globalState } = useDormDash();
  const userId = globalState.userId;

  const fetchEarningsAndDeliveries = async () => {
    setLoading(true);
    try {
      // Use the generic /my endpoint to grab all interactions
      const { data } = await api.get('/dormdash/orders/my');
      const allOrders = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      // Filter out only the stuff where this user is the Dasher
      const dasherOrders = allOrders.filter(o => String(o.dasher?._id || o.dasher) === String(userId));
      setOrders(dasherOrders);
    } catch (error) {
      console.error("Failed to fetch dasher log", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsAndDeliveries();
  }, [userId, globalState.activeOrderUpdate]);

  const earningsOrders = orders.filter(o => ['delivered', 'COMPLETED'].includes(o.status));
  const requestedOrders = orders.filter(o => o.status === 'ACCEPTED_BY_DASHER');
  const ongoingOrders = orders.filter(o => ['CONFIRMED_BY_USER', 'picked_up', 'in_transit'].includes(o.status));

  // Auto-focus tabs if they have active engagements
  useEffect(() => {
    if (requestedOrders.length > 0 && activeTab !== 'requested') setActiveTab('requested');
    else if (ongoingOrders.length > 0 && activeTab !== 'ongoing' && requestedOrders.length === 0) setActiveTab('ongoing');
  }, [orders.length]);

  const totalEarned = earningsOrders.reduce((sum, o) => sum + (o.charge || 0), 0);

  // Determine what to display based on active tab
  let displayOrders = earningsOrders;
  if (activeTab === 'requested') displayOrders = requestedOrders;
  if (activeTab === 'ongoing') displayOrders = ongoingOrders;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
        <h1 className="text-gradient" style={{ fontSize: "2.5rem", margin: 0 }}>Dasher Hub</h1>
        <button className="btn-neon" onClick={fetchEarningsAndDeliveries} style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* Top Banner metrics */}
      <div className="glass-panel" style={{ padding: "25px", marginBottom: "30px", background: "rgba(0, 255, 136, 0.05)", border: "1px solid rgba(0, 255, 136, 0.2)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
        <div>
          <span style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Total Earnings To Date</span>
          <span style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#00ff88", lineHeight: 1 }}>₹{totalEarned}</span>
        </div>
        <div style={{ textAlign: "right", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          <p style={{ margin: "0 0 5px" }}>Completed Deliveries: <strong style={{ color: "#fff" }}>{earningsOrders.length}</strong></p>
          <p style={{ margin: 0 }}>Active Runs: <strong style={{ color: "var(--accent-cyan)" }}>{ongoingOrders.length}</strong></p>
        </div>
      </div>

      {/* Dasher Activity Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px", overflowX: "auto" }}>
        {[
          { id: 'earnings', label: 'Past & Earnings' },
          { id: 'requested', label: `Requested (${requestedOrders.length})` },
          { id: 'ongoing', label: `Ongoing (${ongoingOrders.length})` }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              background: "none", border: "none", cursor: "pointer", fontSize: "1.05rem", padding: "8px 16px", whiteSpace: "nowrap",
              color: activeTab === tab.id ? "var(--accent-cyan)" : "var(--text-muted)",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent-cyan)" : "2px solid transparent",
              fontWeight: activeTab === tab.id ? "bold" : "normal",
              transition: "all 0.2s"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-5 gap-6">
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)", gridColumn: "1 / -1" }}>Loading log...</div>
        ) : displayOrders.length === 0 ? (
          <div className="glass-panel" style={{ padding: "60px 20px", textAlign: "center", gridColumn: "1 / -1" }}>
             <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", margin: 0 }}>
               {activeTab === 'requested' ? "No pending request confirmations." : 
                activeTab === 'ongoing' ? "You have no ongoing deliveries." : 
                "You haven't completed any deliveries yet."}
             </p>
          </div>
        ) : (
          displayOrders.map(order => (
            <OrderCard key={order._id} order={order} />
          ))
        )}
      </div>
    </div>
  );
};

export default EarningsLog;
