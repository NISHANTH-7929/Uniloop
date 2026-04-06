/**
 * communitySeed.js
 * Run with: node server/seeds/communitySeed.js
 * Seeds demo data for all CommunitySupport sub-features.
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ── Models ────────────────────────────────────────────────────────────────────
import User from "../src/models/User.js";
import LostFoundItem from "../src/models/LostFoundItem.js";
import EmergencyRequest from "../src/models/EmergencyRequest.js";
import TutoringSession from "../src/models/TutoringSession.js";
import SkillExchange from "../src/models/SkillExchange.js";
import QAPost from "../src/models/QAPost.js";
import Complaint from "../src/models/Complaint.js";
import Notice from "../src/models/Notice.js";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/uniloop";

async function seed() {
    console.log("🌱 Connecting to:", MONGO_URI.split("@").pop() || MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected\n");

    // ── Find/create 3 test users ───────────────────────────────────────────────
    // Use valid Anna University email format: 10-digit roll number @student.annauniv.edu
    const SEED_EMAILS = [
        "2024100001@student.annauniv.edu",
        "2024100002@student.annauniv.edu",
        "2024100003@student.annauniv.edu",
    ];
    let users = await User.find({ email: { $in: SEED_EMAILS } });

    if (users.length < 3) {
        console.log("Creating 3 test students...");
        // Bypass password validation by inserting directly (already hashed)
        await User.deleteMany({ email: { $in: SEED_EMAILS } });

        const hashed = await bcrypt.hash("Seed@12345", 8);
        users = await User.collection.insertMany([
            {
                email: SEED_EMAILS[0], password: hashed,
                role: "student", isVerified: true,
                hostelBlock: "A",
                communitySupport: {
                    bloodType: "B+", isDonorActive: true, totalDonations: 2,
                    communityBadges: ["Good Samaritan"],
                    sessionsCompleted: 3, itemsReturned: 2, qaContribScore: 15,
                    ratings: {
                        asTutor:      { total: 0, count: 0 },
                        asLearner:    { total: 0, count: 0 },
                        asSkillGiver: { total: 0, count: 0 },
                        asSkillTaker: { total: 0, count: 0 },
                        asLFReturner: { total: 8, count: 2 },
                        asLFClaimer:  { total: 0, count: 0 },
                    },
                    moodLogs: [], counselorBookings: [],
                    counselorNudgeSent: false, counselorNudgedAt: null,
                },
                createdAt: new Date(), updatedAt: new Date(),
            },
            {
                email: SEED_EMAILS[1], password: hashed,
                role: "student", isVerified: true,
                hostelBlock: "B",
                communitySupport: {
                    bloodType: "O+", isDonorActive: true, totalDonations: 5,
                    communityBadges: ["Verified Tutor"],
                    sessionsCompleted: 7, itemsReturned: 1, qaContribScore: 32,
                    ratings: {
                        asTutor:      { total: 42, count: 7 },
                        asLearner:    { total: 0,  count: 0 },
                        asSkillGiver: { total: 0,  count: 0 },
                        asSkillTaker: { total: 0,  count: 0 },
                        asLFReturner: { total: 4,  count: 1 },
                        asLFClaimer:  { total: 0,  count: 0 },
                    },
                    moodLogs: [], counselorBookings: [],
                    counselorNudgeSent: false, counselorNudgedAt: null,
                },
                createdAt: new Date(), updatedAt: new Date(),
            },
            {
                email: SEED_EMAILS[2], password: hashed,
                role: "student", isVerified: true,
                hostelBlock: "C",
                communitySupport: {
                    bloodType: "A+", isDonorActive: true, totalDonations: 1,
                    communityBadges: ["Skill Sharer"],
                    sessionsCompleted: 5, itemsReturned: 0, qaContribScore: 10,
                    ratings: {
                        asTutor:      { total: 0,  count: 0 },
                        asLearner:    { total: 20, count: 5 },
                        asSkillGiver: { total: 15, count: 3 },
                        asSkillTaker: { total: 0,  count: 0 },
                        asLFReturner: { total: 0,  count: 0 },
                        asLFClaimer:  { total: 0,  count: 0 },
                    },
                    moodLogs: [], counselorBookings: [],
                    counselorNudgeSent: false, counselorNudgedAt: null,
                },
                createdAt: new Date(), updatedAt: new Date(),
            },
        ]);

        // Re-fetch so we have proper _id as ObjectId
        users = await User.find({ email: { $in: SEED_EMAILS } });
        console.log("  ✓ 3 seed users created");
    } else {
        console.log("  ✓ Seed users already exist");
    }

    const [alice, bob, carol] = users;

    // ── Clear existing seed data ───────────────────────────────────────────────
    await Promise.all([
        LostFoundItem.deleteMany({ reporter: { $in: users.map(u => u._id) } }),
        EmergencyRequest.deleteMany({ poster: { $in: users.map(u => u._id) } }),
        TutoringSession.deleteMany({ tutor: { $in: users.map(u => u._id) } }),
        SkillExchange.deleteMany({ poster: { $in: users.map(u => u._id) } }),
        QAPost.deleteMany({ author: { $in: users.map(u => u._id) } }),
        Complaint.deleteMany({ reporter: { $in: users.map(u => u._id) } }),
        Notice.deleteMany({ postedBy: { $in: users.map(u => u._id) } }),
    ]);
    console.log("  ✓ Previous seed data cleared\n");

    // ── 1. Lost & Found ────────────────────────────────────────────────────────
    const lfItems = await LostFoundItem.insertMany([
        {
            reporter: alice._id,
            isAnonymous: false,
            type: "lost",
            title: "Blue Leather Wallet",
            description: "Lost my navy blue wallet near the canteen. Contains student ID card and some cash. Has a small tear on the right corner.",
            category: "wallet",
            locationTag: "Main Canteen Area",
            status: "active",
        },
        {
            reporter: bob._id,
            isAnonymous: false,
            type: "found",
            title: "Found: Black iPhone 14",
            description: "Found a black iPhone 14 near the football ground. The screen has a small crack at the top right. If this is yours, describe a distinctive detail.",
            category: "phone",
            locationTag: "Football Ground, Block B",
            status: "active",
            claimVerification: {
                question: "What's the first name shown on your lock screen wallpaper or notification?",
                answerHash: await bcrypt.hash("mom", 10),
            },
        },
        {
            reporter: carol._id,
            isAnonymous: true,
            type: "lost",
            title: "Keys with BMW Keychain",
            description: "Lost a set of keys with a distinctive BMW logo keychain. Has about 5-6 keys on it. Please contact if found!",
            category: "keys",
            locationTag: "Library 2nd Floor",
            status: "active",
        },
        {
            reporter: alice._id,
            isAnonymous: false,
            type: "found",
            title: "Found: Engineering Drawing Kit",
            description: "Found a complete engineering drawing kit (drafter, scales, compass) in a green pouch. Left at Lab 3B.",
            category: "stationery",
            locationTag: "Lab 3B, CSE Block",
            status: "active",
        },
        {
            reporter: bob._id,
            isAnonymous: false,
            type: "lost",
            title: "Wireless Earphones (white)",
            description: "Lost my white wireless earphones case near the hostel common room. The case has a small sticker on it.",
            category: "electronics",
            locationTag: "Hostel Block B Common Room",
            status: "active",
        },
    ]);
    console.log(`  ✓ Lost & Found: ${lfItems.length} items`);

    // ── 2. Emergency Network ───────────────────────────────────────────────────
    const emergencies = await EmergencyRequest.insertMany([
        {
            poster: alice._id,
            type: "blood",
            bloodType: "B+",
            urgency: "critical",
            title: "Urgent: B+ Blood Needed",
            description: "A student's family member is undergoing surgery at General Hospital. Urgently need B+ blood donors. Please respond ASAP!",
            location: "General Hospital (5 mins from campus main gate)",
            broadcastScope: "campus",
            status: "active",
            responses: [],
        },
        {
            poster: bob._id,
            type: "medical",
            urgency: "normal",
            title: "Student Fell, Needs Escort to Medical Room",
            description: "A student fainted near Lab Block C. If anyone is nearby and can help escort them to the medical room, please respond.",
            location: "Lab Block C Corridor",
            broadcastScope: "block",
            status: "active",
            responses: [
                { responder: carol._id, message: "On my way! I'm 2 mins from Lab Block C.", confirmed: false }
            ],
        },
    ]);
    console.log(`  ✓ Emergencies: ${emergencies.length} posts`);

    // ── 3. Peer Tutoring ───────────────────────────────────────────────────────
    const tutoring = await TutoringSession.insertMany([
        {
            tutor: bob._id,
            sessionType: "offer",
            subject: "Data Structures & Algorithms",
            subjectCode: "CS8391",
            department: "CSE",
            semester: 3,
            description: "I can help with arrays, linked lists, trees, and graph algorithms. I scored 95 in this last sem! Available weekends.",
            chargePerHour: 0,
            mode: "inperson",
            status: "open",
        },
        {
            tutor: alice._id,
            sessionType: "offer",
            subject: "Engineering Mathematics III",
            subjectCode: "MA8351",
            department: "CSE",
            semester: 3,
            description: "Can tutor Laplace transforms, Fourier series, and Z-transforms. Very systematic approach. 2 sessions/week.",
            chargePerHour: 50,
            mode: "online",
            status: "open",
        },
        {
            tutor: carol._id,
            sessionType: "request",
            subject: "Database Management Systems",
            subjectCode: "CS8492",
            department: "CSE",
            semester: 4,
            description: "Struggling with normalization and SQL joins. Need a patient tutor who can explain with examples.",
            chargePerHour: 0,
            mode: "inperson",
            status: "open",
        },
        {
            tutor: bob._id,
            sessionType: "offer",
            subject: "Computer Networks",
            subjectCode: "CS8591",
            department: "CSE",
            semester: 5,
            description: "Covering OSI model, TCP/IP, subnetting, routing protocols. I can also help with Wireshark labs.",
            chargePerHour: 30,
            mode: "inperson",
            status: "open",
        },
    ]);
    console.log(`  ✓ Tutoring: ${tutoring.length} sessions`);

    // ── 4. Skill Exchange ──────────────────────────────────────────────────────
    const skills = await SkillExchange.insertMany([
        {
            poster: alice._id,
            offerSkill: "Guitar lessons",
            offerDetail: "Can teach acoustic guitar — chords, strumming patterns, 5+ songs for beginners",
            wantSkill: "Python programming help",
            wantDetail: "Need help with NumPy and pandas for my data science project",
            category: "music",
            duration: "3 × 1-hour sessions",
            chargeIfAny: 0,
            status: "open",
        },
        {
            poster: bob._id,
            offerSkill: "Circuit diagram & PCB design",
            offerDetail: "Eagle CAD and KiCad, schematic capture and PCB layout for basic projects",
            wantSkill: "Graphic design",
            wantDetail: "Need simple posters and social media designs for our club",
            category: "tech",
            duration: "Flexible",
            chargeIfAny: 0,
            status: "open",
        },
        {
            poster: carol._id,
            offerSkill: "Bharatanatyam dance basics",
            offerDetail: "Basic Bharatanatyam footwork (adavus) and hand gestures (mudras). 3-4 sessions",
            wantSkill: "English creative writing",
            wantDetail: "Help reviewing my assignments and improving my essay writing",
            category: "art",
            duration: "4 sessions of 45 mins",
            chargeIfAny: 0,
            status: "open",
        },
    ]);
    console.log(`  ✓ Skill Exchange: ${skills.length} posts`);

    // ── 5. Q&A ─────────────────────────────────────────────────────────────────
    const qaPosts = await QAPost.insertMany([
        {
            author: carol._id,
            subjectCode: "CS8391",
            subjectName: "Data Structures & Algorithms",
            department: "CSE",
            semester: 3,
            title: "What is the difference between BFS and DFS time complexity?",
            body: "I'm confused about when BFS has the same time complexity as DFS (both O(V+E)) but different space complexity. Can someone explain with a concrete example?",
            tags: ["BFS", "DFS", "complexity", "graphs"],
            status: "open",
            answers: [
                {
                    author: bob._id,
                    body: "Both BFS and DFS have O(V+E) time complexity for adjacency list representation. The difference is in space:\n\n• BFS uses a queue — worst case O(V) space (sparse graph with one wide level)\n• DFS uses a stack (call stack) — worst case O(V) for a path graph\n\nFor example, in a balanced binary tree of n nodes:\n• BFS: queue holds n/2 nodes at the last level → O(n) space\n• DFS: stack depth = height = O(log n) for balanced trees\n\nSo DFS is generally more space-efficient for balanced trees, but can be O(n) for skewed ones.",
                    upvotes: [alice._id],
                    isVerifiedSenior: false,
                }
            ],
            viewCount: 23,
        },
        {
            author: alice._id,
            subjectCode: "MA8351",
            subjectName: "Transforms and Partial Differential Equations",
            department: "CSE",
            semester: 3,
            title: "How to find Laplace transform of piecewise functions?",
            body: "Q: L{f(t)} where f(t) = t for 0 < t < 1, and f(t) = 1 for t ≥ 1. I know I need to use unit step functions but I'm not sure how to set up the integral.",
            tags: ["laplace", "unit-step", "piecewise"],
            status: "open",
            answers: [],
            viewCount: 11,
        },
        {
            author: bob._id,
            subjectCode: "CS8492",
            subjectName: "Database Management Systems",
            department: "CSE",
            semester: 4,
            title: "Explain 3NF vs BCNF with a simple example",
            body: "I understand what functional dependencies are, but I can't figure out when a relation is in 3NF but not BCNF. Can someone give a simple relation that shows this difference?",
            tags: ["normalization", "3NF", "BCNF", "FDs"],
            status: "open",
            answers: [
                {
                    author: alice._id,
                    body: "Classic example: R(A, B, C) with FDs: {AB → C, C → A}\n\nCandidate keys: {AB, BC}\n\n3NF check: For C → A, 'A' is a prime attribute (part of a CK), so no 3NF violation.\nBCNF check: For C → A, C is NOT a superkey → BCNF is violated!\n\nSo R is in 3NF but NOT in BCNF. The key insight: 3NF allows non-superkey → prime attribute FDs, BCNF does not.",
                    upvotes: [carol._id, bob._id],
                    isVerifiedSenior: false,
                }
            ],
            viewCount: 45,
        },
    ]);
    console.log(`  ✓ Q&A: ${qaPosts.length} questions`);

    // ── 6. Complaints ──────────────────────────────────────────────────────────
    const complaints = await Complaint.insertMany([
        {
            reporter: alice._id,
            category: "canteen",
            title: "Canteen food quality has degraded significantly",
            description: "The quality of food at the main canteen has dropped significantly over the past month. The rice is often half-cooked and the sambar has very little vegetables. Many students are affected but afraid to speak up individually.",
            status: "submitted",
            meTooVoters: [bob._id, carol._id],
        },
        {
            reporter: bob._id,
            category: "lab",
            title: "Lab 3C computers running very slow",
            description: "Computers in Lab 3C (CSE Block) are extremely slow. Most take 10+ minutes to boot. During practical exams this causes serious issues. The RAM seems insufficient for the current software.",
            status: "under_review",
            adminResponse: "We have raised a hardware upgrade request. A technician will assess Lab 3C systems next week.",
            meTooVoters: [alice._id],
        },
        {
            reporter: carol._id,
            category: "hostel",
            title: "Hot water supply not working in Hostel Block C for 2 weeks",
            description: "The hot water supply in Hostel Block C has not been working for over 2 weeks now. Multiple complaints have been made verbally but no action has been taken. During cold nights this is a significant problem.",
            status: "submitted",
            meTooVoters: [alice._id, bob._id],
        },
    ]);
    console.log(`  ✓ Complaints: ${complaints.length} posts`);

    // ── 7. Campus Notices ──────────────────────────────────────────────────────
    const expires7  = new Date(Date.now() + 7  * 24 * 60 * 60 * 1000);
    const expires14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const expires3  = new Date(Date.now() + 3  * 24 * 60 * 60 * 1000);

    const notices = await Notice.insertMany([
        {
            postedBy: alice._id,
            posterRole: "student",
            title: "UniLoop Community Features Are Now Live! 🎉",
            body: "The full Community Support module is now available! You can now use Lost & Found, Blood Donation, Peer Tutoring, Skill Exchange, Q&A, Anonymous Complaint Box, Mental Health check-ins, and Campus Notices — all in one place. Head to /community to explore!",
            targetDept: "all",
            targetBlock: "all",
            expiresAt: expires14,
            pinned: true,
        },
        {
            postedBy: bob._id,
            posterRole: "club",
            title: "IEEE Student Branch — Technical Fest Registration Open",
            body: "Registration for 'TechSurge 2025' is now open! Events include:\n• Paper Presentation\n• Hackathon (24hr)\n• Robotics Challenge\n• Web Dev Competition\n\nRegistration deadline: April 15, 2025. Visit Room 203, ECE Block or register online.",
            targetDept: "all",
            targetBlock: "all",
            expiresAt: expires7,
            pinned: false,
        },
        {
            postedBy: carol._id,
            posterRole: "student",
            title: "Study Group for DBMS Internal Exam",
            body: "Forming a study group for the upcoming DBMS internal exam. Topics to cover: Normalization, SQL, Transactions, Indexing. Meeting at Library Room 3 on Saturdays 10am - 1pm. DM to join!",
            targetDept: "CSE",
            targetBlock: "all",
            expiresAt: expires3,
            pinned: false,
        },
        {
            postedBy: alice._id,
            posterRole: "student",
            title: "Blood Donation Camp — This Friday",
            body: "A blood donation camp is being organized this Friday (10am - 4pm) at the college auditorium. Eligibility: 18+ years, weight >45kg, no recent fever. Save lives — donate blood! Contact Alice (alice@student.edu) to register.",
            targetDept: "all",
            targetBlock: "all",
            expiresAt: expires7,
            pinned: false,
        },
    ]);
    console.log(`  ✓ Notices: ${notices.length} posts`);

    // ── Summary ────────────────────────────────────────────────────────────────
    console.log("\n🎉 Seeding complete!\n");
    console.log("Test accounts (use these to log in):");
    console.log("  2024100001@student.annauniv.edu — B+ donor, Good Samaritan badge");
    console.log("  2024100002@student.annauniv.edu — O+ donor, Verified Tutor badge");
    console.log("  2024100003@student.annauniv.edu — A+ donor, Skill Sharer badge");
    console.log("\nNote: These bypass password validation — login via existing verified accounts");
    console.log("to test community features, or use the above emails after a login redirect.\n");
    console.log("\nData summary:");
    console.log(`  Lost & Found:  ${lfItems.length} items`);
    console.log(`  Emergencies:   ${emergencies.length} posts`);
    console.log(`  Tutoring:      ${tutoring.length} sessions`);
    console.log(`  Skills:        ${skills.length} exchanges`);
    console.log(`  Q&A:           ${qaPosts.length} questions`);
    console.log(`  Complaints:    ${complaints.length} reports`);
    console.log(`  Notices:       ${notices.length} notices`);

    await mongoose.disconnect();
    console.log("\n✅ Disconnected. Seeds done!");
}

seed().catch(err => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
