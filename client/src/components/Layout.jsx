import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiGrid, FiFolder, FiCheckSquare, FiDollarSign, FiAlertCircle, FiShield, FiBarChart2, FiLogOut, FiUsers, FiHardDrive, FiMenu, FiX } from 'react-icons/fi';
import Chatbot from './Chatbot';

const NAV_ITEMS = {
    citizen: [
        { to: '/', icon: <FiGrid />, label: 'Dashboard' },
        { to: '/projects', icon: <FiFolder />, label: 'Projects' },
        { to: '/grievances', icon: <FiAlertCircle />, label: 'Grievances' },
        { to: '/audit', icon: <FiShield />, label: 'Public Audit' },
        { to: '/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
    ],
    engineer: [
        { to: '/', icon: <FiGrid />, label: 'Dashboard' },
        { to: '/projects', icon: <FiFolder />, label: 'Projects' },
        { to: '/milestones', icon: <FiCheckSquare />, label: 'Milestones' },
        { to: '/funds', icon: <FiDollarSign />, label: 'Fund Transactions' },
        { to: '/grievances', icon: <FiAlertCircle />, label: 'Grievances' },
        { to: '/audit', icon: <FiShield />, label: 'Audit Chain' },
        { to: '/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
    ],
    contractor: [
        { to: '/', icon: <FiGrid />, label: 'Dashboard' },
        { to: '/projects', icon: <FiFolder />, label: 'My Projects' },
        { to: '/milestones', icon: <FiCheckSquare />, label: 'Milestones' },
        { to: '/funds', icon: <FiDollarSign />, label: 'Payments' },
    ],
    financial_officer: [
        { to: '/', icon: <FiGrid />, label: 'Dashboard' },
        { to: '/projects', icon: <FiFolder />, label: 'Projects' },
        { to: '/milestones', icon: <FiCheckSquare />, label: 'Milestones' },
        { to: '/funds', icon: <FiDollarSign />, label: 'Fund Verification' },
        { to: '/audit', icon: <FiShield />, label: 'Audit Chain' },
        { to: '/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
    ],
    admin: [
        { to: '/', icon: <FiGrid />, label: 'Dashboard' },
        { to: '/projects', icon: <FiFolder />, label: 'Projects' },
        { to: '/users', icon: <FiUsers />, label: 'User Management' },
        { to: '/documents', icon: <FiHardDrive />, label: 'Local Storage' },
        { to: '/milestones', icon: <FiCheckSquare />, label: 'Milestones' },
        { to: '/funds', icon: <FiDollarSign />, label: 'Fund Transactions' },
        { to: '/grievances', icon: <FiAlertCircle />, label: 'Grievances' },
        { to: '/audit', icon: <FiShield />, label: 'Audit Chain' },
        { to: '/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
    ],
};

const ROLE_LABELS = {
    citizen: 'Citizen (Public User)',
    engineer: 'Ward Engineer',
    contractor: 'Contractor',
    financial_officer: 'Financial Authority',
    admin: 'Admin (System Control)',
};

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    // Close sidebar whenever route changes (mobile nav)
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = NAV_ITEMS[user?.role] || NAV_ITEMS.citizen;
    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
    const roleLabel = ROLE_LABELS[user?.role] || (user?.role || '').replace('_', ' ');

    return (
        <div className={`app-layout${menuOpen ? ' menu-open' : ''}`}>
            {/* ── Mobile Top-Bar ── */}
            <header className="mobile-topbar">
                <button
                    className="mobile-hamburger"
                    onClick={() => setMenuOpen(o => !o)}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                >
                    {menuOpen ? <FiX /> : <FiMenu />}
                </button>
                <NavLink to="/" className="mobile-topbar-logo">
                    <span className="mobile-topbar-logo-icon">🏛️</span>
                    <span className="mobile-topbar-logo-text">UrbanHeliX</span>
                </NavLink>
                <div className="mobile-topbar-avatar">{initials}</div>
            </header>

            {/* ── Overlay (mobile only) ── */}
            {menuOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* ── Sidebar ── */}
            <aside className={`sidebar${menuOpen ? ' sidebar--open' : ''}`}>
                <div className="sidebar-header">
                    <NavLink to="/" className="sidebar-logo">
                        <div className="sidebar-logo-icon">🏛️</div>
                        <div>
                            <div className="sidebar-logo-text">UrbanHeliX</div>
                            <div className="sidebar-logo-sub">Municipal Governance</div>
                        </div>
                    </NavLink>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-title">Navigation</div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.name}</div>
                        <div className="sidebar-user-role">{roleLabel}</div>
                    </div>
                    <button className="btn-logout" onClick={handleLogout} title="Logout">
                        <FiLogOut />
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>

            {/* Floating Chatbot — visible on all pages */}
            <Chatbot />
        </div>
    );
}
