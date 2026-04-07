import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchTrades, fetchBorrows, respondToTrade, confirmReturn, completeTrade } from "../api/tradeApi";
import { submitReview } from "../api/reviewApi";
import { getMyTickets, getNotifications } from "../api/events";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const displayName = user?.email ? user.email.split('@')[0] : "Traveler";


    const [trades, setTrades] = useState([]);
    const [borrows, setBorrows] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("pending");

    const handleLogout = async () => {
        await logout();
        navigate("/auth", { replace: true });
    };

    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewData, setReviewData] = useState({ tradeId: '', rating: 5, comment: '', type: 'buyer' });

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [tradesRes, borrowsRes, ticketsRes, notifsRes] = await Promise.all([
                    fetchTrades().catch(() => ({ data: [] })),
                    fetchBorrows().catch(() => ({ data: [] })),
                    getMyTickets().catch(() => ({ data: [] })),
                    getNotifications().catch(() => ({ data: { notifications: [] } }))
                ]);
                setTrades(tradesRes.data);
                setBorrows(borrowsRes.data);
                setTickets(ticketsRes.data);
                setNotifications(notifsRes.data.notifications || notifsRes.data || []);
            } catch (error) {
                console.error("Dashboard data error", error);
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    const handleTradeResponse = async (tradeId, status) => {
        try {
            await respondToTrade(tradeId, { status });
            toast.success(`Trade ${status} successfully`);
            setTrades(trades.map(t => t._id === tradeId ? { ...t, status } : t));
            if (status === 'accepted') {
                navigate('/dormdash/messages');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${status} trade`);
        }
    };

    const handleCompleteTrade = async (tradeId) => {
        try {
            await completeTrade(tradeId);
            toast.success("Trade marked as completed!");
            const refreshedTrades = await fetchTrades();
            setTrades(refreshedTrades.data);
            setActiveTab("past");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to complete trade");
        }
    };

    const handleConfirmReturn = async (borrowId) => {
        try {
            await confirmReturn(borrowId);
            toast.success("Return confirmed");
            const newBorrows = await fetchBorrows();
            setBorrows(newBorrows.data);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to confirm return");
        }
    };

    const handleOpenReview = (trade) => {
        let type = 'buyer'; 
        if (trade.type === 'borrow') {
            type = (trade.owner?._id || trade.owner) === userId ? 'borrower' : 'lender';
        } else {
            type = (trade.owner?._id || trade.owner) === userId ? 'buyer' : 'seller';
        }
        setReviewData({ tradeId: trade._id, rating: 5, comment: '', type });
        setReviewModalOpen(true);
    };

    const [submittingReview, setSubmittingReview] = useState(false);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (submittingReview) return;
        setSubmittingReview(true);
        try {
            await submitReview(reviewData);
            toast.success("Review submitted successfully!");
            setTrades(prevTrades => prevTrades.map(t => t._id === reviewData.tradeId ? { ...t, isReviewedByMe: true } : t));
            setReviewModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    };

    const trustScore = user?.trustScore || 100;
    const strikeCount = user?.strikeCount || 0;
    const completedTrades = user?.totalCompletedTrades || 0;
    const userId = user?._id || user?.id;

    const pendingRequests = trades.filter(t => t.status === 'pending');
    const activeRequests = trades.filter(t => t.status === 'accepted');
    const myBorrows = borrows.filter(b => (b.borrower?._id || b.borrower) === userId);
    const myLents = borrows.filter(b => (b.lender?._id || b.lender) === userId);
    const pastTrades = trades.filter(t => t.status === 'completed' || t.status === 'rejected' || t.status === 'cancelled');

    return (
        <div className="page-wrapper container" style={{ maxWidth: "1200px" }}>
            <div style={{ marginBottom: "48px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "24px" }}>
                    <div>
                        <h1 className="text-gradient">Welcome back, {displayName}</h1>
                        <p style={{ fontSize: "1.1rem", margin: 0 }}>Manage your campus activity and trust score.</p>
                    </div>
                    <div className="card" style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: "16px", borderRadius: "100px", background: "var(--bg-surface)" }}>
                        <div style={{ 
                            width: "12px", height: "12px", borderRadius: "50%", 
                            background: completedTrades < 3 ? '#94A3B8' : trustScore > 80 ? 'var(--primary)' : trustScore > 50 ? 'var(--secondary)' : '#EF4444', 
                            boxShadow: `0 0 12px ${completedTrades < 3 ? 'transparent' : trustScore > 80 ? 'var(--primary)' : trustScore > 50 ? 'var(--secondary)' : '#EF4444'}` 
                        }}></div>
                        <div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Trust Score</div>
                            <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{completedTrades < 3 ? "Pending" : `${trustScore}%`}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: "32px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Activity Overview</h2>
                <button className="btn-neon primary" onClick={() => navigate('/my-tickets')} style={{ padding: '12px 24px' }}>Management Center</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px", marginBottom: "64px" }}>
                <div className="card" style={{ textAlign: "center" }}>
                    <div className="stat-value text-gradient">{completedTrades}+</div>
                    <div className="stat-label">Successful Trades</div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                    <div className="stat-value text-gradient">{trustScore}%</div>
                    <div className="stat-label">Community Trust</div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                    <div className="stat-value text-gradient">{tickets.length}</div>
                    <div className="stat-label">Active Tickets</div>
                </div>
                <div className="card" style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div className="stat-label" style={{ marginBottom: "8px" }}>Standing</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: "800", color: strikeCount === 0 ? "var(--primary)" : "#FF4B4B" }}>{strikeCount === 0 ? "Elite Participant" : `${strikeCount} Strike(s)`}</div>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "12px" }}>
                        <button onClick={() => navigate('/notifications')} className="btn-neon" style={{ padding: "8px 12px", fontSize: "0.8rem" }}>Notifications</button>
                        <button onClick={handleLogout} className="btn-neon" style={{ padding: "8px 12px", fontSize: "0.8rem", color: "#FF4B4B" }}>Logout</button>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: "30px", marginBottom: "40px" }}>
                <h2 style={{ marginBottom: "20px", color: "var(--text-primary)" }}>My Event Tickets (QR Codes)</h2>
                {loading ? (
                    <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading components...</p>
                ) : tickets.length === 0 ? (
                    <div style={{ border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
                        <div style={{ fontSize: "40px", marginBottom: "15px" }}>🎫</div>
                        <p style={{ color: "var(--text-secondary)" }}>No active tickets found.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                        {tickets.map(ticket => (
                            <div key={ticket._id} style={{ border: "1px solid var(--border-glass)", borderRadius: "12px", padding: "20px", background: "rgba(255,255,255,0.05)", textAlign: "center" }}>
                                <h3 style={{ color: "#fff", margin: "5px 0" }}>{ticket.event?.title}</h3>
                                {ticket.status === 'ACTIVE' && <div style={{ background: "#fff", padding: "10px", display: "inline-block", borderRadius: "10px", marginTop: "12px" }}><QRCodeSVG value={ticket._id} size={150} /></div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="card">
                <div style={{ display: "flex", gap: "24px", marginBottom: "32px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px", overflowX: "auto" }}>
                    {["pending", "active", "borrowed", "lent", "past"].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: "none", border: "none", color: activeTab === tab ? "var(--primary)" : "var(--text-muted)", fontWeight: 700, cursor: "pointer", padding: "8px 4px", borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent", textTransform: "capitalize" }}>{tab} ({tab === 'pending' ? pendingRequests.length : tab === 'active' ? activeRequests.length : 0})</button>
                    ))}
                </div>

                <div style={{ minHeight: "300px" }}>
                    {loading ? <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading history...</p> : (
                        activeTab === "pending" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {pendingRequests.map(trade => (
                                    <div key={trade._id} style={{ display: "flex", justifyContent: "space-between", padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: "12px" }}>
                                        <div><h4 style={{ margin: 0 }}>{trade.listing?.title}</h4><p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>From: {trade.requester?.email}</p></div>
                                        <div style={{ display: "flex", gap: "10px" }}><button onClick={() => handleTradeResponse(trade._id, 'rejected')} className="btn-neon">Reject</button><button onClick={() => handleTradeResponse(trade._id, 'accepted')} className="btn-neon primary">Accept</button></div>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === "active" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {activeRequests.map(trade => (
                                    <div key={trade._id} style={{ display: "flex", justifyContent: "space-between", padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: "12px" }}>
                                        <div><h4 style={{ margin: 0 }}>{trade.listing?.title}</h4></div>
                                        <div style={{ display: "flex", gap: "10px" }}><button onClick={() => navigate('/dormdash/messages')} className="btn-neon">Message</button><button onClick={() => handleCompleteTrade(trade._id)} className="btn-neon primary">Complete</button></div>
                                    </div>
                                ))}
                            </div>
                        ) : <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No items in this category.</div>
                    )}
                </div>
            </div>

            {reviewModalOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div className="glass-panel" style={{ maxWidth: "500px", padding: "40px", borderRadius: "20px" }}>
                        <h2 style={{ marginTop: 0 }}>Rate Experience</h2>
                        <form onSubmit={handleSubmitReview}>
                            <input type="range" min="1" max="5" value={reviewData.rating} onChange={(e) => setReviewData({ ...reviewData, rating: Number(e.target.value) })} style={{ width: "100%" }} />
                            <textarea rows="4" value={reviewData.comment} onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })} placeholder="Comment..." style={{ width: "100%", marginTop: "20px", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}></textarea>
                            <button type="submit" className="btn-neon primary" style={{ width: "100%", marginTop: "20px" }}>Submit</button>
                        </form>
                        <button onClick={() => setReviewModalOpen(false)} style={{ marginTop: "10px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
