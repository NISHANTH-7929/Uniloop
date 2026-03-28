import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCommunityProfile } from "../../api/communityApi";
import ProfileScoreCard from "../../components/community/ProfileScoreCard";

const CommunityProfile = () => {
    const { userId } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCommunityProfile(userId).then(r => setProfile(r.data.data)).catch(() => {}).finally(() => setLoading(false));
    }, [userId]);

    if (loading) return <div style={{ minHeight: "100vh", background: "var(--bg-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading…</div>;
    if (!profile) return <div style={{ padding: "40px", color: "var(--text-muted)" }}>Profile not found.</div>;

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-dark)", padding: "30px 20px" }}>
            <div style={{ maxWidth: "700px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
                    <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #7000ff, #00d4ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                        {profile.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 style={{ color: "#fff", margin: "0 0 4px", fontSize: "1.4rem" }}>{profile.email?.split("@")[0]}</h1>
                        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.85rem" }}>{profile.role}</p>
                        {profile.bloodType && (
                            <span style={{ background: "#e74c3c22", color: "#e74c3c", padding: "2px 8px", borderRadius: "10px", fontSize: "0.78rem", marginTop: "4px", display: "inline-block" }}>
                                🩸 {profile.bloodType} {profile.isDonorActive ? "(Active Donor)" : ""}
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "28px" }}>
                    <ProfileScoreCard profile={profile} />
                </div>
            </div>
        </div>
    );
};
export default CommunityProfile;
