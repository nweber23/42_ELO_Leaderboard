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
      showToast('Ihre Daten wurden heruntergeladen', 'success');
    } catch (error) {
      console.error('Failed to export data:', error);
      showToast('Fehler beim Herunterladen der Daten', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user.login) {
      showToast('Bitte geben Sie Ihren Benutzernamen korrekt ein', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      await gdprAPI.deleteAccount();
      showToast('Ihr Konto wurde gelöscht', 'success');
      // Clear local storage and redirect
      localStorage.removeItem('token');
      onLogout();
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      console.error('Failed to delete account:', error);
      showToast('Fehler beim Löschen des Kontos', 'error');
      setIsDeleting(false);
    }
  };

  return (
    <Page title="Einstellungen" subtitle="Verwalten Sie Ihr Konto und Ihre Daten">
      <div className="settings-grid">
        {/* User Rights Section (GDPR) */}
        <Card className="settings-card">
          <CardHeader>
            <CardTitle>🔐 Ihre Datenschutzrechte (DSGVO)</CardTitle>
            <CardDescription>
              Gemäß der Datenschutz-Grundverordnung haben Sie folgende Rechte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="settings-section">
              <h3>Auskunftsrecht (Art. 15 DSGVO)</h3>
              <p>
                Sie haben das Recht zu erfahren, welche personenbezogenen Daten
                wir über Sie speichern. Laden Sie alle Ihre Daten als JSON-Datei herunter.
              </p>
              <Button
                variant="secondary"
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? 'Wird heruntergeladen...' : '📥 Meine Daten herunterladen'}
              </Button>
            </div>

            <div className="settings-section">
              <h3>Recht auf Löschung (Art. 17 DSGVO)</h3>
              <p>
                Sie haben das Recht, die Löschung Ihrer Daten zu verlangen.
                Diese Aktion ist unwiderruflich.
              </p>
              {!showDeleteConfirm ? (
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  🗑️ Konto löschen
                </Button>
              ) : (
                <div className="delete-confirm">
                  <div className="delete-warning">
                    <strong>⚠️ Warnung:</strong> Diese Aktion kann nicht rückgängig
                    gemacht werden. Alle Ihre Daten werden unwiderruflich gelöscht:
                    <ul>
                      <li>Ihr Benutzerprofil</li>
                      <li>Alle Ihre Kommentare</li>
                      <li>Alle Ihre Reaktionen</li>
                      <li>Ihre Matches werden anonymisiert</li>
                    </ul>
                  </div>
                  <label className="delete-confirm-label">
                    Geben Sie <strong>{user.login}</strong> ein, um zu bestätigen:
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
                      Abbrechen
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || deleteConfirmText !== user.login}
                    >
                      {isDeleting ? 'Wird gelöscht...' : 'Endgültig löschen'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="settings-section">
              <h3>Weitere Rechte</h3>
              <p>
                Für weitere Datenschutzanfragen (Berichtigung, Einschränkung,
                Widerspruch) kontaktieren Sie uns bitte per E-Mail.
              </p>
              <p className="settings-links">
                <Link to="/privacy">📄 Datenschutzerklärung lesen</Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="settings-card">
          <CardHeader>
            <CardTitle>👤 Kontoinformationen</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="account-info">
              <div className="account-info-row">
                <dt>Benutzername</dt>
                <dd>{user.login}</dd>
              </div>
              <div className="account-info-row">
                <dt>Anzeigename</dt>
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
                <dt>Tischtennis ELO</dt>
                <dd>{user.table_tennis_elo}</dd>
              </div>
              <div className="account-info-row">
                <dt>Tischfußball ELO</dt>
                <dd>{user.table_football_elo}</dd>
              </div>
              <div className="account-info-row">
                <dt>Registriert seit</dt>
                <dd>{new Date(user.created_at).toLocaleDateString('de-DE')}</dd>
              </div>
            </dl>
            <p className="settings-note">
              Ihre Profildaten stammen von 42 Intra. Um diese zu ändern,
              aktualisieren Sie Ihr Profil auf der Intra-Plattform.
            </p>
          </CardContent>
        </Card>
      </div>

      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        title={toastType === 'success' ? 'Erfolg' : 'Fehler'}
        message={toastMessage}
        variant={toastType}
      />
    </Page>
  );
}

export default Settings;
