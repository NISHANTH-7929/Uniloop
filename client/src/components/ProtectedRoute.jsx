import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Loader from "./Loader";

const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loader />;
    }

    return user ? <Outlet /> : <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
