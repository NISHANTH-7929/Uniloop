import React from "react";
import CommunityBadgeChip from "./CommunityBadgeChip";

const AVG = (r) => (r && r.count > 0 ? (r.total / r.count).toFixed(1) : "—");
const STARS = (r) => r ? "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r)) : "No ratings yet";

const ProfileScoreCard = ({ profile }) => {
    if (!profile) return null;
    const cs = profile;

    return (
        <div style={{ display: "grid", gap: "16px" }}>
            {/* Badges */}
            {cs.communityBadges?.length > 0 && (
                <div>
                    <h4 style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Badges</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {cs.communityBadges.map(b => <CommunityBadgeChip key={b} badge={b} />)}
                    </div>
                </div>
            )}

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {[
                    { label: "Sessions", value: cs.sessionsCompleted },
                    { label: "Items Returned", value: cs.itemsReturned },
                    { label: "Donations", value: cs.totalDonations },
                    { label: "QA Score", value: cs.qaContribScore },
                ].map(({ label, value }) => (
                    <div key={label} style={{
                        background: "rgba(255,255,255,0.04)", borderRadius: "12px",
                        padding: "14px", textAlign: "center",
                    }}>
                        <div style={{ color: "#fff", fontSize: "1.5rem", fontWeight: "bold" }}>{value || 0}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Ratings */}
            {cs.ratings && (
                <div>
                    <h4 style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Ratings</h4>
                    {[
                        { label: "As Tutor",      rating: cs.ratings.asTutor },
                        { label: "As Learner",    rating: cs.ratings.asLearner },
                        { label: "Skill Giver",   rating: cs.ratings.asSkillGiver },
                        { label: "Skill Taker",   rating: cs.ratings.asSkillTaker },
                    ].filter(r => r.rating !== "—").map(({ label, rating }) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{label}</span>
                            <span style={{ color: "#ffd700", fontSize: "0.85rem" }}>{rating} ★</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProfileScoreCard;
