import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchListings, fetchCategories, createListing } from "../api/listingApi";
import { createTradeRequest } from "../api/tradeApi";
import { toast } from "react-toastify";
import { Search, MapPin, Tag, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Marketplace = () => {
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [listingTypeFilter, setListingTypeFilter] = useState("all"); // 'all', 'sell', 'rent', 'borrow'

    // Modal state
    const [selectedListing, setSelectedListing] = useState(null);
    const [tradeMessage, setTradeMessage] = useState("");

    // Create Listing Modal State
    const [isCreatingListing, setIsCreatingListing] = useState(false);
    const [newListing, setNewListing] = useState({
        title: "",
        description: "",
        price: "",
        category: "",
        listingType: "sell",
        condition: "New"
    });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [listingsRes, categoriesRes] = await Promise.all([
                    fetchListings(),
                    fetchCategories()
                ]);
                setListings(listingsRes.data);
                setCategories(categoriesRes.data);
            } catch (error) {
                console.error("Failed to fetch marketplace data", error);
                toast.error("Error loading marketplace");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const filteredListings = listings.filter((listing) => {
        const matchesCategory = activeCategory === "All" || listing.category?.name === activeCategory;
        const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            listing.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = listingTypeFilter === "all" || listing.listingType === listingTypeFilter;
        return matchesCategory && matchesSearch && matchesType;
    });

    const handleTradeSubmit = async (e) => {
        e.preventDefault();
        try {
            await createTradeRequest({
                listingId: selectedListing._id,
                type: selectedListing.listingType, // buy, rent, or borrow
                message: tradeMessage
            });
            toast.success("Trade request sent successfully!");
            setSelectedListing(null);
            setTradeMessage("");
            navigate('/chat');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send trade request");
        }
    };

    const handleCreateListing = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newListing,
                price: newListing.listingType === "borrow" ? 0 : Number(newListing.price)
            };
            const res = await createListing(payload);
            toast.success("Listing created successfully!");
            setListings([res.data, ...listings]); // Optimistic load
            setIsCreatingListing(false);
            setNewListing({ title: "", description: "", price: "", category: "", listingType: "sell", condition: "New" }); // reset
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create listing");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const getListingColor = (type) => {
        switch (type) {
            case 'sell': return 'rgba(0,212,255,0.1)';
            case 'rent': return 'rgba(255, 0, 200, 0.1)';
            case 'borrow': return 'rgba(112,0,255,0.1)';
            default: return 'rgba(255,255,255,0.05)';
        }
    };

    const getListingBadgeColor = (type) => {
        switch (type) {
            case 'sell': return 'var(--accent-cyan)';
            case 'rent': return 'var(--accent-pink)';
            case 'borrow': return 'var(--accent-purple)';
            default: return 'var(--text-secondary)';
        }
    };

    return (
        <div style={{ padding: "100px 20px 40px", maxWidth: "1200px", margin: "0 auto" }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}
            >
                <div style={{ flex: "1 1 auto" }}>
                    <h1 className="text-gradient" style={{ fontSize: "3rem", marginBottom: "10px" }}>Marketplace</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Buy, sell, rent, and borrow within the UniLoop network.</p>

                    <div style={{ marginTop: "20px", display: "flex", gap: "15px", flexWrap: "wrap" }}>
                        <div style={{ position: "relative", flex: "1 1 300px", maxWidth: "400px" }}>
                            <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%", padding: "10px 10px 10px 40px", borderRadius: "8px",
                                    border: "1px solid var(--border-glass)", background: "rgba(0,0,0,0.3)",
                                    color: "white", outline: "none"
                                }}
                            />
                        </div>

                        <select
                            value={listingTypeFilter}
                            onChange={(e) => setListingTypeFilter(e.target.value)}
                            style={{
                                padding: "10px", borderRadius: "8px", border: "1px solid var(--border-glass)",
                                background: "rgba(0,0,0,0.3)", color: "white", outline: "none"
                            }}
                        >
                            <option value="all">Any Type</option>
                            <option value="sell">For Sale</option>
                            <option value="rent">For Rent</option>
                            <option value="borrow">Borrow-Ready</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={() => setIsCreatingListing(true)}
                    className="btn-neon primary"
                    style={{ padding: "10px 24px", height: "fit-content" }}
                >
                    + List Item
                </button>
            </motion.div>

            {/* Categories Row */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{ display: "flex", gap: "10px", marginBottom: "40px", overflowX: "auto", paddingBottom: "10px" }}
                className="hide-scrollbar"
            >
                {["All", ...categories.map(c => c.name)].map((cat, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveCategory(cat)}
                        className={`btn-neon ${cat === activeCategory ? 'primary' : ''}`}
                        style={{
                            flexShrink: 0, padding: "6px 16px", fontSize: "0.85rem", borderRadius: "20px",
                            background: cat === activeCategory ? '' : 'rgba(255,255,255,0.05)',
                            borderColor: cat === activeCategory ? '' : 'rgba(255,255,255,0.1)'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </motion.div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "50px", color: "var(--text-muted)" }}>Loading marketplace data...</div>
            ) : filteredListings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px", color: "var(--text-muted)", background: "var(--panel-bg)", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                    No listings found matching your criteria.
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: "24px"
                    }}
                >
                    {filteredListings.map((item) => (
                        <motion.div
                            key={item._id}
                            variants={{ hidden: { scale: 0.9, opacity: 0 }, visible: { scale: 1, opacity: 1, transition: { type: "spring" } } }}
                            className="glass-panel"
                            style={{
                                padding: "24px",
                                display: "flex",
                                flexDirection: "column",
                                position: "relative",
                                overflow: "hidden",
                                cursor: "pointer",
                                transition: "transform 0.2s"
                            }}
                            whileHover={{ y: -5 }}
                            onClick={() => setSelectedListing(item)}
                        >
                            <div style={{ position: "absolute", top: "-50px", left: "-50px", width: "150px", height: "150px", background: getListingColor(item.listingType), filter: "blur(40px)", borderRadius: "50%", zIndex: 0 }}></div>

                            <div style={{ zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <span style={{ background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: "4px", fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                                        {item.category?.name || "General"}
                                    </span>
                                    <span style={{ color: getListingBadgeColor(item.listingType), fontWeight: "bold", fontSize: "1.1rem" }}>
                                        {item.listingType === 'borrow' ? 'Free (Borrow)' : `₹${item.price}`}
                                    </span>
                                </div>

                                <h3 style={{ margin: "0 0 8px", fontSize: "1.2rem", color: "#fff", lineHeight: "1.3" }}>{item.title}</h3>

                                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "15px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                    {item.description}
                                </p>

                                <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "15px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                        <Tag size={14} color={getListingBadgeColor(item.listingType)} />
                                        <span style={{ textTransform: "capitalize" }}>{item.listingType}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                        <MapPin size={14} />
                                        {item.meetupLocations?.length > 0 ? item.meetupLocations[0].campus : "Campus General"}
                                    </div>

                                    {/* Trust Score indicator of seller */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.seller?.trustScore > 80 ? "#00ff88" : item.seller?.trustScore > 50 ? "#ffd700" : "#ff4444" }}></div>
                                        Seller Trust: {item.seller?.trustScore || 100}%
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Trade Request Modal */}
            <AnimatePresence>
                {selectedListing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                            background: "rgba(0,0,0,0.8)", zIndex: 1000,
                            display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
                            backdropFilter: "blur(5px)"
                        }}
                        onClick={() => setSelectedListing(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="glass-panel"
                            style={{ maxWidth: "500px", width: "100%", padding: "30px" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 style={{ color: "white", marginBottom: "10px" }}>Request to {selectedListing.listingType}</h2>
                            <p style={{ color: "var(--accent-cyan)", fontSize: "1.2rem", fontWeight: "bold", marginBottom: "5px" }}>{selectedListing.title}</p>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>{selectedListing.description}</p>

                            <form onSubmit={handleTradeSubmit}>
                                <div style={{ marginBottom: "20px" }}>
                                    <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "8px" }}>Include a message</label>
                                    <textarea
                                        rows="3"
                                        placeholder={`Hi, I'm interested in this item...`}
                                        value={tradeMessage}
                                        onChange={(e) => setTradeMessage(e.target.value)}
                                        style={{
                                            width: "100%", padding: "12px", borderRadius: "8px",
                                            border: "1px solid var(--border-glass)", background: "rgba(0,0,0,0.3)",
                                            color: "white", outline: "none", resize: "none"
                                        }}
                                        required
                                    />
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button type="button" onClick={() => setSelectedListing(null)} className="btn-neon" style={{ flex: 1, background: "rgba(255,255,255,0.05)" }}>Cancel</button>
                                    <button type="submit" className="btn-neon primary" style={{ flex: 1 }}>Send Request</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Listing Modal */}
            <AnimatePresence>
                {isCreatingListing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                            background: "rgba(0,0,0,0.8)", zIndex: 1000,
                            display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
                            backdropFilter: "blur(5px)"
                        }}
                        onClick={() => setIsCreatingListing(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="glass-panel"
                            style={{ maxWidth: "500px", width: "100%", padding: "30px", maxHeight: "90vh", overflowY: "auto" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 style={{ color: "white", marginBottom: "20px" }}>Create New Listing</h2>
                            <form onSubmit={handleCreateListing} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                <div>
                                    <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "8px" }}>Title</label>
                                    <input required type="text" value={newListing.title} onChange={(e) => setNewListing({ ...newListing, title: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "rgba(0,0,0,0.3)", color: "white", outline: "none" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "8px" }}>Description</label>
                                    <textarea required rows="3" value={newListing.description} onChange={(e) => setNewListing({ ...newListing, description: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "rgba(0,0,0,0.3)", color: "white", resize: "none", outline: "none" }} />
                                </div>
                                <div style={{ display: "flex", gap: "15px" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "8px" }}>Type</label>
                                        <select required value={newListing.listingType} onChange={(e) => setNewListing({ ...newListing, listingType: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "rgba(0,0,0,0.3)", color: "white", outline: "none" }}>
                                            <option style={{ color: "black" }} value="sell">Sell</option>
                                            <option style={{ color: "black" }} value="rent">Rent</option>
                                            <option style={{ color: "black" }} value="borrow">Borrow</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "8px" }}>Price (₹)</label>
                                        <input required={newListing.listingType !== "borrow"} disabled={newListing.listingType === "borrow"} type="number" min="0" value={newListing.price} onChange={(e) => setNewListing({ ...newListing, price: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "rgba(0,0,0,0.3)", color: "white", outline: "none" }} />
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "15px" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "8px" }}>Category</label>
                                        <select required value={newListing.category} onChange={(e) => setNewListing({ ...newListing, category: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "rgba(0,0,0,0.3)", color: "white", outline: "none" }}>
                                            <option style={{ color: "black" }} value="" disabled>Select Category</option>
                                            {categories.map(c => <option style={{ color: "black" }} key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "8px" }}>Condition</label>
                                        <select required value={newListing.condition} onChange={(e) => setNewListing({ ...newListing, condition: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-glass)", background: "rgba(0,0,0,0.3)", color: "white", outline: "none" }}>
                                            <option style={{ color: "black" }} value="New">New</option>
                                            <option style={{ color: "black" }} value="Like New">Like New</option>
                                            <option style={{ color: "black" }} value="Good">Good</option>
                                            <option style={{ color: "black" }} value="Fair">Fair</option>
                                            <option style={{ color: "black" }} value="Poor">Poor</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                    <button type="button" onClick={() => setIsCreatingListing(false)} className="btn-neon" style={{ flex: 1, background: "rgba(255,255,255,0.05)" }}>Cancel</button>
                                    <button type="submit" className="btn-neon primary" style={{ flex: 1 }}>Create Listing</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Marketplace;
