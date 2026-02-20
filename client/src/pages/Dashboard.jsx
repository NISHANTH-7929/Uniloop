import React from "react";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="container mt-5">
            <h1>Welcome, {user?.email}</h1>
            <p>This is your dashboard.</p>
        </div>
    );
};

export default Dashboard;
