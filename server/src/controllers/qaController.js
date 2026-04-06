import QAPost from "../models/QAPost.js";
import User from "../models/User.js";
import { getIO } from "../utils/socketUtils.js";
import { checkAndAwardBadges } from "../utils/communityBadgeUtils.js";

const handleError = (res, err) => {
    if (err.name === "CastError") return res.status(400).json({ success: false, message: "Invalid ID format" });
    if (err.name === "ValidationError") return res.status(400).json({ success: false, message: err.message });
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
};

// Extract batch year from a student email like 2024103543@student.annauniv.edu
const getBatchYear = (email) => {
    const match = email?.match(/^(\d{4})/);
    return match ? parseInt(match[1]) : null;
};

// POST /qa
export const createQuestion = async (req, res) => {
    try {
        const post = await QAPost.create({ author: req.user._id, ...req.body });
        return res.status(201).json({ success: true, data: post });
    } catch (err) { return handleError(res, err); }
};

// GET /qa
export const getQuestions = async (req, res) => {
    try {
        const { subjectCode, department, semester, status } = req.query;
        const filter = {};
        if (subjectCode) filter.subjectCode = subjectCode;
        if (department)  filter.department  = department;
        if (semester)    filter.semester    = Number(semester);
        if (status)      filter.status      = status;

        const posts = await QAPost.find(filter)
            .populate("author", "email")
            .select("-answers.upvotes")
            .sort({ createdAt: -1 });
        return res.json({ success: true, data: posts });
    } catch (err) { return handleError(res, err); }
};

// GET /qa/:id
export const getQuestion = async (req, res) => {
    try {
        const post = await QAPost.findByIdAndUpdate(
            req.params.id,
            { $inc: { viewCount: 1 } },
            { new: true }
        ).populate("author", "email").populate("answers.author", "email");
        if (!post) return res.status(404).json({ success: false, message: "Question not found" });
        return res.json({ success: true, data: post });
    } catch (err) { return handleError(res, err); }
};

// POST /qa/:id/answer
export const postAnswer = async (req, res) => {
    try {
        const post = await QAPost.findById(req.params.id).populate("author", "email");
        if (!post) return res.status(404).json({ success: false, message: "Question not found" });

        // Verified Senior check
        const authorBatch  = getBatchYear(post.author.email);
        const answerBatch  = getBatchYear(req.user.email);
        const isVerifiedSenior = answerBatch !== null && authorBatch !== null &&
                                 (authorBatch - answerBatch) >= 2;

        const answer = {
            author:           req.user._id,
            body:             req.body.body,
            imageUrl:         req.body.imageUrl || null,
            isVerifiedSenior,
        };

        post.answers.push(answer);
        await post.save();

        // Notify question poster
        try {
            getIO().to(post.author._id.toString()).emit("qa:answered", {
                questionId:   post._id,
                answererEmail:req.user.email,
            });
        } catch (_) {}

        return res.status(201).json({ success: true, data: post.answers[post.answers.length - 1] });
    } catch (err) { return handleError(res, err); }
};

// PATCH /qa/:id/answer/:answerId/upvote
export const toggleUpvote = async (req, res) => {
    try {
        const post = await QAPost.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Question not found" });

        const answer = post.answers.id(req.params.answerId);
        if (!answer) return res.status(404).json({ success: false, message: "Answer not found" });

        if (answer.author.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "You cannot upvote your own answer" });
        }

        const idx = answer.upvotes.indexOf(req.user._id);
        if (idx === -1) {
            answer.upvotes.push(req.user._id);
        } else {
            answer.upvotes.splice(idx, 1);
        }
        await post.save();

        // Recalculate qaContribScore for answer author
        const authorId = answer.author.toString();
        const allPosts = await QAPost.find({ "answers.author": authorId });
        let totalUpvotes = 0;
        let solvedCount  = 0;
        for (const p of allPosts) {
            for (const a of p.answers) {
                if (a.author.toString() === authorId) {
                    totalUpvotes += a.upvotes.length;
                }
            }
            if (p.solvedAnswerId && p.answers.some(a =>
                a._id.toString() === p.solvedAnswerId.toString() &&
                a.author.toString() === authorId
            )) { solvedCount += 1; }
        }
        const score = totalUpvotes + 3 * solvedCount;
        await User.findByIdAndUpdate(authorId, { "communitySupport.qaContribScore": score });

        // Notify answer author of upvote
        try {
            if (idx === -1) {
                getIO().to(authorId).emit("qa:upvoted", { questionId: post._id, answerId: answer._id });
            }
        } catch (_) {}

        return res.json({ success: true, upvotes: answer.upvotes.length, hasUpvoted: idx === -1 });
    } catch (err) { return handleError(res, err); }
};

// PATCH /qa/:id/solve/:answerId
export const markSolved = async (req, res) => {
    try {
        const post = await QAPost.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Question not found" });
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only the question poster can mark a solution" });
        }

        const answer = post.answers.id(req.params.answerId);
        if (!answer) return res.status(404).json({ success: false, message: "Answer not found" });

        post.status = "solved";
        post.solvedAnswerId = answer._id;
        await post.save();

        // Add 3 to answer author's qaContribScore
        const answerAuthor = await User.findById(answer.author);
        if (answerAuthor) {
            answerAuthor.communitySupport.qaContribScore += 3;
            await answerAuthor.save();
            await checkAndAwardBadges(answerAuthor);
        }

        try {
            getIO().to(answer.author.toString()).emit("qa:solved", { questionId: post._id, answerId: answer._id });
        } catch (_) {}

        return res.json({ success: true, data: post });
    } catch (err) { return handleError(res, err); }
};

// DELETE /qa/:id
export const deleteQuestion = async (req, res) => {
    try {
        const post = await QAPost.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Question not found" });
        if (post.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorised" });
        }
        await post.deleteOne();
        return res.json({ success: true, message: "Question deleted" });
    } catch (err) { return handleError(res, err); }
};

// DELETE /qa/:id/answer/:answerId
export const deleteAnswer = async (req, res) => {
    try {
        const post = await QAPost.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Question not found" });
        const answer = post.answers.id(req.params.answerId);
        if (!answer) return res.status(404).json({ success: false, message: "Answer not found" });
        if (answer.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorised" });
        }
        answer.deleteOne();
        await post.save();
        return res.json({ success: true, message: "Answer deleted" });
    } catch (err) { return handleError(res, err); }
};
