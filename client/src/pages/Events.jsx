import React, { useState } from "react";
import { motion } from "framer-motion";

const Events = () => {
    // Dummy event data for demonstration
    const dummyEvents = [
        { id: 1, title: "Cosmic Code Hackathon", date: "Nov 15, 2026", type: "Competition", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=500&q=80" },
        { id: 2, title: "Nebula UI Workshop", date: "Nov 20, 2026", type: "Workshop", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80" },
        { id: 3, title: "AI Guest Lecture", date: "Nov 25, 2026", type: "Seminar", image: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&w=500&q=80" }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    const cardVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <div style={{ padding: "100px 20px 40px", maxWidth: "1200px", margin: "0 auto" }}>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}
            >
                <div>
                    <h1 className="text-gradient" style={{ fontSize: "3rem", marginBottom: "10px" }}>Discover Events</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Explore upcoming cosmic gatherings and workshops.</p>
                </div>
                <button className="btn-neon">Filter Events</button>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "30px"
                }}
            >
                {dummyEvents.map((ev) => (
                    <motion.div key={ev.id} variants={cardVariants} className="glass-panel" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform var(--transition-fast), box-shadow var(--transition-fast)", cursor: "pointer" }}
                        whileHover={{ scale: 1.03, boxShadow: "0 15px 40px rgba(112,0,255,0.2)" }}
                    >
                        <div style={{ height: "200px", position: "relative", overflow: "hidden" }}>
                            <img src={ev.image} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }} className="event-img" />
                            <div style={{ position: "absolute", top: "15px", right: "15px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)", padding: "5px 12px", borderRadius: "20px", fontSize: "0.8rem", color: "var(--accent-cyan)", border: "1px solid rgba(0,212,255,0.3)" }}>
                                {ev.type}
                            </div>
                        </div>
                        <div style={{ padding: "20px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                            <h3 style={{ margin: "0 0 10px", fontSize: "1.4rem", color: "var(--text-primary)" }}>{ev.title}</h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", marginBottom: "20px", fontSize: "0.9rem" }}>
                                <span>📅</span> {ev.date}
                            </div>
                            <div style={{ marginTop: "auto" }}>
                                <button className="btn-neon primary w-100" style={{ padding: "8px", fontSize: "0.9rem" }}>Register Now</button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* CSS for hover effect on image */}
            <style>{`
                .glass-panel:hover .event-img {
                    transform: scale(1.1);
                }
            `}</style>
        </div>
    );
};

export default Events;
