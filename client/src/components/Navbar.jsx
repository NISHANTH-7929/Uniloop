import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNotifications } from "../api/events";
import { fetchConversations } from "../api/chatApi";
import { useSocket } from "../context/SocketContext";
import { 
    LayoutDashboard, 
    Bell, 
    CalendarDays, 
    ShoppingBag, 
    Users, 
    UtensilsCrossed, 
    ShieldAlert, 
    LogOut, 
    Menu, 
    X, 
    Zap 
} from "lucide-react";
import "./Navbar.css";

const AppNavbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    useEffect(() => {
        let mounted = true;
        
        const loadCounts = async () => {
            if (!user) {
                setUnreadCount(0);
                return;
            }
            try {
                const notifRes = await getNotifications();
                if (mounted) {
                    setUnreadCount(notifRes.data.filter(n => !n.isRead).length);
                }
            } catch (err) {
                console.error('Failed to fetch counts for navbar', err);
            }
        };

        loadCounts();
        return () => { mounted = false; };
    }, [user, location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate("/auth", { replace: true });
    };

    const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path)) ? "active" : "";

    return (
        <header className={`navbar-wrapper ${scrolled ? 'scrolled' : ''}`}>
            <nav className="navbar-container">
                {/* Logo */}
                <Link className="navbar-brand" to="/">
                    <Zap size={28} className="text-gradient" fill="currentColor" />
                    <span className="brand-text">UniLoop</span>
                </Link>

                {/* Desktop Menu */}
                <div className="navbar-links desktop-only">
                    {!user ? (
                        <Link className={`nav-link ${isActive('/auth')}`} to="/auth">
                            Login / Register
                        </Link>
                    ) : (
                        <>
                            <Link className={`nav-link ${isActive('/dashboard')}`} to="/dashboard">
                                <LayoutDashboard size={18} />
                                <span>Dashboard</span>
                            </Link>

                            <Link className={`nav-link ${isActive('/events')}`} to="/events">
                                <CalendarDays size={18} />
                                <span>Events</span>
                            </Link>

                            <Link className={`nav-link ${isActive('/marketplace')}`} to="/marketplace">
                                <ShoppingBag size={18} />
                                <span>Marketplace</span>
                            </Link>

                            <Link className={`nav-link ${isActive('/community')}`} to="/community">
                                <Users size={18} />
                                <span>Community</span>
                            </Link>

                            <Link className={`nav-link ${isActive('/dormdash')}`} to="/dormdash">
                                <UtensilsCrossed size={18} />
                                <span>DormDash</span>
                            </Link>

                            <div className="nav-divider"></div>

                            <button className="nav-logout-btn" onClick={handleLogout}>
                                <LogOut size={18} />
                            </button>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </nav>

            {/* Mobile Dropdown */}
            <div className={`mobile-dropdown ${mobileMenuOpen ? 'open' : ''}`}>
                {!user ? (
                    <Link className="mobile-link" to="/auth">Login / Register</Link>
                ) : (
                    <>
                        <Link className="mobile-link" to="/dashboard">Dashboard</Link>
                        <Link className="mobile-link" to="/events">Events</Link>
                        <Link className="mobile-link" to="/marketplace">Marketplace</Link>
                        <Link className="mobile-link" to="/community">Community</Link>
                        <Link className="mobile-link" to="/dormdash">DormDash</Link>
                        
                        <button className="btn-neon mt-4 w-100" onClick={handleLogout} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                            Logout
                        </button>
                    </>
                )}
            </div>
        </header>
    );
};

export default AppNavbar;
