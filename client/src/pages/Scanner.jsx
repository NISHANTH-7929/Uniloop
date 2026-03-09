import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verifyTicketQR, checkinTicket, getEventStats } from "../api/events";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const Scanner = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [eventDetails, setEventDetails] = useState(null);
    const [scannedTicket, setScannedTicket] = useState(null); // The raw QR token
    const [ticketData, setTicketData] = useState(null); // Decoded details
    const [scanResult, setScanResult] = useState(null); // { success, message, user }
    const [isScanning, setIsScanning] = useState(true);

    // We need a ref to access the scanner instance to clear it
    const scannerRef = useRef(null);

    useEffect(() => {
        getEventStats(eventId)
            .then(res => {
                setEventDetails(res.data);
                const isFinished = res.data.event?.status === 'finished' || (res.data.event?.endDate && new Date() > new Date(res.data.event?.endDate));
                if (isFinished) {
                    setIsScanning(false);
                    toast.warning("Scanning is disabled for finished events.");
                } else {
                    initScanner();
                }
            })
            .catch(() => toast.error("Failed to load event data."));

        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear();
                } catch (e) {
                    console.error(e);
                }
                scannerRef.current = null;
            }
        };
    }, [eventId]);

    const initScanner = () => {
        setIsScanning(true);
        setScannedTicket(null);
        setTicketData(null);
        setScanResult(null);

        // Ensure element exists before rendering
        setTimeout(() => {
            // Prevent duplicate initialization (React StrictMode can mount twice in dev)
            if (scannerRef.current) {
                try { scannerRef.current.clear(); } catch (e) { /* continue */ }
                scannerRef.current = null;
            }

            const scanner = new Html5QrcodeScanner("reader", {
                qrbox: { width: 250, height: 250 },
                fps: 5
            });
            scannerRef.current = scanner;
            scanner.render(onScanSuccess, onScanError);
        }, 100);
    };

    const onScanSuccess = async (decodedText) => {
        if (scannerRef.current) {
            scannerRef.current.clear(); // Stop scanning
        }
        setIsScanning(false);
        setScannedTicket(decodedText);

        try {
            const { data } = await verifyTicketQR(decodedText);
            setTicketData(data.ticket);
        } catch (error) {
            setScanResult({
                success: false,
                message: error.response?.data?.message || "Invalid or Corrupted QR Code"
            });
            toast.error(error.response?.data?.message || "Scan failed");
        }
    };

    const onScanError = (error) => {
        // Ignore continuous frame errors
    };

    const handleConfirmCheckIn = async () => {
        try {
            const res = await checkinTicket(scannedTicket);
            setScanResult({ success: true, message: res.data.message, user: res.data.user });
            toast.success("Check-in successful!");

            // Auto reload scanner after success
            setTimeout(() => {
                initScanner();
            }, 2000);
        } catch (error) {
            setScanResult({
                success: false,
                message: error.response?.data?.message || "Failed to check-in"
            });
            toast.error(error.response?.data?.message || "Check-in failed");

            setTimeout(() => {
                initScanner();
            }, 2000);
        }
    };

    const handleCancelScan = () => {
        initScanner();
    };

    return (
        <div style={{ padding: "100px 20px 40px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
            <h1 className="text-gradient">Event Scanner</h1>

            {isScanning && !scanResult && (
                <div style={{ marginTop: "30px" }}>
                    <div id="reader" style={{ width: "100%", maxWidth: "500px", margin: "0 auto", borderRadius: "10px", overflow: "hidden", border: "2px solid var(--accent-cyan)", background: "rgba(0,0,0,0.5)" }}></div>
                    <p style={{ marginTop: "20px", color: "var(--text-secondary)" }}>Point camera at the attendee's QR ticket.</p>
                </div>
            )}

            {/* Step 2: Verification Preview */}
            {!isScanning && ticketData && !scanResult && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ padding: "30px", marginTop: "30px", textAlign: "left" }}>
                    <h2 style={{ color: "var(--accent-cyan)", marginBottom: "20px", textAlign: "center" }}>Verify Ticket</h2>

                    <div style={{ background: "rgba(0,0,0,0.3)", padding: "20px", borderRadius: "10px", marginBottom: "20px" }}>
                        <p style={{ margin: "0 0 10px", fontSize: "1.1rem", color: "var(--text-primary)" }}>
                            <strong>Purchased by:</strong> {ticketData.user?.email}
                        </p>
                        <p style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                            <strong>Registered At:</strong> {ticketData.createdAt ? new Date(ticketData.createdAt).toLocaleString() : '—'}
                        </p>
                        <p style={{ margin: "0 0 10px", fontSize: "1.1rem", color: "var(--text-primary)" }}>
                            <strong>Status:</strong> <span style={{ color: "var(--accent-pink)", fontWeight: "bold" }}>{ticketData.status}</span>
                        </p>

                        <h4 style={{ color: "var(--text-secondary)", marginTop: "20px", marginBottom: "10px" }}>
                            Attendees ({ticketData.persons?.length || 1})
                        </h4>

                        {ticketData.persons && ticketData.persons.length > 0 ? (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {ticketData.persons.map((p, idx) => (
                                    <li key={idx} style={{ padding: "10px", background: "rgba(255,255,255,0.05)", marginBottom: "8px", borderRadius: "6px", display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ color: "#fff", fontWeight: "bold" }}>{p.name}</span>
                                        <span style={{ color: "var(--text-muted)" }}>Age: {p.age}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div style={{ color: "var(--text-muted)" }}>Standard Single Ticket (No names provided)</div>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: "15px" }}>
                        <button className="btn-neon primary flex-grow-1" style={{ padding: "12px", fontSize: "1.1rem" }} onClick={handleConfirmCheckIn}>
                            ✅ Confirm Check-In
                        </button>
                        <button className="btn-neon text-white flex-grow-1" style={{ padding: "12px", fontSize: "1.1rem", background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.3)" }} onClick={handleCancelScan}>
                            ❌ Cancel Scan
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Step 3: Result View */}
            {scanResult && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                        marginTop: "50px",
                        padding: "50px 20px",
                        borderRadius: "20px",
                        backgroundColor: scanResult.success ? "rgba(40, 167, 69, 0.1)" : "rgba(220, 53, 69, 0.1)",
                        border: `2px solid ${scanResult.success ? "#28a745" : "#dc3545"}`
                    }}
                >
                    <div style={{ fontSize: "60px", marginBottom: "20px" }}>
                        {scanResult.success ? "✅" : "❌"}
                    </div>
                    <h2 style={{ color: scanResult.success ? "#28a745" : "#dc3545", marginBottom: "10px" }}>
                        {scanResult.message}
                    </h2>
                    {scanResult.success && <p>Returning to scanner...</p>}
                </motion.div>
            )}

            {isScanning && !scanResult && (
                <button className="btn-neon text-white mt-4" onClick={() => navigate("/events")}>
                    Back to Events
                </button>
            )}
        </div>
    );
};

export default Scanner;
