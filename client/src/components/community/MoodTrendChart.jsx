import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MoodTrendChart = ({ logs }) => {
    if (!logs || logs.length < 3) {
        return (
            <div style={{
                textAlign: "center", padding: "50px 20px",
                color: "var(--text-muted)", fontSize: "0.95rem",
            }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📈</div>
                <p>Keep logging to see your trend</p>
                <p style={{ fontSize: "0.82rem", opacity: 0.7 }}>3 or more entries needed</p>
            </div>
        );
    }

    const data = logs.map(log => ({
        date: new Date(log.loggedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        score: log.score,
    }));

    return (
        <div style={{ width: "100%", height: "240px" }}>
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 11 }} />
                    <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} stroke="#888" tick={{ fontSize: 11 }} />
                    <Tooltip
                        contentStyle={{ background: "rgba(20,20,40,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
                        labelStyle={{ color: "#fff" }}
                        itemStyle={{ color: "#a855f7" }}
                    />
                    <Line
                        type="monotone" dataKey="score"
                        stroke="url(#moodGradient)" strokeWidth={3}
                        dot={{ fill: "#a855f7", strokeWidth: 0, r: 5 }}
                        activeDot={{ r: 7, fill: "#7000ff" }}
                    />
                    <defs>
                        <linearGradient id="moodGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#7000ff" />
                            <stop offset="100%" stopColor="#00d4ff" />
                        </linearGradient>
                    </defs>
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MoodTrendChart;
