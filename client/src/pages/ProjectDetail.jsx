import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectAPI, milestoneAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ── helpers ─────────────────────────────────────────────────── */
const STATUS_ICON = {
    proposed:     '📋',
    approved:     '✅',
    in_progress:  '🔨',
    verification: '🔍',
    completed:    '🏆',
    rejected:     '❌',
};

const STATUS_COLOR = {
    proposed:     'var(--accent-orange)',
    approved:     'var(--accent-blue)',
    in_progress:  'var(--accent-purple)',
    verification: 'var(--accent-cyan)',
    completed:    'var(--accent-green)',
    rejected:     'var(--accent-red)',
};

function formatCurrency(amt) {
    if (!amt) return '₹0';
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000)   return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString()}`;
}

function formatDateTime(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

/* ── Activity Timeline ───────────────────────────────────────── */
function ActivityTimeline({ history }) {
    if (!history || history.length === 0)
        return <div className="empty-state">No activity recorded yet.</div>;

    return (
        <div className="activity-timeline">
            {history.map((h, i) => {
                const cls = h.status || 'default';
                const actor = h.changedBy;
                const initials = actor?.name
                    ? actor.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                    : '?';
                const isLast = i === history.length - 1;

                return (
                    <div className="timeline-item" key={i} style={{ animationDelay: `${i * 0.06}s` }}>
                        <div className="timeline-left">
                            <div className={`timeline-dot ${cls}`}>
                                {STATUS_ICON[cls] || '📌'}
                            </div>
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

                            {h.remarks && (
                                <div className="timeline-remarks">{h.remarks}</div>
                            )}

                            {h.transactionHash && (
                                <span className="hash-badge" title={h.transactionHash}>
                                    <span className="lock-icon">🔒</span>
                                    {h.transactionHash.slice(0, 18)}…
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ── Budget Panel ────────────────────────────────────────────── */
function BudgetPanel({ project }) {
    const budgetRevised = project.allocatedBudget > 0 && project.allocatedBudget !== project.estimatedBudget;
    const progress = project.allocatedBudget > 0
        ? Math.round((project.spentBudget / project.allocatedBudget) * 100)
        : 0;

    return (
        <div>
            <div className="budget-row">
                <span className="budget-label">Estimated (Original)</span>
                <span className="budget-value muted">{formatCurrency(project.estimatedBudget)}</span>
            </div>
            <div className="budget-row">
                <span className="budget-label">
                    Allocated
                    {budgetRevised && <span className="budget-revised-tag">↑ Revised</span>}
                </span>
                <span className="budget-value blue">{formatCurrency(project.allocatedBudget)}</span>
            </div>
            <div className="budget-row">
                <span className="budget-label">Spent ({progress}%)</span>
                <span className="budget-value green">{formatCurrency(project.spentBudget)}</span>
            </div>
            <div style={{ marginTop: '14px' }}>
                <div className="progress-bar">
                    <div
                        className={`progress-bar-fill ${progress > 90 ? 'red' : progress > 60 ? 'blue' : 'green'}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                    {progress}% utilised
                </div>
            </div>
        </div>
    );
}

