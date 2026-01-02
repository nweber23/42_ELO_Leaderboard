import { Link } from 'react-router-dom';
import { Page } from '../layout/Page';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import './Legal.css';

export function Privacy() {
  return (
    <Page
      title="Datenschutzerklärung"
      subtitle="Privacy Policy as required by GDPR / DSGVO"
    >
      <Card className="legal-card">
        <CardHeader>
          <CardTitle>Datenschutzerklärung (Privacy Policy)</CardTitle>
        </CardHeader>
        <CardContent>
          <section className="legal-section">
            <h2>1. Verantwortlicher</h2>
            <p>
              Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br />
              {/* TODO: Replace with actual operator information */}
              [Vollständiger Name]<br />
              [Adresse]<br />
              E-Mail: <a href="mailto:privacy@example.com">privacy@example.com</a>
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Erhobene Daten</h2>
            <p>
              Bei der Nutzung unseres Dienstes werden folgende personenbezogene
              Daten erhoben und verarbeitet:
            </p>
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Datenfeld</th>
                  <th>Zweck</th>
                  <th>Speicherdauer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>intra_id</code></td>
                  <td>Eindeutige Benutzeridentifikation</td>
                  <td>Bis zur Kontolöschung</td>
                </tr>
                <tr>
                  <td><code>login</code></td>
                  <td>42-Benutzername zur Anzeige</td>
                  <td>Bis zur Kontolöschung</td>
                </tr>
                <tr>
                  <td><code>display_name</code></td>
                  <td>Anzeigename im Leaderboard</td>
                  <td>Bis zur Kontolöschung</td>
                </tr>
                <tr>
                  <td><code>avatar_url</code></td>
                  <td>Profilbild-URL</td>
                  <td>Bis zur Kontolöschung</td>
                </tr>
                <tr>
                  <td><code>campus</code></td>
                  <td>Campus-Zugehörigkeit</td>
                  <td>Bis zur Kontolöschung</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="legal-section">
            <h2>3. Rechtsgrundlage der Verarbeitung (Art. 6 DSGVO)</h2>
            <p>Die Verarbeitung Ihrer Daten erfolgt auf Grundlage von:</p>
            <ul>
              <li>
                <strong>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung):</strong>{' '}
                Sie haben bei der Anmeldung über 42 Intra Ihre Einwilligung zur
                Datenverarbeitung erteilt.
              </li>
              <li>
                <strong>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung):</strong>{' '}
                Die Verarbeitung ist erforderlich, um Ihnen die Nutzung der
                Leaderboard-Funktionen zu ermöglichen.
              </li>
              <li>
                <strong>Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse):</strong>{' '}
                Wir haben ein berechtigtes Interesse an der Bereitstellung eines
                funktionierenden Ranking-Systems für die 42-Community.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Aufbewahrungsfristen</h2>
            <ul>
              <li>
                <strong>Benutzerdaten:</strong> Werden gespeichert, bis Sie Ihr
                Konto löschen oder die Löschung beantragen.
              </li>
              <li>
                <strong>Match-Daten:</strong> Werden für die Leaderboard-Historie
                aufbewahrt. Bei Kontolöschung werden Ihre Matches anonymisiert.
              </li>
              <li>
                <strong>Kommentare & Reaktionen:</strong> Werden bei Kontolöschung
                gelöscht.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Drittanbieter und Datenübermittlung</h2>

            <h3>5.1 42 Intra API</h3>
            <p>
              Wir nutzen die 42 Intra API zur Authentifizierung. Dabei werden
              Ihre öffentlichen Profildaten von 42 abgerufen. Weitere Informationen
              finden Sie in der Datenschutzerklärung von 42.
            </p>

            <h3>5.2 Hosting</h3>
            <p>
              Diese Website wird gehostet bei:<br />
              {/* TODO: Replace with actual hosting provider */}
              [Hosting-Anbieter]<br />
              [Adresse des Hosters]
            </p>
            <p>
              Der Hoster verarbeitet personenbezogene Daten (z. B. IP-Adressen) nur im Rahmen der Auftragsverarbeitung gemäß Art. 28 DSGVO.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Ihre Rechte nach DSGVO</h2>
            <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>

            <h3>6.1 Auskunftsrecht (Art. 15 DSGVO)</h3>
            <p>
              Sie haben das Recht, eine Bestätigung darüber zu verlangen, ob
              personenbezogene Daten verarbeitet werden. Nutzen Sie die
              "Daten herunterladen"-Funktion in Ihrem Profil.
            </p>

            <h3>6.2 Recht auf Berichtigung (Art. 16 DSGVO)</h3>
            <p>
              Sie haben das Recht auf Berichtigung unrichtiger Daten. Da Ihre
              Daten von 42 Intra stammen, können Sie diese dort korrigieren.
            </p>

            <h3>6.3 Recht auf Löschung (Art. 17 DSGVO)</h3>
            <p>
              Sie haben das Recht, die Löschung Ihrer Daten zu verlangen.
              Nutzen Sie die "Konto löschen"-Funktion in Ihrem Profil oder
              kontaktieren Sie uns per E-Mail.
            </p>

            <h3>6.4 Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</h3>
            <p>
              Sie können die Einschränkung der Verarbeitung Ihrer Daten verlangen.
            </p>

            <h3>6.5 Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</h3>
            <p>
              Sie können Ihre Daten in einem strukturierten, maschinenlesbaren
              Format erhalten. Nutzen Sie die "Daten herunterladen"-Funktion.
            </p>

            <h3>6.6 Widerspruchsrecht (Art. 21 DSGVO)</h3>
            <p>
              Sie können der Verarbeitung Ihrer Daten jederzeit widersprechen.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Cookies</h2>
            <p>
              Diese Website verwendet nur technisch notwendige Cookies für die
              Authentifizierung. Wir setzen keine Tracking- oder Werbe-Cookies ein.
            </p>
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Zweck</th>
                  <th>Speicherdauer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Session Token</td>
                  <td>Authentifizierung</td>
                  <td>24 Stunden</td>
                </tr>
                <tr>
                  <td>Cookie Consent</td>
                  <td>Speicherung Ihrer Cookie-Präferenz</td>
                  <td>1 Jahr</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="legal-section">
            <h2>8. Datensicherheit</h2>
            <p>
              Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein:
            </p>
            <ul>
              <li>HTTPS-Verschlüsselung für alle Datenübertragungen</li>
              <li>Sichere Passwortspeicherung</li>
              <li>Regelmäßige Sicherheitsupdates</li>
              <li>Zugriffsbeschränkungen auf Serverebene</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>9. Kontakt für Datenschutzanfragen</h2>
            <p>
              Für Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte wenden
              Sie sich bitte an:<br />
              E-Mail: <a href="mailto:privacy@example.com">privacy@example.com</a>
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Beschwerderecht</h2>
            <p>
              Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde
              zu beschweren, wenn Sie der Ansicht sind, dass die Verarbeitung
              Ihrer Daten gegen die DSGVO verstößt.
            </p>
            <p>
              Zuständige Aufsichtsbehörde in Baden-Württemberg:<br />
              Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit<br />
              <a
                href="https://www.baden-wuerttemberg.datenschutz.de"
                target="_blank"
                rel="noopener noreferrer"
              >
                www.baden-wuerttemberg.datenschutz.de
              </a>
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Änderungen dieser Datenschutzerklärung</h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie
              an geänderte Rechtslagen oder Änderungen des Dienstes anzupassen.
            </p>
            <p>
              <strong>Stand:</strong> Januar 2026
            </p>
          </section>

          <div className="legal-links">
            <Link to="/impressum">Impressum</Link>
            <Link to="/terms">Nutzungsbedingungen</Link>
          </div>
        </CardContent>
      </Card>
    </Page>
  );
}

export default Privacy;
