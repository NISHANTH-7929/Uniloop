import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const AppNavbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate("/auth", { replace: true });
    };

    const isActive = (path) => location.pathname === path ? "active" : "";

    return (
        <header className={`navbar-wrapper ${scrolled ? 'scrolled' : ''}`}>
            <nav className="navbar-glass">
                <div className="navbar-container">

                    {/* Logo */}
                    <Link className="navbar-brand" to="/">
                        <div className="brand-icon">
                            <div className="brand-dot"></div>
                            <div className="brand-ring"></div>
                        </div>
                        <span className="brand-text text-gradient">UniLoop</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="navbar-links desktop-only">
                        {!user ? (
                            <Link className={`nav-link ${isActive('/auth')}`} to="/auth">
                                <span className="nav-text">Login / Register</span>
                                <div className="nav-indicator"></div>
                            </Link>
                        ) : (
                            <>
                                <Link className={`nav-link ${isActive('/dashboard')}`} to="/dashboard">
                                    <span className="nav-text">Dashboard</span>
                                    <div className="nav-indicator"></div>
                                </Link>
                                <Link className={`nav-link ${isActive('/events')}`} to="/events">
                                    <span className="nav-text">Events</span>
                                    <div className="nav-indicator"></div>
                                </Link>
                                <Link className={`nav-link ${isActive('/marketplace')}`} to="/marketplace">
                                    <span className="nav-text">Marketplace</span>
                                    <div className="nav-indicator"></div>
                                </Link>

                                <div className="nav-divider"></div>

                                <button className="btn-neon nav-logout-btn" onClick={handleLogout}>
                                    Logout
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''} mobile-only`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                </div>
            </nav>

            {/* Mobile Dropdown */}
            <div className={`mobile-dropdown ${mobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-links">
                    {!user ? (
                        <Link className="mobile-link" to="/auth">Login / Register</Link>
                    ) : (
                        <>
                            <Link className="mobile-link" to="/dashboard">Dashboard</Link>
                            <Link className="mobile-link" to="/events">Events</Link>
                            <Link className="mobile-link" to="/marketplace">Marketplace</Link>
                            <button className="btn-neon mt-4 w-100" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AppNavbar;
