import React, { useState } from "react";

const CounselorSlotPicker = ({ slots, onBook }) => {
    const [selected, setSelected] = useState(null);
    const [done, setDone]         = useState(false);
    const [loading, setLoading]   = useState(false);

    const groupByDate = slots.reduce((acc, slot) => {
        if (!acc[slot.date]) acc[slot.date] = [];
        acc[slot.date].push(slot);
        return acc;
    }, {});

    const handleBook = async () => {
        if (!selected) return;
        setLoading(true);
        await onBook(selected);
        setLoading(false);
        setDone(true);
    };

    if (done) {
        return (
            <div style={{ textAlign: "center", padding: "30px" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📅</div>
                <p style={{ color: "#00d4ff", fontWeight: "bold" }}>
                    Your session is requested for {selected?.date} at {selected?.time}.
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                    You'll receive a confirmation from the counselor.
                </p>
            </div>
        );
    }

    return (
        <div>
            {Object.entries(groupByDate).slice(0, 5).map(([date, daySlots]) => (
                <div key={date} style={{ marginBottom: "20px" }}>
                    <h4 style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "10px" }}>
                        {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })}
                    </h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {daySlots.map(slot => {
                            const key = `${slot.date}_${slot.time}`;
                            const isSelected = selected?.date === slot.date && selected?.time === slot.time;
                            return (
                                <button
                                    key={key}
                                    id={`slot-${key}`}
                                    disabled={slot.isBooked}
                                    onClick={() => setSelected(slot)}
                                    style={{
                                        padding: "8px 14px", borderRadius: "8px", fontSize: "0.85rem",
                                        cursor: slot.isBooked ? "not-allowed" : "pointer",
                                        background: slot.isBooked
                                            ? "rgba(255,255,255,0.03)"
                                            : isSelected
                                            ? "linear-gradient(135deg, #7000ff, #00d4ff)"
                                            : "rgba(255,255,255,0.07)",
                                        border: `1px solid ${isSelected ? "transparent" : "rgba(255,255,255,0.1)"}`,
                                        color: slot.isBooked ? "rgba(255,255,255,0.2)" : "#fff",
                                    }}
                                >
                                    {slot.time} {slot.isBooked ? "(Booked)" : ""}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
            <button
                id="book-counselor-btn"
                onClick={handleBook}
                disabled={!selected || loading}
                style={{
                    marginTop: "10px", width: "100%", padding: "12px",
                    background: selected ? "linear-gradient(135deg, #7000ff, #00d4ff)" : "rgba(255,255,255,0.05)",
                    border: "none", borderRadius: "10px",
                    color: selected ? "#fff" : "var(--text-muted)",
                    fontWeight: "bold", cursor: selected ? "pointer" : "not-allowed",
                }}
            >
                {loading ? "Booking…" : `Book ${selected ? `${selected.date} at ${selected.time}` : "a Slot"}`}
            </button>
        </div>
    );
};

export default CounselorSlotPicker;
