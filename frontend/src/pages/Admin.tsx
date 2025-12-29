import React, { useState, useEffect, useCallback } from 'react';
import { Page } from '../layout/Page';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { adminAPI, usersAPI } from '../api/client';
import { useToast } from '../state/useToast';
import { formatRelativeTime } from '../utils/dateUtils';
import type { User, Match, SystemHealth, ELOAdjustment, AdminAuditLog } from '../types';
import './Admin.css';

type TabType = 'health' | 'users' | 'elo' | 'matches' | 'audit';

interface AdminProps {
  user: User | null;
}

export function Admin({ user }: AdminProps) {
  const [activeTab, setActiveTab] = useState<TabType>('health');
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [bannedUsers, setBannedUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [eloAdjustments, setELOAdjustments] = useState<ELOAdjustment[]>([]);
  const [confirmedMatches, setConfirmedMatches] = useState<Match[]>([]);
  const [auditLog, setAuditLog] = useState<AdminAuditLog[]>([]);
  const { show } = useToast();

  // Helper to show toast with correct signature
  const showToast = useCallback((message: string, tone: 'success' | 'error' | 'info') => {
    show({ title: message, tone });
  }, [show]);

  // Form states
  const [banForm, setBanForm] = useState({ userId: '', reason: '' });
  const [eloForm, setEloForm] = useState({ userId: '', sport: 'table_tennis', newElo: '', reason: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [healthData, bannedData, usersData] = await Promise.all([
        adminAPI.getSystemHealth(),
        adminAPI.getBannedUsers(),
        usersAPI.getAll(),
      ]);
      setHealth(healthData);
      setBannedUsers(bannedData || []);
      setAllUsers(usersData || []);
    } catch (err) {
      showToast('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadTabData = useCallback(async (tab: TabType) => {
    try {
      switch (tab) {
        case 'elo':
          const adjustments = await adminAPI.getELOAdjustments(50);
          setELOAdjustments(adjustments || []);
          break;
        case 'matches':
          const matches = await adminAPI.getConfirmedMatches(100);
          setConfirmedMatches(matches || []);
          break;
        case 'audit':
          const logs = await adminAPI.getAuditLog(100);
          setAuditLog(logs || []);
          break;
      }
    } catch (err) {
      showToast(`Failed to load ${tab} data`, 'error');
    }
  }, [showToast]);

  useEffect(() => {
    if (user?.is_admin) {
      loadData();
    }
  }, [user, loadData]);

  useEffect(() => {
    if (user?.is_admin && !loading) {
      loadTabData(activeTab);
    }
  }, [activeTab, user, loading, loadTabData]);

  const handleBanUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = parseInt(banForm.userId);
    if (!userId || !banForm.reason.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      await adminAPI.banUser({ user_id: userId, reason: banForm.reason });
      showToast('User banned successfully', 'success');
      setBanForm({ userId: '', reason: '' });
      loadData();
    } catch (err) {
      showToast('Failed to ban user', 'error');
    }
  };

  const handleUnbanUser = async (userId: number) => {
    if (!confirm('Are you sure you want to unban this user?')) return;

    try {
      await adminAPI.unbanUser(userId);
      showToast('User unbanned successfully', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to unban user', 'error');
    }
  };

  const handleAdjustELO = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = parseInt(eloForm.userId);
    const newElo = parseInt(eloForm.newElo);
    if (!userId || !newElo || !eloForm.reason.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      await adminAPI.adjustELO({
        user_id: userId,
        sport: eloForm.sport as 'table_tennis' | 'table_football',
        new_elo: newElo,
        reason: eloForm.reason,
      });
      showToast('ELO adjusted successfully', 'success');
      setEloForm({ userId: '', sport: 'table_tennis', newElo: '', reason: '' });
      loadTabData('elo');
    } catch (err) {
      showToast('Failed to adjust ELO', 'error');
    }
  };

  const handleRevertMatch = async (matchId: number) => {
    if (!confirm('Are you sure you want to revert this match? This will restore both players\' ELO ratings to their values before this match and delete the match. This cannot be undone.')) return;

    try {
      await adminAPI.revertMatch(matchId);
      showToast('Match reverted successfully', 'success');
      loadTabData('matches');
      loadData(); // Refresh health stats
    } catch (err) {
      showToast('Failed to revert match', 'error');
    }
  };

  const getUserLogin = (userId: number) => {
    const foundUser = allUsers.find((u: User) => u.id === userId);
    return foundUser?.login || `User #${userId}`;
  };

  // Check admin access
  if (!user?.is_admin) {
    return (
      <Page title="Admin Panel">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You do not have permission to access the admin panel.</p>
        </div>
      </Page>
    );
  }

  if (loading) {
    return (
      <Page title="Admin Panel">
        <div className="admin-loading">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Admin Panel">
      <div className="admin-page">
        <div className="admin-header">
          <h1>Admin Panel</h1>
          <div className="export-buttons">
            <a href={adminAPI.exportMatchesCSV()} download>
              <Button variant="outline" size="sm">Export Matches CSV</Button>
            </a>
            <a href={adminAPI.exportUsersCSV()} download>
              <Button variant="outline" size="sm">Export Users CSV</Button>
            </a>
          </div>
        </div>

        {/* System Health Dashboard */}
        {health && (
          <div className="health-grid">
            <div className="health-card">
              <div className="stat-value">{health.total_users}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="health-card">
              <div className="stat-value">{health.total_matches}</div>
              <div className="stat-label">Total Matches</div>
            </div>
            <div className="health-card">
              <div className="stat-value">{health.pending_matches}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="health-card">
              <div className="stat-value">{health.disputed_matches}</div>
              <div className="stat-label">Disputed</div>
            </div>
            <div className="health-card">
              <div className="stat-value">{health.banned_users}</div>
              <div className="stat-label">Banned</div>
            </div>
            <div className="health-card">
              <div className="stat-value">{health.matches_today}</div>
              <div className="stat-label">Today</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          {(['health', 'users', 'elo', 'matches', 'audit'] as TabType[]).map(tab => (
            <button
              key={tab}
              className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'health' && 'Overview'}
              {tab === 'users' && 'User Management'}
              {tab === 'elo' && 'ELO Adjustments'}
              {tab === 'matches' && 'Revert Matches'}
              {tab === 'audit' && 'Audit Log'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="admin-card">
          {activeTab === 'health' && (
            <div className="admin-section">
              <h2>System Overview</h2>
              <p>Welcome to the admin panel. Use the tabs above to manage users, adjust ELO ratings, handle disputed matches, and view the audit log.</p>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="admin-section">
              <h2>Ban User</h2>
              <form className="admin-form" onSubmit={handleBanUser}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="ban-user">User</label>
                    <select
                      id="ban-user"
                      value={banForm.userId}
                      onChange={e => setBanForm(f => ({ ...f, userId: e.target.value }))}
                    >
                      <option value="">Select a user...</option>
                      {allUsers.filter(u => !u.is_banned && !u.is_admin).map(u => (
                        <option key={u.id} value={u.id}>{u.login} ({u.display_name})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="ban-reason">Reason</label>
                  <textarea
                    id="ban-reason"
                    value={banForm.reason}
                    onChange={e => setBanForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="Reason for ban..."
                    rows={3}
                  />
                </div>
                <Button type="submit" variant="danger">Ban User</Button>
              </form>

              <h2>Banned Users</h2>
              {bannedUsers.length === 0 ? (
                <div className="admin-empty">No banned users</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Reason</th>
                      <th>Banned At</th>
                      <th>Banned By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bannedUsers.map(u => (
                      <tr key={u.id}>
                        <td>{u.login} ({u.display_name})</td>
                        <td>{u.ban_reason || '-'}</td>
                        <td>{u.banned_at ? formatRelativeTime(u.banned_at) : '-'}</td>
                        <td>{u.banned_by ? getUserLogin(u.banned_by) : '-'}</td>
                        <td>
                          <button className="btn-success" onClick={() => handleUnbanUser(u.id)}>
                            Unban
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'elo' && (
            <div className="admin-section">
              <h2>Adjust ELO</h2>
              <form className="admin-form" onSubmit={handleAdjustELO}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="elo-user">User</label>
                    <select
                      id="elo-user"
                      value={eloForm.userId}
                      onChange={e => setEloForm(f => ({ ...f, userId: e.target.value }))}
                    >
                      <option value="">Select a user...</option>
                      {allUsers.filter(u => !u.is_banned).map(u => (
                        <option key={u.id} value={u.id}>
                          {u.login} (TT: {u.table_tennis_elo}, TF: {u.table_football_elo})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="elo-sport">Sport</label>
                    <select
                      id="elo-sport"
                      value={eloForm.sport}
                      onChange={e => setEloForm(f => ({ ...f, sport: e.target.value }))}
                    >
                      <option value="table_tennis">Table Tennis</option>
                      <option value="table_football">Table Football</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="elo-value">New ELO</label>
                    <input
                      id="elo-value"
                      type="number"
                      min="100"
                      max="3000"
                      value={eloForm.newElo}
                      onChange={e => setEloForm(f => ({ ...f, newElo: e.target.value }))}
                      placeholder="e.g., 1000"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="elo-reason">Reason</label>
                  <textarea
                    id="elo-reason"
                    value={eloForm.reason}
                    onChange={e => setEloForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="Reason for adjustment..."
                    rows={2}
                  />
                </div>
                <Button type="submit">Adjust ELO</Button>
              </form>

              <h2>Recent ELO Adjustments</h2>
              {eloAdjustments.length === 0 ? (
                <div className="admin-empty">No ELO adjustments yet</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Sport</th>
                      <th>Old ELO</th>
                      <th>New ELO</th>
                      <th>Reason</th>
                      <th>Adjusted By</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eloAdjustments.map(adj => (
                      <tr key={adj.id}>
                        <td>{adj.user_login || getUserLogin(adj.user_id)}</td>
                        <td>{adj.sport === 'table_tennis' ? 'Table Tennis' : 'Table Football'}</td>
                        <td>{adj.old_elo}</td>
                        <td>{adj.new_elo}</td>
                        <td>{adj.reason}</td>
                        <td>{adj.admin_login || getUserLogin(adj.adjusted_by)}</td>
                        <td>{formatRelativeTime(adj.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="admin-section">
              <h2>Revert Matches</h2>
              <p className="section-description">
                Revert confirmed matches to undo ELO changes. This will restore both players' ratings to their pre-match values and permanently delete the match.
              </p>
              {confirmedMatches.length === 0 ? (
                <div className="admin-empty">No confirmed matches to revert</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Sport</th>
                      <th>Player 1</th>
                      <th>Player 2</th>
                      <th>Score</th>
                      <th>ELO Change</th>
                      <th>Confirmed</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {confirmedMatches.map(m => (
                      <tr key={m.id}>
                        <td>#{m.id}</td>
                        <td>{m.sport === 'table_tennis' ? 'TT' : 'TF'}</td>
                        <td>{getUserLogin(m.player1_id)}</td>
                        <td>{getUserLogin(m.player2_id)}</td>
                        <td>{m.player1_score} - {m.player2_score}</td>
                        <td>
                          <span className={m.player1_elo_delta && m.player1_elo_delta > 0 ? 'elo-positive' : 'elo-negative'}>
                            {m.player1_elo_delta && m.player1_elo_delta > 0 ? '+' : ''}{m.player1_elo_delta}
                          </span>
                          {' / '}
                          <span className={m.player2_elo_delta && m.player2_elo_delta > 0 ? 'elo-positive' : 'elo-negative'}>
                            {m.player2_elo_delta && m.player2_elo_delta > 0 ? '+' : ''}{m.player2_elo_delta}
                          </span>
                        </td>
                        <td>{m.confirmed_at ? formatRelativeTime(m.confirmed_at) : '-'}</td>
                        <td className="action-buttons">
                          <button
                            className="btn-danger"
                            onClick={() => handleRevertMatch(m.id)}
                          >
                            Revert
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="admin-section">
              <h2>Admin Audit Log</h2>
              {auditLog.length === 0 ? (
                <div className="admin-empty">No audit log entries</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Admin</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Details</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map(log => (
                      <tr key={log.id}>
                        <td>{log.admin_login || getUserLogin(log.admin_id)}</td>
                        <td>{log.action.replace(/_/g, ' ')}</td>
                        <td>{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}</td>
                        <td>
                          <code style={{ fontSize: '0.75rem' }}>
                            {log.details ? JSON.stringify(log.details) : '-'}
                          </code>
                        </td>
                        <td>{formatRelativeTime(log.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
