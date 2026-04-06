import React, { useEffect, useState } from 'react';
import api from '../../api/dormdashApi';
import OrderCard from '../../components/dormdash/OrderCard';
import { useDormDash } from '../../context/DormDashContext';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open'); // 'open', 'active', 'past'
  const { state: globalState } = useDormDash();

  const userId = globalState.userId;

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const { data } = await api.get('/dormdash/orders/my');
        const ordersList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        const myRequests = ordersList.filter(o => String(o.requester?._id || o.requester) === String(userId));
        setOrders(myRequests);
        
      } catch (error) {
        console.error("Failed to load generic orders", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [globalState.activeOrderUpdate, userId]);

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'open') return o.status === 'open';
    if (activeTab === 'active') return ['accepted', 'ACCEPTED_BY_DASHER', 'CONFIRMED_BY_USER', 'picked_up', 'in_transit'].includes(o.status);
    return ['delivered', 'COMPLETED', 'cancelled'].includes(o.status);
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
      <h1 className="text-gradient" style={{ fontSize: "2.5rem", marginBottom: "30px" }}>My Requests</h1>
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px" }}>
        {['open', 'active', 'past'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "8px 16px", textTransform: "capitalize",
              color: activeTab === tab ? "var(--accent-cyan)" : "var(--text-muted)",
              borderBottom: activeTab === tab ? "2px solid var(--accent-cyan)" : "2px solid transparent",
              fontWeight: activeTab === tab ? "bold" : "normal"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-5 gap-6">
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)", gridColumn: "1 / -1" }}>Loading your orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="glass-panel" style={{ padding: "60px 20px", textAlign: "center", gridColumn: "1 / -1" }}>
            <div style={{ fontSize: "40px", marginBottom: "15px", opacity: 0.3 }}>🛒</div>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", margin: 0 }}>No orders found in this category.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard key={order._id} order={order} />
          ))
        )}
      </div>
    </div>
  );
};

export default MyOrders;
