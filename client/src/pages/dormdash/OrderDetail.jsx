import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/dormdashApi';
import { useDormDash } from '../../context/DormDashContext';
import OTPDisplay from '../../components/dormdash/OTPDisplay';
import OTPEntry from '../../components/dormdash/OTPEntry';
import ReviewModal from '../../components/dormdash/ReviewModal';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state: globalState, dispatch } = useDormDash();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const userId = globalState.userId;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/dormdash/orders/${id}`);
        setOrder(data.data || data.order || data);
      } catch (err) {
        setError("Order not found or access denied.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, globalState.lastUpdate]);

  if (loading) return <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading Order...</div>;
  if (error || !order) return <div style={{ textAlign: "center", padding: "40px", color: "#ff4444" }}>{error}</div>;

  const isRequester = order.requester?._id === userId;
  const isDasher = order.dasher?._id === userId;
  const isUnassigned = !order.dasher;

  const handleAction = async (actionPath, payload = {}) => {
    setActionLoading(true);
    try {
      let data;
      if (actionPath === 'verify-delivery') {
        const res = await api.post(`/dormdash/orders/${id}/otp/verify`, { otp: payload.otp });
        data = res.data;
      } else {
        const res = await api.patch(`/dormdash/orders/${id}/${actionPath}`, payload);
        data = res.data;
      }
      setOrder(data.order || data.data || data);
      if (actionPath === 'accept') {
        alert("Request sent to user!");
      } else if (actionPath === 'confirm' && data.chatThreadId) {
          navigate('/dormdash/messages', { state: { conversationId: data.chatThreadId, threadType: 'dormdash' } });
      }
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${actionPath}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    try {
      await api.post(`/dormdash/orders/${id}/review`, { rating, comment });
      setIsReviewModalOpen(false);
      const { data } = await api.get(`/dormdash/orders/${id}`);
      setOrder(data.data || data.order || data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit review");
    }
  };

  const myReview = isRequester ? order.dasherReview : order.requesterReview;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "64px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "24px" }}>
        <h1 className="text-gradient">Order Detail</h1>
        <span style={{
          padding: "8px 16px", borderRadius: "100px", fontWeight: "700", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "0.05em",
          background: "rgba(255, 255, 255, 0.1)", color: "#fff",
          border: "1px solid rgba(255, 255, 255, 0.3)"
        }}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {order.status !== 'cancelled' && (
        <div className="card" style={{ padding: "32px", marginBottom: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: "16px", left: "10%", right: "10%", height: "2px", background: "var(--border-subtle)", zIndex: 0 }} />
            <div style={{ 
              position: "absolute", top: "16px", left: "10%", 
              width: `${(
                ["delivered", "COMPLETED"].includes(order.status) ? 80 : 
                order.status === "in_transit" ? 60 : 
                order.status === "picked_up" ? 40 : 
                !["open", "ACCEPTED_BY_DASHER"].includes(order.status) ? 20 : 0
              )}%`, 
              height: "2px", background: "var(--primary)", zIndex: 0
            }} />
            {[ "Posted", "Accepted", "Picked Up", "In Transit", "Delivered" ].map((label, idx) => {
                const isActive = (idx === 0) || (idx === 1 && !["open"].includes(order.status)) || (idx === 2 && ["picked_up", "in_transit", "delivered", "COMPLETED"].includes(order.status)) || (idx === 3 && ["in_transit", "delivered", "COMPLETED"].includes(order.status)) || (idx === 4 && ["delivered", "COMPLETED"].includes(order.status));
                return (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", zIndex: 1, flex: 1 }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: isActive ? "var(--primary)" : "var(--card-bg)", border: `2px solid ${isActive ? "var(--primary)" : "var(--border-subtle)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: isActive ? "#000" : "var(--text-muted)", fontWeight: "bold", fontSize: "0.75rem" }}>{idx + 1}</span>
                        </div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: isActive ? "var(--primary)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                    </div>
                );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "25px" }}>
        <div className="card" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: "1.25rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "16px", marginBottom: "24px" }}>Logistics</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
            <div><p style={{ margin: "0 0 8px", color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Pickup</p><p style={{ margin: 0, fontWeight: "700", fontSize: "1.1rem" }}>{order.pickupLocation}</p></div>
            <div><p style={{ margin: "0 0 8px", color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Dropoff</p><p style={{ margin: 0, fontWeight: "700", fontSize: "1.1rem" }}>{order.dropLocation}</p></div>
          </div>
          <div style={{ marginBottom: "32px", padding: "16px 24px", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.1)", borderRadius: "var(--radius-md)", display: "inline-block" }}>
            <p style={{ margin: "0 0 4px", color: "var(--primary)", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700 }}>Service Fee</p><p style={{ margin: 0, fontWeight: "800", fontSize: "1.75rem", color: "#fff" }}>₹{order.charge}</p>
          </div>
          {order.instructions && (
            <div style={{ marginBottom: "32px" }}><p style={{ margin: "0 0 8px", color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Instructions</p><p style={{ margin: 0, color: "var(--text-secondary)", fontStyle: "italic", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>"{order.instructions}"</p></div>
          )}
          <div><h3 style={{ fontSize: "1rem", marginBottom: "16px" }}>Order Items</h3><ul style={{ listStyle: "none", padding: 0 }}>{order.items.map((it, idx) => (<li key={idx} style={{ padding: "12px 0", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 500 }}>{it.quantity}× {it.name}</span></li>))}</ul></div>
        </div>

        {order.status !== 'cancelled' && (
          <div className="card" style={{ padding: "32px" }}>
            <h2 style={{ fontSize: "1.25rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "16px", marginBottom: "32px" }}>Partner Info</h2>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
                <div><p style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Requester</p><span style={{ fontWeight: 700 }}>{order.requester.name || "Student"}</span></div>
                <div style={{ textAlign: "right" }}><p style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Dasher</p><span style={{ fontWeight: 700 }}>{order.dasher?.name || "Unassigned"}</span></div>
            </div>
            {isRequester && order.status === 'ACCEPTED_BY_DASHER' && (<div style={{ display: "flex", gap: "12px" }}><button onClick={() => handleAction('confirm')} className="btn-neon primary" style={{ flex: 1 }}>Confirm</button><button onClick={() => handleAction('decline')} className="btn-neon" style={{ flex: 1, color: "#EF4444" }}>Decline</button></div>)}
            {order.status === 'open' && !isRequester && isUnassigned && globalState.dasherMode && (<button onClick={() => handleAction('accept')} className="btn-neon primary" style={{ width: "100%" }}>Accept Delivery</button>)}
            {isDasher && order.status === 'CONFIRMED_BY_USER' && (<button onClick={() => handleAction('pickup')} className="btn-neon primary" style={{ width: "100%" }}>Mark Picked Up</button>)}
            {isDasher && order.status === 'picked_up' && (<button onClick={() => handleAction('intransit')} className="btn-neon primary" style={{ width: "100%" }}>Mark In Transit</button>)}
            {!['open', 'ACCEPTED_BY_DASHER', 'cancelled'].includes(order.status) && (<button onClick={() => navigate('/dormdash/messages')} className="btn-neon" style={{ width: "100%", marginTop: "12px" }}>Contact Partner</button>)}
          </div>
        )}

        {['delivered', 'COMPLETED'].includes(order.status) && (
            <div className="card" style={{ padding: "40px", textAlign: "center" }}>
                <h2>🎉 {order.status.replace(/_/g, ' ')}</h2>
                {!myReview?.submitted && (<button onClick={() => setIsReviewModalOpen(true)} className="btn-neon primary" style={{ marginTop: "24px" }}>Leave Review</button>)}
            </div>
        )}
      </div>

      <ReviewModal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)} 
        onSubmit={handleReviewSubmit}
        role={isRequester ? 'Dasher' : 'Requester'}
      />
    </div>
  );
};

export default OrderDetail;
