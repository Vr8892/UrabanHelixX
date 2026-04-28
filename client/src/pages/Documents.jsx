import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FiHardDrive, FiFile, FiTrash2, FiDownload, FiInfo } from 'react-icons/fi';

export default function Documents() {
    const { user } = useAuth();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user?.role === 'admin') fetchFiles();
        else setLoading(false);
    }, [user]);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const res = await api.get('/storage/files');
            setFiles(res.data.files || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch storage data');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (folder, name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            await api.delete(`/storage/files/${folder}/${name}`);
            fetchFiles();
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    const formatSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const FOLDER_COLORS = {
        projects: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
        grievances: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
        others: { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
    };

    if (user?.role !== 'admin') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px', color: 'var(--text-muted)' }}>
                <FiHardDrive size={48} />
                <h2 style={{ margin: 0 }}>Access Denied</h2>
                <p>Only Admins can access Local Storage.</p>
            </div>
        );
    }

    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const byFolder = { projects: 0, grievances: 0, others: 0 };
    files.forEach(f => { if (byFolder[f.folder] !== undefined) byFolder[f.folder]++; });

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Local Storage</h1>
                <p className="page-subtitle">Free on-disk file storage — No cloud costs · {files.length} files · {formatSize(totalSize)} used</p>
            </div>

            {/* Storage Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {Object.entries(byFolder).map(([folder, count]) => {
                    const c = FOLDER_COLORS[folder] || FOLDER_COLORS.others;
                    return (
                        <div key={folder} className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: c.color }}>{count}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'capitalize' }}>{folder} Files</div>
                        </div>
                    );
                })}
            </div>

            <div className="glass-card" style={{ marginBottom: '20px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <FiInfo /> Using <strong style={{ color: 'var(--accent-blue)', margin: '0 4px' }}>Local Disk Storage</strong> — Files stored in <code style={{ background: 'rgba(255,255,255,0.07)', padding: '2px 6px', borderRadius: '4px' }}>server/uploads/</code>. No AWS or cloud costs.
            </div>

            {loading ? (
                <div className="loading"><div className="spinner"></div> Scanning storage...</div>
            ) : error ? (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', borderRadius: '10px', padding: '16px', color: 'var(--accent-red)' }}>{error}</div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>File Name</th>
                                <th>Category</th>
                                <th>Size</th>
                                <th>Uploaded On</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="empty-state">
                                        No files stored yet. Upload project reports or grievance images to see them here.
                                    </td>
                                </tr>
                            ) : (
                                files.map((file, idx) => {
                                    const c = FOLDER_COLORS[file.folder] || FOLDER_COLORS.others;
                                    return (
                                        <tr key={idx}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <FiFile size={16} color="var(--text-muted)" />
                                                    <span style={{ fontWeight: 500, wordBreak: 'break-all', fontSize: '13px' }}>{file.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ background: c.bg, color: c.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
                                                    {file.folder}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatSize(file.size)}</td>
                                            <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(file.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <a
                                                        href={`http://localhost:5000${file.path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="btn btn-outline btn-sm"
                                                        title="Download"
                                                    >
                                                        <FiDownload size={13} />
                                                    </a>
                                                    <button
                                                        onClick={() => handleDelete(file.folder, file.name)}
                                                        className="btn btn-sm"
                                                        style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
