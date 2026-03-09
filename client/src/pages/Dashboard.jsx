import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { fetchTrades, fetchBorrows, respondToTrade, confirmReturn, completeTrade } from "../api/tradeApi";
import { submitReview } from "../api/reviewApi";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const displayName = user?.email ? user.email.split('@')[0] : "Traveler";

    const [trades, setTrades] = useState([]);
    const [borrows, setBorrows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("pending"); // pending, active_borrows, past

    // Review Modal State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewData, setReviewData] = useState({ tradeId: '', rating: 5, comment: '', type: 'buyer' });

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [tradesRes, borrowsRes] = await Promise.all([
                    fetchTrades(),
                    fetchBorrows()
                ]);
                setTrades(tradesRes.data);
                setBorrows(borrowsRes.data);
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
            // Optimistic update
            setTrades(trades.map(t => t._id === tradeId ? { ...t, status } : t));

            if (status === 'accepted') {
                navigate('/chat');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${status} trade`);
        }
    };

    const handleCompleteTrade = async (tradeId) => {
        try {
            await completeTrade(tradeId);
            toast.success("Trade marked as completed!");

            // Re-fetch trades to accurately reflect "Past Trades"
            const refreshedTrades = await fetchTrades();
            setTrades(refreshedTrades.data);

            // Switch tab to show it off
            setActiveTab("past");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to complete trade");
        }
    };

    const handleConfirmReturn = async (borrowId) => {
        try {
            await confirmReturn(borrowId);
            toast.success("Return confirmed");
            // Soft reload to get updated states
            const newBorrows = await fetchBorrows();
            setBorrows(newBorrows.data);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to confirm return");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    const handleOpenReview = (trade) => {
        let type = 'buyer'; // default
        if (trade.type === 'borrow') {
            type = (trade.owner?._id || trade.owner) === userId ? 'borrower' : 'lender';
        } else {
            type = (trade.owner?._id || trade.owner) === userId ? 'buyer' : 'seller';
        }

        setReviewData({
            tradeId: trade._id,
            rating: 5,
            comment: '',
            type
        });
        setReviewModalOpen(true);
    };

    const [submittingReview, setSubmittingReview] = useState(false);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (submittingReview) return;
        setSubmittingReview(true);
        try {
            await submitReview(reviewData);
            toast.success("Review submitted successfully! Trust scores updated.");

            // Optimistically update the trades array so the button disappears
            setTrades(prevTrades =>
                prevTrades.map(t =>
                    t._id === reviewData.tradeId ? { ...t, isReviewedByMe: true } : t
                )
            );

            setReviewModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    };

    // Derived stats
    const trustScore = user?.trustScore || 100;
    const strikeCount = user?.strikeCount || 0;
    const completedTrades = user?.totalCompletedTrades || 0;
    const punctualityScore = user?.punctualityScore || 100;
    const userId = user?._id || user?.id; // standardizing the active user ID

    // Filter lists
    // Only pending trades show up in the "Pending" tab
    const pendingRequests = trades.filter(t => t.status === 'pending');
    const activeRequests = trades.filter(t => t.status === 'accepted');
    const myBorrows = borrows.filter(b => (b.borrower?._id || b.borrower) === userId);
    const myLents = borrows.filter(b => (b.lender?._id || b.lender) === userId);
    const pastTrades = trades.filter(t => t.status === 'completed' || t.status === 'rejected' || t.status === 'cancelled');

    return (
        <div style={{ padding: "100px 20px 40px", maxWidth: "1200px", margin: "0 auto" }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ marginBottom: "40px" }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
                    <div>
                        <h1 className="text-gradient" style={{ fontSize: "3rem", marginBottom: "10px" }}>
                            Welcome back, {displayName}
                        </h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem" }}>
                            Your command center for the UniLoop universe.
                        </p>
                    </div>
                    {/* Trust Badge */}
                    <div className="glass-panel" style={{ padding: "15px 25px", display: "flex", alignItems: "center", gap: "15px", borderRadius: "50px", border: `1px solid ${completedTrades < 3 ? 'rgba(255,255,255,0.2)' : trustScore > 80 ? 'rgba(0, 255, 136, 0.4)' : trustScore > 50 ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 68, 68, 0.4)'}` }}>
                        <div style={{ width: "15px", height: "15px", borderRadius: "50%", background: completedTrades < 3 ? '#ccc' : trustScore > 80 ? '#00ff88' : trustScore > 50 ? '#ffd700' : '#ff4444', boxShadow: `0 0 10px ${completedTrades < 3 ? '#ccc' : trustScore > 80 ? '#00ff88' : trustScore > 50 ? '#ffd700' : '#ff4444'}` }}></div>
                        <div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Trust Score</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#fff" }}>{completedTrades < 3 ? "Pending" : `${trustScore}%`}</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px", marginBottom: "40px" }}
            >
                <motion.div variants={itemVariants} className="glass-panel" style={{ padding: "30px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(112, 0, 255, 0.2)", filter: "blur(30px)", borderRadius: "50%" }}></div>
                    <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Completed Trades</h3>
                    <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "#fff", margin: "10px 0" }}>{completedTrades}</div>
                    <p style={{ color: "var(--accent-cyan)", margin: "0", fontSize: "0.85rem" }}>Total successful exchanges</p>
                </motion.div>

                <motion.div variants={itemVariants} className="glass-panel" style={{ padding: "30px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(0, 212, 255, 0.2)", filter: "blur(30px)", borderRadius: "50%" }}></div>
                    <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Active Borrows</h3>
                    <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "#fff", margin: "10px 0" }}>{borrows.filter(b => b.status === 'active').length}</div>
                    <p style={{ color: "var(--accent-purple)", margin: "0", fontSize: "0.85rem" }}>Items you are borrowing/lending</p>
                </motion.div>

                <motion.div variants={itemVariants} className="glass-panel" style={{ padding: "30px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(112, 0, 255, 0.2)", filter: "blur(30px)", borderRadius: "50%" }}></div>
                    <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Punctuality</h3>
                    <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "#fff", margin: "10px 0" }}>{punctualityScore}%</div>
                    <p style={{ color: "var(--accent-cyan)", margin: "0", fontSize: "0.85rem" }}>On-time return rate</p>
                </motion.div>

                <motion.div variants={itemVariants} className="glass-panel" style={{ padding: "30px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: strikeCount > 0 ? "rgba(255, 0, 0, 0.2)" : "rgba(0, 255, 100, 0.2)", filter: "blur(30px)", borderRadius: "50%" }}></div>
                    <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Account Standing</h3>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#fff", margin: "15px 0" }}>
                        {strikeCount === 0 ? "Excellent ✅" : `${strikeCount} Strike(s) ⚠️`}
                    </div>
                    <p style={{ color: "var(--text-secondary)", margin: "0", fontSize: "0.85rem" }}>Moderation status</p>
                </motion.div>
            </motion.div>

            {/* Trade Dashboard Area */}
            <motion.div variants={itemVariants} className="glass-panel" style={{ padding: "30px" }}>
                <div style={{ display: "flex", gap: "15px", marginBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "15px", overflowX: "auto" }}>
                    <button onClick={() => setActiveTab("active")} style={{ background: "none", border: "none", color: activeTab === "active" ? "#fff" : "var(--text-muted)", fontWeight: activeTab === "active" ? "bold" : "normal", fontSize: "1.1rem", cursor: "pointer", position: "relative", whiteSpace: "nowrap" }}>
                        Active Trades {activeRequests.length > 0 && <span style={{ background: "var(--accent-cyan)", color: "#000", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "10px", marginLeft: "8px", verticalAlign: "middle" }}>{activeRequests.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab("pending")} style={{ background: "none", border: "none", color: activeTab === "pending" ? "#fff" : "var(--text-muted)", fontWeight: activeTab === "pending" ? "bold" : "normal", fontSize: "1.1rem", cursor: "pointer", position: "relative", whiteSpace: "nowrap" }}>
                        Pending {pendingRequests.length > 0 && <span style={{ background: "var(--accent-pink)", color: "#fff", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "10px", marginLeft: "8px", verticalAlign: "middle" }}>{pendingRequests.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab("borrowed")} style={{ background: "none", border: "none", color: activeTab === "borrowed" ? "#fff" : "var(--text-muted)", fontWeight: activeTab === "borrowed" ? "bold" : "normal", fontSize: "1.1rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                        Borrowed Items
                    </button>
                    <button onClick={() => setActiveTab("lent")} style={{ background: "none", border: "none", color: activeTab === "lent" ? "#fff" : "var(--text-muted)", fontWeight: activeTab === "lent" ? "bold" : "normal", fontSize: "1.1rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                        Lent Out
                    </button>
                    <button onClick={() => setActiveTab("past")} style={{ background: "none", border: "none", color: activeTab === "past" ? "#fff" : "var(--text-muted)", fontWeight: activeTab === "past" ? "bold" : "normal", fontSize: "1.1rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                        Completed
                    </button>
                </div>

                <div style={{ minHeight: "300px" }}>
                    {loading ? (
                        <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "50px" }}>Loading logs...</p>
                    ) : (
                        <>
                            {activeTab === "pending" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                    {pendingRequests.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>No pending requests.</div>
                                    ) : (
                                        pendingRequests.map(trade => (
                                            <div key={trade._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap", gap: "15px" }}>
                                                <div>
                                                    <h4 style={{ margin: "0 0 5px", color: "#fff" }}>{trade.listing?.title} <span style={{ fontSize: "0.8rem", color: "var(--accent-purple)", marginLeft: "10px", textTransform: "uppercase" }}>{trade.type}</span></h4>
                                                    <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>From: {trade.requester?.email === user.email ? "You" : trade.requester?.email}</p>
                                                    <p style={{ margin: "5px 0 0", color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>"{trade.message}"</p>
                                                </div>

                                                {((trade.owner?._id || trade.owner) === userId) ? (
                                                    <div style={{ display: "flex", gap: "10px" }}>
                                                        <button onClick={() => handleTradeResponse(trade._id, 'rejected')} className="btn-neon" style={{ padding: "6px 16px", background: "rgba(255,68,68,0.1)", borderColor: "rgba(255,68,68,0.3)", color: "#ff4444" }}>Reject</button>
                                                        <button onClick={() => handleTradeResponse(trade._id, 'accepted')} className="btn-neon primary" style={{ padding: "6px 16px" }}>Accept</button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: "var(--accent-cyan)", fontSize: "0.9rem", padding: "6px 12px", background: "rgba(0,212,255,0.1)", borderRadius: "20px" }}>Awaiting Response</span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === "active" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                    {activeRequests.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>No active trades right now.</div>
                                    ) : (
                                        activeRequests.map(trade => (
                                            <div key={trade._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap", gap: "15px" }}>
                                                <div>
                                                    <h4 style={{ margin: "0 0 5px", color: "#fff" }}>{trade.listing?.title} <span style={{ fontSize: "0.8rem", color: "var(--accent-purple)", marginLeft: "10px", textTransform: "uppercase" }}>{trade.type}</span></h4>
                                                    <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Opposite party: {((trade.owner?._id || trade.owner) === userId) ? trade.requester?.email : trade.owner?.email}</p>
                                                </div>

                                                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                    <span style={{ color: "var(--accent-purple)", fontSize: "0.9rem", marginRight: "10px" }}>Trade Accepted</span>
                                                    <button
                                                        onClick={() => navigate('/chat', { state: { tradeId: trade._id } })}
                                                        className="btn-neon"
                                                        style={{ padding: "6px 16px", borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" }}
                                                    >
                                                        Message {(trade.owner?._id || trade.owner) === userId ? "Buyer" : "Seller"}
                                                    </button>
                                                    <button onClick={() => handleCompleteTrade(trade._id)} className="btn-neon primary" style={{ padding: "6px 16px" }}>Mark as Completed</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === "borrowed" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                    {myBorrows.filter(b => b.status === 'active' || b.status === 'overdue').length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>You are not currently borrowing any items.</div>
                                    ) : (
                                        myBorrows.filter(b => b.status === 'active' || b.status === 'overdue').map(borrow => {
                                            const counterpart = borrow.lender?.email;
                                            const role = "Lender";
                                            const confirmed = borrow.borrowerConfirmedReturn;
                                            const otherConfirmed = borrow.lenderConfirmedReturn;

                                            return (
                                                <div key={borrow._id} style={{ padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: `1px solid ${borrow.status === 'overdue' ? 'rgba(255,68,68,0.3)' : 'rgba(255,255,255,0.05)'}` }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "15px" }}>
                                                        <div>
                                                            <h4 style={{ margin: "0 0 5px", color: "#fff" }}>{borrow.listing?.title}</h4>
                                                            <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>{role}: {counterpart}</p>
                                                            <p style={{ margin: "5px 0 0", color: borrow.status === 'overdue' ? "#ff4444" : "var(--accent-cyan)", fontSize: "0.85rem" }}>
                                                                Return by: {format(new Date(borrow.returnDate), 'PPP')} {borrow.status === 'overdue' && '(OVERDUE)'}
                                                            </p>
                                                        </div>
                                                        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                            <button
                                                                onClick={() => navigate('/chat', { state: { tradeId: borrow.tradeRequest } })}
                                                                className="btn-neon"
                                                                style={{ padding: "6px 16px", borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" }}
                                                            >
                                                                Message Lender
                                                            </button>
                                                            {!confirmed ? (
                                                                <button onClick={() => handleConfirmReturn(borrow._id)} className="btn-neon primary" style={{ padding: "6px 16px" }}>Confirm I Returned It</button>
                                                            ) : (
                                                                <span style={{ color: "var(--accent-cyan)", fontSize: "0.9rem" }}>
                                                                    {otherConfirmed ? "Fully Returned" : "Waiting for lender to confirm receipt..."}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            )}

                            {activeTab === "lent" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                    {myLents.filter(b => b.status === 'active' || b.status === 'overdue').length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>You haven't lent out any items currently.</div>
                                    ) : (
                                        myLents.filter(b => b.status === 'active' || b.status === 'overdue').map(borrow => {
                                            const counterpart = borrow.borrower?.email;
                                            const role = "Borrower";
                                            const confirmed = borrow.lenderConfirmedReturn;
                                            const otherConfirmed = borrow.borrowerConfirmedReturn;

                                            return (
                                                <div key={borrow._id} style={{ padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: `1px solid ${borrow.status === 'overdue' ? 'rgba(255,68,68,0.3)' : 'rgba(255,255,255,0.05)'}` }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "15px" }}>
                                                        <div>
                                                            <h4 style={{ margin: "0 0 5px", color: "#fff" }}>{borrow.listing?.title}</h4>
                                                            <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>{role}: {counterpart}</p>
                                                            <p style={{ margin: "5px 0 0", color: borrow.status === 'overdue' ? "#ff4444" : "var(--accent-cyan)", fontSize: "0.85rem" }}>
                                                                Due back: {format(new Date(borrow.returnDate), 'PPP')} {borrow.status === 'overdue' && '(OVERDUE)'}
                                                            </p>
                                                        </div>
                                                        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                            <button
                                                                onClick={() => navigate('/chat', { state: { tradeId: borrow.tradeRequest } })}
                                                                className="btn-neon"
                                                                style={{ padding: "6px 16px", borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" }}
                                                            >
                                                                Message Borrower
                                                            </button>
                                                            {!confirmed ? (
                                                                <button onClick={() => handleConfirmReturn(borrow._id)} className="btn-neon primary" style={{ padding: "6px 16px" }}>Confirm Received</button>
                                                            ) : (
                                                                <span style={{ color: "var(--accent-cyan)", fontSize: "0.9rem" }}>
                                                                    {otherConfirmed ? "Fully Returned" : "Waiting for borrower to confirm return..."}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            )}

                            {activeTab === "past" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                    {pastTrades.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>No past trade history.</div>
                                    ) : (
                                        pastTrades.map(trade => (
                                            <div key={trade._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.03)", flexWrap: "wrap", gap: "10px" }}>
                                                <div>
                                                    <h4 style={{ margin: "0 0 5px", color: "var(--text-secondary)", fontSize: "1rem" }}>{trade.listing?.title || "Unknown Listing"}</h4>
                                                    <span style={{ fontSize: "0.8rem", color: trade.status === 'completed' ? '#00ff88' : 'var(--text-muted)' }}>{trade.status.toUpperCase()}</span>
                                                </div>
                                                {trade.status === 'completed' && !trade.isReviewedByMe && (
                                                    <button onClick={() => handleOpenReview(trade)} className="btn-neon" style={{ padding: "6px 12px", fontSize: "0.85rem" }}>Leave a Review</button>
                                                )}
                                                {trade.status === 'completed' && trade.isReviewedByMe && (
                                                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>Reviewed ✓</span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </motion.div>
            {/* Review Modal */}
            {reviewModalOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div className="glass-panel" style={{ width: "100%", maxWidth: "500px", padding: "30px", borderRadius: "20px", position: "relative" }}>
                        <button onClick={() => setReviewModalOpen(false)} style={{ position: "absolute", top: "15px", right: "20px", background: "none", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer" }}>&times;</button>
                        <h2 style={{ color: "#fff", marginBottom: "20px", marginTop: 0 }}>Rate This Interaction</h2>
                        <form onSubmit={handleSubmitReview}>
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "10px" }}>Rating (1-5 Stars)</label>
                                <input type="range" min="1" max="5" value={reviewData.rating} onChange={(e) => setReviewData({ ...reviewData, rating: Number(e.target.value) })} style={{ width: "100%" }} />
                                <div style={{ textAlign: "center", color: "var(--accent-cyan)", fontSize: "1.5rem", fontWeight: "bold", marginTop: "10px" }}>{reviewData.rating} / 5 ⭐</div>
                            </div>
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "10px" }}>Comments (Optional)</label>
                                <textarea rows="4" value={reviewData.comment} onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })} placeholder="How went the meetup?" style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "8px", resize: "none" }}></textarea>
                            </div>
                            <button type="submit" disabled={submittingReview} className="btn-neon primary" style={{ width: "100%", padding: "12px", fontSize: "1.1rem", opacity: submittingReview ? 0.7 : 1 }}>
                                {submittingReview ? "Submitting..." : "Submit Review"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
