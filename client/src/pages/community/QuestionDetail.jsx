import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getQAQuestion, postAnswer, toggleUpvote, markSolved, deleteAnswer } from "../../api/communityApi";
import { useAuth } from "../../context/AuthContext";
import AnswerItem from "../../components/community/AnswerItem";
import { toast } from "react-toastify";

const QuestionDetail = () => {
    const { id }   = useParams();
    const { user } = useAuth();
    const [post, setPost]     = useState(null);
    const [answer, setAnswer] = useState("");
    const [answerImage, setAnswerImage] = useState(null);
    const [answerImagePreview, setAnswerImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const load = async () => { try { const r = await getQAQuestion(id); setPost(r.data.data); } catch (_) {} };
    useEffect(() => { load(); }, [id]);

    if (!post) return <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading…</div>;

    const userId = user?._id || user?.id;
    const isAuthor = post.author?._id === userId || post.author === userId;

    const handleAnswer = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("body", answer);
            if (answerImage) formData.append("image", answerImage);
            await postAnswer(id, formData);
            toast.success("Answer posted!");
            setAnswer("");
            setAnswerImage(null);
            setAnswerImagePreview(null);
            load();
        } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
        setLoading(false);
    };

    const handleAnswerImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
        setAnswerImage(file);
        setAnswerImagePreview(URL.createObjectURL(file));
    };

    const handleUpvote = async (answerId) => {
        try { await toggleUpvote(id, answerId); load(); } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    };

    const handleSolve = async (answerId) => {
        try { await markSolved(id, answerId); toast.success("Marked as solution!"); load(); } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "100px 20px 40px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                {/* Question */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "30px", marginBottom: "28px" }}>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                        <span style={{ background: "rgba(112,0,255,0.2)", color: "#a855f7", padding: "3px 10px", borderRadius: "12px", fontSize: "0.78rem" }}>{post.subjectCode}</span>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", lineHeight: "1.7rem" }}>Sem {post.semester} · {post.viewCount} views</span>
                        {post.status === "solved" && <span style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", padding: "3px 10px", borderRadius: "12px", fontSize: "0.78rem" }}>✓ Solved</span>}
                    </div>
                    <h1 style={{ color: "#fff", margin: "0 0 16px", fontSize: "1.5rem", lineHeight: 1.3 }}>{post.title}</h1>
                    <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{post.body}</p>
                    {post.tags?.length > 0 && (
                        <div style={{ display: "flex", gap: "6px", marginTop: "16px", flexWrap: "wrap" }}>
                            {post.tags.map(t => <span key={t} style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", padding: "2px 8px", borderRadius: "8px", fontSize: "0.78rem" }}>#{t}</span>)}
                        </div>
                    )}
                </div>

                {/* Answers */}
                <h2 style={{ color: "#fff", marginBottom: "16px" }}>💬 {post.answers?.length || 0} Answers</h2>
                {post.answers?.sort((a, b) => b.upvotes?.length - a.upvotes?.length).map(a => (
                    <AnswerItem
                        key={a._id}
                        answer={a}
                        questionAuthorId={post.author?._id || post.author}
                        solvedAnswerId={post.solvedAnswerId}
                        questionId={post._id}
                        onUpvote={handleUpvote}
                        onMarkSolved={handleSolve}
                    />
                ))}

                {/* Post answer */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "24px", marginTop: "20px" }}>
                    <h3 style={{ color: "#fff", margin: "0 0 14px" }}>✏️ Your Answer</h3>
                    <form onSubmit={handleAnswer}>
                        <textarea required value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Write your answer here…" rows={5}
                            style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", resize: "vertical", boxSizing: "border-box", marginBottom: "14px" }} />
                        <div style={{ marginBottom: "14px" }}>
                            <label style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "6px", display: "block" }}>Attach Photo (optional, max 5MB)</label>
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAnswerImageChange}
                                style={{ width: "100%", padding: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff" }} />
                            {answerImagePreview && (
                                <div style={{ marginTop: 8, position: "relative", display: "inline-block" }}>
                                    <img src={answerImagePreview} alt="preview" style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 8 }} />
                                    <button type="button" onClick={() => { setAnswerImage(null); setAnswerImagePreview(null); }}
                                        style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: "0.65rem" }}>✕</button>
                                </div>
                            )}
                        </div>
                        <button id="qa-answer-btn" type="submit" disabled={loading}
                            style={{ padding: "11px 26px", background: "linear-gradient(135deg, #00d4ff, #7000ff)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer" }}>
                            {loading ? "Posting…" : "Post Answer"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default QuestionDetail;