/* ── Location Card ───────────────────────────────────────────── */
function LocationCard({ location }) {
    const lat = location?.coordinates?.lat;
    const lng = location?.coordinates?.lng;
    const mapSrc = lat && lng
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`
        : null;

    return (
        <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '20px' }}>📍</span>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{location?.address || '—'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ward {location?.ward || '—'}</div>
                </div>
            </div>
            {mapSrc ? (
                <div className="map-embed">
                    <iframe
                        src={mapSrc}
                        title="Project Location"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                    />
                </div>
            ) : (
                <div className="map-no-coords">
                    <span style={{ fontSize: '28px' }}>🗺️</span>
                    <span>No GPS coordinates recorded</span>
                </div>
            )}
            {lat && lng && (
                <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600, marginTop: '6px' }}>
                    GPS: {lat.toFixed(6)}, {lng.toFixed(6)}
                </div>
            )}
        </div>
    );
}

/* ── Photos & Proof ──────────────────────────────────────────── */
function PhotosProof({ project }) {
    const hasImage  = Boolean(project.imageUrl);
    const hasReport = Boolean(project.reportUrl);

    return (
        <div>
            <div className="proof-gallery" style={{ marginBottom: hasReport ? '16px' : 0 }}>
                {hasImage ? (
                    <div className="proof-card">
                        <img
                            src={`http://localhost:5000${project.imageUrl}`}
                            alt="Project visual"
                            className="proof-card-img"
                        />
                        <div className="proof-card-footer">
                            <span>🏗️</span> Project Photo
                        </div>
                    </div>
                ) : (
                    <div className="proof-card">
                        <div className="proof-card-placeholder">
                            <span style={{ fontSize: '32px' }}>📷</span>
                            <span>No photo uploaded yet</span>
                        </div>
                        <div className="proof-card-footer">
                            <span>🏗️</span> Project Photo
                        </div>
                    </div>
                )}
            </div>

            {hasReport && (
                <a
                    href={`http://localhost:5000${project.reportUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="proof-report-card"
                >
                    <div className="proof-report-icon">📄</div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>
                            Official Project Report
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Click to download PDF
                        </div>
                    </div>
                </a>
            )}
        </div>
    );
}

/* ── Main Component ──────────────────────────────────────────── */
export default function ProjectDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const [contractors, setContractors] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [reportFile, setReportFile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, [id]);

    const loadData = async () => {
        try {
            const [projRes, msRes] = await Promise.all([
                projectAPI.getById(id),
                milestoneAPI.getAll({ project: id }),
            ]);
            setProject(projRes.data.project);
            setMilestones(msRes.data.milestones || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleApprove = async () => {
        const budget = prompt('Enter allocated budget amount:');
        if (!budget) return;
        try {
            await projectAPI.approve(id, { allocatedBudget: Number(budget), remarks: 'Approved by engineer' });
            loadData();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const openAssign = async () => {
        try {
            const res = await authAPI.getUsers('contractor');
            setContractors(res.data.users || []);
            setShowAssignModal(true);
        } catch (e) { }
    };

    const handleAssign = async (contractorId) => {
        try {
            await projectAPI.assign(id, {
                contractorId,
                startDate: new Date(),
                expectedEndDate: new Date(Date.now() + 180 * 86400000),
            });
            setShowAssignModal(false);
            loadData();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const handleUpdateStatus = async () => {
        const status = prompt('Enter new status (in_progress, verification, completed):');
        if (!status) return;
        const remarks = prompt('Remarks:');
        const formData = new FormData();
        formData.append('status', status);
        formData.append('remarks', remarks || '');
        if (reportFile) formData.append('report', reportFile);
        try {
            await projectAPI.updateStatus(id, formData);
            setReportFile(null);
            loadData();
        } catch (err) { alert(err.response?.data?.message || 'Error updating status'); }
    };

    if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;
    if (!project) return <div className="empty-state">Project not found</div>;

    const isAdmin      = user?.role === 'admin';
    const isEngineer   = user?.role === 'engineer';
    const isContractor = user?.role === 'contractor' && project.contractor?._id === user?._id;
    const canAct       = isAdmin || isEngineer || isContractor;

    return (
        <div>
            {/* ── Hero ─────────────────────────────────────────── */}
            <div className="public-project-hero" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div className="public-project-id">
                            🏛️ ID: {String(project._id).slice(-8).toUpperCase()}
                        </div>
                        <h1 className="public-project-title">{project.title}</h1>
                        <div className="public-meta-chips">
                            <span className="meta-chip">🏗️ {project.category?.replace(/_/g, ' ')}</span>
                            <span className="meta-chip">🏢 {project.department?.name}</span>
                            <span className="meta-chip">📍 Ward {project.location?.ward}</span>
                            <span className="meta-chip">⚠️ {project.priority}</span>
                        </div>
                        <div className={`public-status-banner ${project.status}`}>
                            <span className="live-dot" />
                            {STATUS_ICON[project.status]} &nbsp;
                            {project.status?.replace(/_/g, ' ')}
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <Link
                            to={`/public/project/${id}`}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '12px' }}
                        >
                            🌐 Public View
                        </Link>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Updated {formatDateTime(project.updatedAt)}
                        </div>
                    </div>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '16px' }}>
                    {project.description}
                </p>
            </div>

            {/* ── Quick Actions (staff only) ────────────────────── */}
            {canAct && (
                <div className="glass-card" style={{ marginBottom: '20px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>ACTIONS:</span>
                    {(isAdmin || isEngineer) && project.status === 'proposed' && (
                        <button className="btn btn-success btn-sm" onClick={handleApprove}>✅ Approve Project</button>
                    )}
                    {(isAdmin || isEngineer) && project.status === 'approved' && !project.contractor && (
                        <button className="btn btn-primary btn-sm" onClick={openAssign}>👷 Assign Contractor</button>
                    )}
                    {(isAdmin || isEngineer || isContractor) && ['approved', 'in_progress', 'verification'].includes(project.status) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="file" onChange={e => setReportFile(e.target.files[0])} style={{ fontSize: '12px' }} />
                            <button className="btn btn-outline btn-sm" onClick={handleUpdateStatus}>📤 Update Status</button>
                        </div>
                    )}
                </div>
            )}

            {/* ── 3-column info grid ───────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
                {/* Budget */}
                <div className="glass-card">
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>💰 Budget</h3>
                    <BudgetPanel project={project} />
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-glass)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Timeline</div>
                        <div style={{ fontSize: '13px', display: 'grid', gap: '4px' }}>
                            <div>🗓️ Start: {project.startDate ? new Date(project.startDate).toLocaleDateString('en-IN') : '—'}</div>
                            <div>🎯 Expected: {project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString('en-IN') : '—'}</div>
                            {project.actualEndDate && (
                                <div style={{ color: 'var(--accent-green)' }}>✅ Completed: {new Date(project.actualEndDate).toLocaleDateString('en-IN')}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="glass-card">
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>🗺️ Location</h3>
                    <LocationCard location={project.location} />
                </div>

                {/* People */}
                <div className="glass-card">
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>👥 Team</h3>
                    {[
                        { label: 'Department',  value: project.department?.name,       icon: '🏢' },
                        { label: 'Proposed By', value: project.proposedBy?.name,       icon: '🙋' },
                        { label: 'Engineer',    value: project.engineer?.name || '—',  icon: '👷‍♂️' },
                        { label: 'Contractor',  value: project.contractor?.name || 'Not assigned', icon: '🔧' },
                    ].map(({ label, value, icon }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-glass)' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                            <span style={{ fontSize: '13px', fontWeight: 500 }}>{icon} {value || '—'}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Activity Timeline ─────────────────────────────── */}
            <div className="section" style={{ marginBottom: '24px' }}>
                <div className="section-header">
                    <h2 className="section-title">🕐 Activity Timeline</h2>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {(project.statusHistory || []).length} events recorded
                    </span>
                </div>
                <div className="glass-card" style={{ padding: '24px' }}>
                    <ActivityTimeline history={project.statusHistory} />
                </div>
            </div>

            {/* ── Photos & Proof ────────────────────────────────── */}
            <div className="section" style={{ marginBottom: '24px' }}>
                <div className="section-header">
                    <h2 className="section-title">📸 Photos & Proof</h2>
                </div>
                <div className="glass-card">
                    <PhotosProof project={project} />
                </div>
            </div>

            {/* ── Milestones ────────────────────────────────────── */}
            <div className="section" style={{ marginBottom: '24px' }}>
                <div className="section-header">
                    <h2 className="section-title">🎯 Milestones</h2>
                </div>
                {milestones.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th><th>Milestone</th><th>Amount</th>
                                    <th>Status</th><th>Engineer</th><th>Financial</th><th>GPS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {milestones.map(m => (
                                    <tr key={m._id}>
                                        <td style={{ fontWeight: 600 }}>{m.milestoneNumber}</td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{m.title}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.description}</div>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(m.amount)}</td>
                                        <td><span className={`badge badge-${m.status}`}>{m.status?.replace('_', ' ')}</span></td>
                                        <td>{m.engineerApproval?.approved ? <span style={{ color: 'var(--accent-green)' }}>✓</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                        <td>{m.financialApproval?.approved ? <span style={{ color: 'var(--accent-green)' }}>✓</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                        <td>
                                            {m.coordinates?.lat
                                                ? <span style={{ fontSize: '11px', color: 'var(--accent-green)' }}>📍 {m.coordinates.lat.toFixed(4)}, {m.coordinates.lng.toFixed(4)}</span>
                                                : <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <div className="empty-state">No milestones added yet</div>}
            </div>

            {/* ── Blockchain Transparency ───────────────────────── */}
            <div className="section">
                <div className="transparency-panel">
                    <span className="transparency-icon">🔗</span>
                    <div>
                        <div className="transparency-title">Blockchain Transparency</div>
                        <div className="transparency-desc">
                            Every status update in the timeline above is cryptographically hashed and chained — updates cannot be secretly altered.
                            Full history is permanently visible to all citizens.
                            {project.transactionHash && (
                                <div style={{ marginTop: '8px' }}>
                                    <span className="hash-badge">🔒 {project.transactionHash.slice(0, 24)}…</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Assign Contractor Modal ───────────────────────── */}
            {showAssignModal && (
                <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">Assign Contractor</h3>
                        {contractors.map(c => (
                            <div key={c._id} className="glass-card" style={{ marginBottom: '8px', cursor: 'pointer', padding: '14px' }} onClick={() => handleAssign(c._id)}>
                                <div style={{ fontWeight: 600 }}>{c.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.email}</div>
                            </div>
                        ))}
                        <button className="btn btn-outline btn-sm" style={{ marginTop: '10px', width: '100%' }} onClick={() => setShowAssignModal(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}
