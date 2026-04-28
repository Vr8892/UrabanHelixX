import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { FiUsers, FiMail, FiPhone, FiShield, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const ROLE_LABELS = {
    admin: 'Admin (System Control)',
    engineer: 'Ward Engineer',
    contractor: 'Contractor',
    financial_officer: 'Financial Authority',
    citizen: 'Citizen (Public User)',
};

const ROLE_COLORS = {
    admin: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    engineer: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
    contractor: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    financial_officer: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    citizen: { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
};

export default function Users() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            fetchUsers();
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await authAPI.getUsers(roleFilter || undefined);
            setUsers(res.data.users || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.role === 'admin') fetchUsers();
    }, [roleFilter]);

    if (currentUser?.role !== 'admin') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px', color: 'var(--text-muted)' }}>
                <FiXCircle size={48} color="var(--accent-red)" />
                <h2 style={{ margin: 0 }}>Access Denied</h2>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">User Management</h1>
                <p className="page-subtitle">Manage system access and user roles · {users.length} total users</p>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {Object.entries(ROLE_LABELS).map(([role, label]) => {
                    const count = users.filter(u => u.role === role).length;
                    const color = ROLE_COLORS[role];
                    return (
                        <div key={role} className="glass-card" style={{ padding: '14px', textAlign: 'center', cursor: 'pointer', border: roleFilter === role ? `1px solid ${color.color}` : '1px solid var(--glass-border)' }} onClick={() => setRoleFilter(roleFilter === role ? '' : role)}>
                            <div style={{ fontSize: '22px', fontWeight: 700, color: color.color }}>{count}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{label.split(' ')[0]}</div>
                        </div>
                    );
                })}
            </div>

            {/* Search and Filter */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <input
                    className="form-input"
                    placeholder="🔍 Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1 }}
                />
                <select className="form-select" style={{ width: 'auto' }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">All Roles</option>
                    {Object.entries(ROLE_LABELS).map(([role, label]) => (
                        <option key={role} value={role}>{label}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner"></div> Loading users...</div>
            ) : error ? (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', borderRadius: '10px', padding: '16px', color: 'var(--accent-red)' }}>{error}</div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Contact</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u) => {
                                const color = ROLE_COLORS[u.role] || ROLE_COLORS.citizen;
                                return (
                                    <tr key={u._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: color.bg, color: color.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {u._id.slice(-8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '13px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}><FiMail size={12} /> {u.email}</div>
                                                {u.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginTop: '3px' }}><FiPhone size={12} /> {u.phone}</div>}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ background: color.bg, color: color.color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                <FiShield size={10} /> {ROLE_LABELS[u.role] || u.role}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {u.department ? (
                                                <div>
                                                    <div>{u.department.name}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ward {u.department.ward}</div>
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            {u.isActive ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--accent-green)', fontSize: '13px' }}>
                                                    <FiCheckCircle size={14} /> Active
                                                </span>
                                            ) : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--accent-red)', fontSize: '13px' }}>
                                                    <FiXCircle size={14} /> Inactive
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr><td colSpan="5" className="empty-state">No users found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
