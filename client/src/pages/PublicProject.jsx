import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicAPI } from '../services/api';

const STATUS_ICON = {
    proposed: '📋', approved: '✅', in_progress: '🔨',
    verification: '🔍', completed: '🏆', rejected: '❌',
};
const STATUS_COLOR = {
    proposed: 'var(--accent-orange)', approved: 'var(--accent-blue)',
    in_progress: 'var(--accent-purple)', verification: 'var(--accent-cyan)',
    completed: 'var(--accent-green)', rejected: 'var(--accent-red)',
};

function formatCurrency(amt) {
    if (!amt) return '₹0';
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000)   return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString()}`;
}

function formatDateTime(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

export default function PublicProject() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        publicAPI.getProject(id)
            .then(res => setProject(res.data.project))
            .catch(() => setError('Project not found or unavailable.'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loading"><div className="spinner" /> Loading project…</div>
        </div>
    );
    if (error) return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty-state">{error}</div>
        </div>
    );

    const progress = project.allocatedBudget > 0
        ? Math.round((project.spentBudget / project.allocatedBudget) * 100) : 0;
    const budgetRevised = project.allocatedBudget > 0 && project.allocatedBudget !== project.estimatedBudget;
    const lat = project.location?.coordinates?.lat;
    const lng = project.location?.coordinates?.lng;
    const mapSrc = lat && lng
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`
        : null;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '32px 24px', maxWidth: '960px', margin: '0 auto' }}>

            {/* Login CTA banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px' }}>🏛️</span>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-secondary)' }}>UrbanHeliX — Public Project Dashboard</span>
                </div>
                <Link to="/login" className="public-login-cta">🔐 Login to take action</Link>
            </div>

            {/* Hero */}
            <div className="public-project-hero">
                <div className="public-project-id">🏛️ Project ID: {String(project._id).slice(-8).toUpperCase()}</div>
                <h1 className="public-project-title">{project.title}</h1>
                <div className="public-meta-chips">
                    <span className="meta-chip">🏗️ {project.category?.replace(/_/g, ' ')}</span>
                    <span className="meta-chip">🏢 {project.department?.name}</span>
                    <span className="meta-chip">📍 Ward {project.location?.ward}</span>
                    <span className="meta-chip">⚠️ {project.priority}</span>
                </div>
                <div className={`public-status-banner ${project.status}`}>
                    <span className="live-dot" />
                    {STATUS_ICON[project.status]} &nbsp; {project.status?.replace(/_/g, ' ')}
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '16px' }}>
                    {project.description}
                </p>
            </div>

            {/* Budget + Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* Budget */}
                <div className="glass-card">
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>💰 Budget</h3>
                    <div className="budget-row">
                        <span className="budget-label">Estimated (Original)</span>
                        <span className="budget-value muted">{formatCurrency(project.estimatedBudget)}</span>
                    </div>
                    <div className="budget-row">
                        <span className="budget-label">
                            Allocated {budgetRevised && <span className="budget-revised-tag">↑ Revised</span>}
                        </span>
                        <span className="budget-value blue">{formatCurrency(project.allocatedBudget)}</span>
                    </div>
                    <div className="budget-row">
                        <span className="budget-label">Spent ({progress}%)</span>
                        <span className="budget-value green">{formatCurrency(project.spentBudget)}</span>
                    </div>
                    <div style={{ marginTop: '14px' }}>
                        <div className="progress-bar">
                            <div className={`progress-bar-fill ${progress > 90 ? 'red' : progress > 60 ? 'blue' : 'green'}`}
                                style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>{progress}% utilised</div>
                    </div>
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-glass)', fontSize: '13px', display: 'grid', gap: '4px' }}>
                        <div>🗓️ Start: {project.startDate ? new Date(project.startDate).toLocaleDateString('en-IN') : '—'}</div>
                        <div>🎯 Expected End: {project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString('en-IN') : '—'}</div>
                        {project.actualEndDate && <div style={{ color: 'var(--accent-green)' }}>✅ Completed: {new Date(project.actualEndDate).toLocaleDateString('en-IN')}</div>}
                    </div>
                </div>

                {/* Location */}
                <div className="glass-card">
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>🗺️ Location</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '20px' }}>📍</span>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{project.location?.address || '—'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ward {project.location?.ward || '—'}</div>
                        </div>
                    </div>
                    {mapSrc ? (
                        <div className="map-embed"><iframe src={mapSrc} title="Project Location" loading="lazy" referrerPolicy="no-referrer" /></div>
                    ) : (
                        <div className="map-no-coords"><span style={{ fontSize: '28px' }}>🗺️</span><span>No GPS coordinates recorded</span></div>
                    )}
                    {lat && lng && <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600, marginTop: '6px' }}>GPS: {lat.toFixed(6)}, {lng.toFixed(6)}</div>}
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="section" style={{ marginBottom: '24px' }}>
                <div className="section-header">
                    <h2 className="section-title">🕐 Activity Timeline</h2>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(project.statusHistory || []).length} events</span>
                </div>
                <div className="glass-card" style={{ padding: '24px' }}>
                    {(project.statusHistory || []).length === 0
                        ? <div className="empty-state">No activity yet.</div>
                        : <div className="activity-timeline">
                            {project.statusHistory.map((h, i) => {
                                const cls = h.status || 'default';
                                const actor = h.changedBy;
                                const initials = actor?.name
                                    ? actor.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
                                const isLast = i === project.statusHistory.length - 1;
                                return (
                                    <div className="timeline-item" key={i} style={{ animationDelay: `${i * 0.06}s` }}>
                                        <div className="timeline-left">
                                            <div className={`timeline-dot ${cls}`}>{STATUS_ICON[cls] || '📌'}</div>
                                            {!isLast && <div className="timeline-line" />}
                                        </div>
                                        <div className="timeline-content" style={{ marginBottom: isLast ? 0 : '12px' }}>
                                            <div className="timeline-header">
                                                <span className="timeline-status-label" style={{ color: STATUS_COLOR[cls] }}>
                                                    {h.status?.replace(/_/g, ' ')}
                                                </span>
                                                <span className="timeline-time">{formatDateTime(h.timestamp)}</span>
                                            </div>
                                            {actor && (
                                                <div className="timeline-actor">
                                                    <div className="timeline-actor-avatar">{initials}</div>
                                                    <span className="timeline-actor-name">{actor.name}</span>
                                                    {actor.role && <span className="timeline-actor-role">{actor.role}</span>}
                                                </div>
                                            )}
                                            {h.remarks && <div className="timeline-remarks">{h.remarks}</div>}
                                            {h.transactionHash && (
                                                <span className="hash-badge" title={h.transactionHash}>
                                                    🔒 {h.transactionHash.slice(0, 18)}…
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    }
                </div>
            </div>

            {/* Photos & Proof */}
            <div className="section" style={{ marginBottom: '24px' }}>
                <div className="section-header"><h2 className="section-title">📸 Photos & Proof</h2></div>
                <div className="glass-card">
                    <div className="proof-gallery" style={{ marginBottom: project.reportUrl ? '16px' : 0 }}>
                        {project.imageUrl ? (
                            <div className="proof-card">
                                <img src={`http://localhost:5000${project.imageUrl}`} alt="Project" className="proof-card-img" />
                                <div className="proof-card-footer">🏗️ Project Photo</div>
                            </div>
                        ) : (
                            <div className="proof-card">
                                <div className="proof-card-placeholder"><span style={{ fontSize: '32px' }}>📷</span><span>No photo uploaded yet</span></div>
                                <div className="proof-card-footer">🏗️ Project Photo</div>
                            </div>
                        )}
                    </div>
                    {project.reportUrl && (
                        <a href={`http://localhost:5000${project.reportUrl}`} target="_blank" rel="noreferrer" className="proof-report-card">
                            <div className="proof-report-icon">📄</div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Official Project Report</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click to download PDF</div>
                            </div>
                        </a>
                    )}
                </div>
            </div>

            {/* Blockchain Transparency */}
            <div className="transparency-panel">
                <span className="transparency-icon">🔗</span>
                <div>
                    <div className="transparency-title">Blockchain Transparency Guaranteed</div>
                    <div className="transparency-desc">
                        Every update in this timeline is cryptographically hashed and chained — no record can be secretly altered.
                        Citizens can verify the complete history at any time.
                        {project.transactionHash && (
                            <div style={{ marginTop: '8px' }}>
                                <span className="hash-badge">🔒 {project.transactionHash.slice(0, 24)}…</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Last updated: {formatDateTime(project.updatedAt)} · UrbanHeliX Municipal Transparency Platform
            </div>
        </div>
    );
}
