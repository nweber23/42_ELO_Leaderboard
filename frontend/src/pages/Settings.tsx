import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Page } from '../layout/Page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { gdprAPI } from '../api/client';
import type { User } from '../types';
import './Settings.css';

interface SettingsProps {
  user: User;
  onLogout: () => void;
}

export function Settings({ user, onLogout }: SettingsProps) {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await gdprAPI.downloadData();
      showToast('Your data has been downloaded', 'success');
    } catch (error) {
      console.error('Failed to export data:', error);
      showToast('Error downloading data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user.login) {
      showToast('Please enter your username correctly', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      await gdprAPI.deleteAccount();
      showToast('Your account has been deleted', 'success');
      // Clear local storage and redirect
      localStorage.removeItem('token');
      onLogout();
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      console.error('Failed to delete account:', error);
      showToast('Error deleting account', 'error');
      setIsDeleting(false);
    }
  };

  return (
    <Page title="Settings" subtitle="Manage your account and data">
      <div className="settings-grid">
        {/* User Rights Section (GDPR) */}
        <Card className="settings-card">
          <CardHeader>
            <CardTitle>🔐 Your Data Rights (GDPR)</CardTitle>
            <CardDescription>
              Under the General Data Protection Regulation, you have the following rights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="settings-section">
              <h3>Right of Access (Art. 15 GDPR)</h3>
              <p>
                You have the right to know what personal data we store about you.
                Download all your data as a JSON file.
              </p>
              <Button
                variant="secondary"
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? 'Downloading...' : '📥 Download my data'}
              </Button>
            </div>

            <div className="settings-section">
              <h3>Right to Erasure (Art. 17 GDPR)</h3>
              <p>
                You have the right to request the deletion of your data.
                This action is irreversible.
              </p>
              {!showDeleteConfirm ? (
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  🗑️ Delete Account
                </Button>
              ) : (
                <div className="delete-confirm">
                  <div className="delete-warning">
                    <strong>⚠️ Warning:</strong> This action cannot be undone.
                    All your data will be irrevocably deleted:
                    <ul>
                      <li>Your user profile</li>
                      <li>All your comments</li>
                      <li>All your reactions</li>
                      <li>Your matches will be anonymized</li>
                    </ul>
                  </div>
                  <label className="delete-confirm-label">
                    Enter <strong>{user.login}</strong> to confirm:
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={user.login}
                      className="delete-confirm-input"
                      autoComplete="off"
                    />
                  </label>
                  <div className="delete-confirm-actions">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || deleteConfirmText !== user.login}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete permanently'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="settings-section">
              <h3>Other Rights</h3>
              <p>
                For further privacy inquiries (correction, restriction,
                objection) please contact us via email.
              </p>
              <p className="settings-links">
                <Link to="/privacy">📄 Read Privacy Policy</Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="settings-card">
          <CardHeader>
            <CardTitle>👤 Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="account-info">
              <div className="account-info-row">
                <dt>Username</dt>
                <dd>{user.login}</dd>
              </div>
              <div className="account-info-row">
                <dt>Display Name</dt>
                <dd>{user.display_name}</dd>
              </div>
              <div className="account-info-row">
                <dt>Campus</dt>
                <dd>{user.campus}</dd>
              </div>
              <div className="account-info-row">
                <dt>Intra ID</dt>
                <dd>{user.intra_id}</dd>
              </div>
              <div className="account-info-row">
                <dt>Table Tennis ELO</dt>
                <dd>{user.table_tennis_elo}</dd>
              </div>
              <div className="account-info-row">
                <dt>Table Football ELO</dt>
                <dd>{user.table_football_elo}</dd>
              </div>
              <div className="account-info-row">
                <dt>Registered since</dt>
                <dd>{new Date(user.created_at).toLocaleDateString('en-GB')}</dd>
              </div>
            </dl>
            <p className="settings-note">
              Your profile data comes from 42 Intra. To change these,
              update your profile on the Intra platform.
            </p>
          </CardContent>
        </Card>
      </div>

      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        title={toastType === 'success' ? 'Success' : 'Error'}
        message={toastMessage}
        tone={toastType}
      />
    </Page>
  );
}

export default Settings;
