import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppNavbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";
import VerifyEmail from "./pages/VerifyEmail";
import VerificationSent from "./pages/VerificationSent";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Marketplace from "./pages/Marketplace";
import Scanner from "./pages/Scanner";
import Organizer from "./pages/Organizer";
import VolunteerDetails from "./pages/VolunteerDetails";
import EventDetails from "./pages/EventDetails";
import SubeventDetails from "./pages/SubeventDetails";
import ViewTickets from "./pages/ViewTickets";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import DormDashRoutes from "./pages/dormdash/DormDashRoutes";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

// Community module
import { CommunityProvider } from "./context/CommunityContext";
import SOSBroadcastBanner from "./components/community/SOSBroadcastBanner";
import useSOSListener from "./hooks/useSOSListener";

// Community pages
import CommunityHome         from "./pages/community/CommunityHome";
import LostFoundFeed         from "./pages/community/LostFoundFeed";
import LostFoundDetail       from "./pages/community/LostFoundDetail";
import NewLostFoundForm      from "./pages/community/NewLostFoundForm";
import EmergencyFeed         from "./pages/community/EmergencyFeed";
import EmergencyDetail       from "./pages/community/EmergencyDetail";
import NewEmergencyForm      from "./pages/community/NewEmergencyForm";
import TutoringFeed          from "./pages/community/TutoringFeed";
import TutoringDetail        from "./pages/community/TutoringDetail";
import NewTutoringForm       from "./pages/community/NewTutoringForm";
import SkillExchangeFeed     from "./pages/community/SkillExchangeFeed";
import SkillDetail           from "./pages/community/SkillDetail";
import NewSkillForm          from "./pages/community/NewSkillForm";
import QAFeed                from "./pages/community/QAFeed";
import QuestionDetail        from "./pages/community/QuestionDetail";
import NewQuestionForm       from "./pages/community/NewQuestionForm";
import ComplaintFeed         from "./pages/community/ComplaintFeed";
import ComplaintDetail       from "./pages/community/ComplaintDetail";
import NewComplaintForm      from "./pages/community/NewComplaintForm";
import NoticesFeed           from "./pages/community/NoticesFeed";
import NoticeDetail          from "./pages/community/NoticeDetail";
import NewNoticeForm         from "./pages/community/NewNoticeForm";
import CommunityProfile      from "./pages/community/CommunityProfile";

// Inner App that uses CommunityContext (needed so useSOSListener can call useCommunity)
const AppInner = () => {
  useSOSListener();
  return (
    <>
      <AppNavbar />
      <SOSBroadcastBanner />
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/register" element={<Navigate to="/auth" replace />} />

        <Route path="/verify/:token" element={<VerifyEmail />} />
        <Route path="/verification-sent" element={<VerificationSent />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/events/:id/subevents/:subeventId" element={<SubeventDetails />} />
          <Route path="/my-tickets" element={<ViewTickets />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/scanner/:eventId" element={<Scanner />} />
          <Route path="/volunteer/:eventId/:volunteerId" element={<VolunteerDetails />} />
          <Route path="/organizer" element={<Organizer />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* ─── Community Support ────────────── */}
          <Route path="/community" element={<CommunityHome />} />
          <Route path="/community/lostfound" element={<LostFoundFeed />} />
          <Route path="/community/lostfound/new" element={<NewLostFoundForm />} />
          <Route path="/community/lostfound/:id" element={<LostFoundDetail />} />
          <Route path="/community/emergency" element={<EmergencyFeed />} />
          <Route path="/community/emergency/new" element={<NewEmergencyForm />} />
          <Route path="/community/emergency/:id" element={<EmergencyDetail />} />
          <Route path="/community/tutoring" element={<TutoringFeed />} />
          <Route path="/community/tutoring/new" element={<NewTutoringForm />} />
          <Route path="/community/tutoring/:id" element={<TutoringDetail />} />
          <Route path="/community/skills" element={<SkillExchangeFeed />} />
          <Route path="/community/skills/new" element={<NewSkillForm />} />
          <Route path="/community/skills/:id" element={<SkillDetail />} />
          <Route path="/community/qa" element={<QAFeed />} />
          <Route path="/community/qa/new" element={<NewQuestionForm />} />
          <Route path="/community/qa/:id" element={<QuestionDetail />} />
          <Route path="/community/complaints" element={<ComplaintFeed />} />
          <Route path="/community/complaints/new" element={<NewComplaintForm />} />
          <Route path="/community/complaints/:id" element={<ComplaintDetail />} />
          <Route path="/community/notices" element={<NoticesFeed />} />
          <Route path="/community/notices/new" element={<NewNoticeForm />} />
          <Route path="/community/notices/:id" element={<NoticeDetail />} />
          <Route path="/community/profile/:userId" element={<CommunityProfile />} />

          <Route path="/dormdash/*" element={<DormDashRoutes />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <CommunityProvider>
      <AppInner />
    </CommunityProvider>
  );
}

export default App;
