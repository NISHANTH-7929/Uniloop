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
  }, [id, globalState.lastUpdate]); // Re-fetch when socket detects update

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
        // Backend expects POST /api/dormdash/orders/:id/otp/verify
        const res = await api.post(`/dormdash/orders/${id}/otp/verify`, { otp: payload.otp });
        data = res.data;
      } else {
        const res = await api.patch(`/dormdash/orders/${id}/${actionPath}`, payload);
        data = res.data;
      }

      setOrder(data.order || data.data || data);

      if (actionPath === 'accept') {
        alert("Request sent to user! Waiting for their confirmation.");
      } else if (actionPath === 'confirm') {
        if (data.chatThreadId) {
          navigate('/chat', { state: { conversationId: data.chatThreadId, threadType: 'dormdash' } });
        }
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
      // Re-fetch to get updated review state
      const { data } = await api.get(`/dormdash/orders/${id}`);
      setOrder(data.data || data.order || data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit review");
    }
  };

  // Reviews are stored as subdocuments on the order (not a separate reviews array)
  // dasherReview = review written BY requester ABOUT the dasher
  // requesterReview = review written BY dasher ABOUT the requester
  const myReview = isRequester ? order.dasherReview : order.requesterReview;
  const theirReview = isRequester ? order.requesterReview : order.dasherReview;
  const bothRevealed = order.reviewsRevealed;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "15px" }}>
        <h1 className="text-gradient" style={{ fontSize: "2rem", margin: 0 }}>Order Detail</h1>
        <span style={{
          padding: "6px 14px", borderRadius: "8px", fontWeight: "bold", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "1px",
          background: ['open'].includes(order.status) ? 'rgba(0, 212, 255, 0.1)' : ['ACCEPTED_BY_DASHER', 'CONFIRMED_BY_USER'].includes(order.status) ? 'rgba(112, 0, 255, 0.1)' : ['delivered', 'COMPLETED'].includes(order.status) ? 'rgba(0, 255, 136, 0.1)' : order.status === 'cancelled' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.1)',
          color: ['open'].includes(order.status) ? 'var(--accent-cyan)' : ['ACCEPTED_BY_DASHER', 'CONFIRMED_BY_USER'].includes(order.status) ? 'var(--accent-purple)' : ['delivered', 'COMPLETED'].includes(order.status) ? '#00ff88' : order.status === 'cancelled' ? '#ff4444' : '#fff',
          border: `1px solid ${['open'].includes(order.status) ? 'rgba(0, 212, 255, 0.3)' : ['ACCEPTED_BY_DASHER', 'CONFIRMED_BY_USER'].includes(order.status) ? 'rgba(112, 0, 255, 0.3)' : ['delivered', 'COMPLETED'].includes(order.status) ? 'rgba(0, 255, 136, 0.3)' : order.status === 'cancelled' ? 'rgba(255, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.3)'}`
        }}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Order Progress Tracker */}
      {order.status !== 'cancelled' && (
        <div className="glass-panel" style={{ padding: "25px", marginBottom: "30px", overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minWidth: "600px", position: "relative" }}>
            {/* Connecting lines */}
            <div style={{ position: "absolute", top: "15px", left: "10%", right: "10%", height: "2px", background: "rgba(255,255,255,0.1)", zIndex: 0 }} />
            <div style={{ 
              position: "absolute", top: "15px", left: "10%", 
              width: `${(
                ["delivered", "COMPLETED"].includes(order.status) ? 80 : 
                order.status === "in_transit" ? 60 : 
                order.status === "picked_up" ? 40 : 
                !["open", "ACCEPTED_BY_DASHER"].includes(order.status) ? 20 : 0
              )}%`, 
              height: "2px", background: "var(--accent-cyan)", boxShadow: "0 0 10px var(--accent-cyan)", zIndex: 0, transition: "width 0.5s ease" 
            }} />

            {[
              { label: "Posted", active: true },
              { label: "Accepted", active: !["open"].includes(order.status) },
              { label: "Picked Up", active: ["picked_up", "in_transit", "delivered", "COMPLETED"].includes(order.status) },
              { label: "In Transit", active: ["in_transit", "delivered", "COMPLETED"].includes(order.status) },
              { label: "Delivered", active: ["delivered", "COMPLETED"].includes(order.status) }
            ].map((step, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", zIndex: 1, position: "relative", flex: 1 }}>
                <div style={{ 
                  width: "32px", height: "32px", borderRadius: "50%", 
                  background: step.active ? "var(--accent-cyan)" : "rgba(255,255,255,0.05)",
                  border: `2px solid ${step.active ? "#fff" : "rgba(255,255,255,0.1)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: step.active ? "0 0 15px var(--accent-cyan)" : "none",
                  transition: "all 0.3s ease"
                }}>
                  {step.active ? (
                    <span style={{ color: "#000", fontWeight: "bold", fontSize: "0.8rem" }}>{idx + 1}</span>
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{idx + 1}</span>
                  )}
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: step.active ? "bold" : "normal", color: step.active ? "#fff" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "25px", marginTop: "30px" }}>
        
        <div className="glass-panel" style={{ padding: "30px" }}>
          <h2 style={{ fontSize: "1.4rem", color: "#fff", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "20px" }}>Logistics</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <p style={{ margin: "0 0 5px", color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>Pickup Location</p>
              <p style={{ margin: 0, color: "#fff", fontWeight: "bold", fontSize: "1.1rem" }}>{order.pickupLocation}</p>
            </div>
            <div>
              <p style={{ margin: "0 0 5px", color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>Dropoff Location</p>
              <p style={{ margin: 0, color: "#fff", fontWeight: "bold", fontSize: "1.1rem" }}>{order.dropLocation}</p>
            </div>
          </div>

          <div style={{ marginBottom: "20px", padding: "15px", background: "rgba(0, 255, 136, 0.05)", border: "1px solid rgba(0, 255, 136, 0.2)", borderRadius: "12px", display: "inline-block" }}>
            <p style={{ margin: "0 0 5px", color: "#00ff88", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>Dasher Fee (Pay in person)</p>
            <p style={{ margin: 0, color: "#fff", fontWeight: "bold", fontSize: "1.5rem" }}>₹{order.charge}</p>
          </div>

          {order.instructions && (
            <div style={{ marginBottom: "20px" }}>
              <p style={{ margin: "0 0 5px", color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>Instructions</p>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontStyle: "italic", background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>"{order.instructions}"</p>
            </div>
          )}

          <div style={{ marginTop: "25px" }}>
            <h3 style={{ fontSize: "1.1rem", color: "#fff", marginBottom: "10px" }}>Items ({order.items.reduce((acc, i) => acc + i.quantity, 0)})</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {order.items.map((it, idx) => (
                <li key={idx} style={{ padding: "10px 0", borderBottom: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                  <span>{it.quantity}x {it.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {order.status !== 'cancelled' && (
          <div className="glass-panel" style={{ padding: "30px" }}>
            <h2 style={{ fontSize: "1.4rem", color: "#fff", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "20px" }}>People</h2>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <p style={{ margin: "0 0 5px", color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>Requester</p>
                <Link to={order.status === 'open' && !isRequester ? '#' : `/dormdash/profile/${order.requester._id}`} style={{ color: "var(--accent-cyan)", fontWeight: "bold", fontSize: "1.1rem", textDecoration: "none", cursor: order.status === 'open' && !isRequester ? 'default' : 'pointer' }}>
                  {order.status === 'open' && !isRequester ? 'Student (Hidden until accepted)' : (order.requester.name || order.requester.email?.split('@')[0] || 'Student')} {isRequester && '(You)'}
                </Link>
                {(!isRequester || order.status !== 'open') && order.requester.averageRating !== undefined && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                     {order.requester.averageRating.toFixed(1)} | {order.requester.trustScore}% Trust
                  </div>
                )}
              </div>
              <div>
                <p style={{ margin: "0 0 5px", color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", textAlign: "right" }}>Dasher</p>
                {order.dasher ? (
                  <>
                    <Link to={`/dormdash/profile/${order.dasher._id}`} style={{ color: "var(--accent-purple)", fontWeight: "bold", fontSize: "1.1rem", textDecoration: "none" }}>
                      {order.dasher.name || order.dasher.email?.split('@')[0] || 'Student'} {isDasher && '(You)'}
                    </Link>
                    {order.dasher.averageRating !== undefined && (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>
                        ⭐ {order.dasher.averageRating.toFixed(1)} | {order.dasher.trustScore}% Trust
                      </div>
                    )}
                  </>
                ) : (
                  <span style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>Awaiting Assignment</span>
                )}
              </div>
            </div>


            {['open', 'ACCEPTED_BY_DASHER'].includes(order.status) && isRequester && (
              <button 
                onClick={() => handleAction('cancel')} 
                disabled={actionLoading}
                className="btn-neon"
                style={{ width: "100%", borderColor: "#ff4444", color: "#ff4444", marginBottom: "10px" }}
              >
                Cancel Order
              </button>
            )}

            {order.status === 'open' && !isRequester && isUnassigned && globalState.dasherMode && (
              <button 
                onClick={() => handleAction('accept')} 
                disabled={actionLoading}
                className="btn-neon primary"
                style={{ width: "100%", marginBottom: "10px" }}
              >
                Accept Delivery Run
              </button>
            )}

            {isRequester && order.status === 'ACCEPTED_BY_DASHER' && (
              <>
                <button 
                  onClick={() => handleAction('confirm')} 
                  disabled={actionLoading}
                  className="btn-neon primary"
                  style={{ width: "100%", marginBottom: "10px" }}
                >
                  Confirm Dasher Selection
                </button>
                <button 
                  onClick={() => handleAction('decline')} 
                  disabled={actionLoading}
                  className="btn-neon"
                  style={{ width: "100%", borderColor: "#ff4444", color: "#ff4444", marginBottom: "10px" }}
                >
                  Decline Dasher Request
                </button>
              </>
            )}

            {isDasher && order.status === 'CONFIRMED_BY_USER' && (
              <button onClick={() => handleAction('pickup')} disabled={actionLoading} className="btn-neon primary" style={{ width: "100%", marginBottom: "10px" }}>
                Mark as Picked Up
              </button>
            )}

            {isDasher && order.status === 'picked_up' && (
              <button onClick={() => handleAction('intransit')} disabled={actionLoading} className="btn-neon primary" style={{ width: "100%", marginBottom: "10px" }}>
                Mark as In Transit
              </button>
            )}
            
            {/* Phase 4: Advanced Chat Entry Points */}
            {!['open', 'ACCEPTED_BY_DASHER', 'cancelled'].includes(order.status) && (
              <button 
                onClick={() => navigate('/chat', { state: { conversationId: order.chatThreadId || order._id, threadType: 'dormdash' } })} 
                className="btn-neon"
                style={{ width: "100%", marginBottom: "15px", display: "flex", justifyContent: "center", gap: "10px", alignItems: "center" }}
              >
                <span>💬 Contact {isRequester ? 'Dasher' : 'User'}</span>
              </button>
            )}

            {isRequester && order.status === 'delivered' && (
              <button onClick={() => handleAction('complete')} disabled={actionLoading} className="btn-neon primary" style={{ width: "100%", marginBottom: "10px" }}>
                Mark Delivery as Completely Resolved
              </button>
            )}
            
          </div>
        )}

        {order.status === 'in_transit' && isRequester && (
          <OTPDisplay 
            otp={order.otpCode} 
            expiresAt={order.updatedAt} // Use updatedAt as proxy for expiry
            onRegenerate={() => handleAction('regenerate-otp')}
          />
        )}

        {order.status === 'in_transit' && isDasher && (
          <OTPEntry 
            onVerify={(otp) => handleAction('verify-delivery', { otp })} 
            loading={actionLoading} 
          />
        )}

        {['delivered', 'COMPLETED'].includes(order.status) && (
           <div className="glass-panel" style={{ padding: "30px", textAlign: "center", marginTop: "25px" }}>
             <div style={{ fontSize: "3rem", marginBottom: "15px" }}>🎉</div>
             <h2 style={{ color: "#00ff88", marginBottom: "10px" }}>{order.status === 'COMPLETED' ? 'Delivery Completed & Closed!' : 'Delivered!'}</h2>
             
             {!myReview?.submitted && (
               <div style={{ marginTop: "20px" }}>
                 <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>Leave a blind review for the {isRequester ? 'dasher' : 'requester'}!</p>
                 <button onClick={() => setIsReviewModalOpen(true)} className="btn-neon primary">
                   Write a Review
                 </button>
               </div>
             )}
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
