import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppNavbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage"; // New combined page
import VerifyEmail from "./pages/VerifyEmail";
import VerificationSent from "./pages/VerificationSent"; // New page
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
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <>
      <AppNavbar />
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
          <Route path="/view-tickets" element={<ViewTickets />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/scanner/:eventId" element={<Scanner />} />
          <Route path="/volunteer/:eventId/:volunteerId" element={<VolunteerDetails />} />
          <Route path="/organizer" element={<Organizer />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
