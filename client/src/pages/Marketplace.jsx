import React from "react";
import { motion } from "framer-motion";

const Marketplace = () => {
    // Dummy marketplace items
    const items = [
        { id: 1, title: "Galaxy S24 Ultra", price: "₹85,000", condition: "Like New", category: "Electronics" },
        { id: 2, title: "Engineering Physics Book", price: "₹350", condition: "Good", category: "Books" },
        { id: 3, title: "Scientific Calculator", price: "₹600", condition: "Used", category: "Supplies" },
        { id: 4, title: "Hostel Mattress pad", price: "₹400", condition: "Fair", category: "Housing" }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    return (
        <div style={{ padding: "100px 20px 40px", maxWidth: "1200px", margin: "0 auto" }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}
            >
                <div>
                    <h1 className="text-gradient" style={{ fontSize: "3rem", marginBottom: "10px" }}>Marketplace</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Buy, sell, and trade within the UniLoop network.</p>
                </div>
                <button className="btn-neon primary" style={{ padding: "10px 24px" }}>
                    + List Item
                </button>
            </motion.div>

            {/* Categories */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{ display: "flex", gap: "10px", marginBottom: "40px", overflowX: "auto", paddingBottom: "10px", flexWrap: "nowrap" }}
            >
                {['All', 'Electronics', 'Books', 'Supplies', 'Housing'].map((cat, i) => (
                    <button key={i} className={`btn-neon ${i === 0 ? 'primary' : ''}`} style={{ flexShrink: 0, padding: "6px 16px", fontSize: "0.85rem", borderRadius: "20px" }}>
                        {cat}
                    </button>
                ))}
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "24px"
                }}
            >
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        variants={{ hidden: { scale: 0.9, opacity: 0 }, visible: { scale: 1, opacity: 1, transition: { type: "spring" } } }}
                        className="glass-panel"
                        style={{
                            padding: "24px",
                            display: "flex",
                            flexDirection: "column",
                            position: "relative",
                            overflow: "hidden"
                        }}
                    >
                        {/* subtle background glow based on category */}
                        <div style={{ position: "absolute", top: "-50px", left: "-50px", width: "150px", height: "150px", background: item.category === "Electronics" ? "rgba(0,212,255,0.1)" : "rgba(112,0,255,0.1)", filter: "blur(40px)", borderRadius: "50%", zIndex: 0 }}></div>

                        <div style={{ zIndex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                                <span style={{ background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: "4px", fontSize: "0.75rem", color: "var(--text-secondary)", letterSpacing: "1px", textTransform: "uppercase" }}>
                                    {item.category}
                                </span>
                                <span style={{ color: "var(--accent-cyan)", fontWeight: "bold", fontSize: "1.2rem" }}>
                                    {item.price}
                                </span>
                            </div>
                            <h3 style={{ margin: "0 0 8px", fontSize: "1.2rem", color: "#fff" }}>{item.title}</h3>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>Condition: {item.condition}</p>

                            <button className="btn-neon w-100" style={{ padding: "8px", fontSize: "0.9rem" }}>View Details</button>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default Marketplace;
