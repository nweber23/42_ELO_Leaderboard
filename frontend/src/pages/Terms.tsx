import { Link } from 'react-router-dom';
import { Page } from '../layout/Page';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import './Legal.css';

export function Terms() {
  return (
    <Page
      title="Terms of Service"
      subtitle="Terms of Service for using the ELO Leaderboard"
    >
      <Card className="legal-card">
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
        </CardHeader>
        <CardContent>
          <section className="legal-section">
            <h2>Notice on Usage</h2>
            <p>
              This project is not an official 42 project and is not affiliated
              with any of the 42 schools or the 42 organization.
            </p>
          </section>

          <section className="legal-section">
            <h2>1. Scope</h2>
            <p>
              These Terms of Service apply to the use of the ELO Leaderboard
              for Table Tennis and Table Football ("the Service"). By registering
              and using it, you accept these conditions.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Description of Service</h2>
            <p>
              The Service allows 42 students to:
            </p>
            <ul>
              <li>Record Table Tennis and Table Football matches</li>
              <li>Calculate and view ELO rankings</li>
              <li>Comment and react to confirmed matches</li>
              <li>View player profiles and statistics</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Access Requirements</h2>
            <ul>
              <li>You must be an active 42 student with a valid Intra account</li>
              <li>You must be assigned to Campus Heilbronn</li>
              <li>You must be at least 18 years old</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Rules for Match Submissions</h2>

            <h3>4.1 Honesty</h3>
            <p>
              You undertake to submit only correct match results.
              Manipulation of results is prohibited.
            </p>

            <h3>4.2 Confirmation Requirement</h3>
            <p>
              Matches must be confirmed by the opponent. Only confirmed matches
              are included in the ELO calculation.
            </p>

            <h3>4.3 Prohibited Actions</h3>
            <ul>
              <li>Submitting matches that did not take place</li>
              <li>Collusion to manipulate the ranking ("Boosting")</li>
              <li>Submitting matches under false identities</li>
              <li>Intentionally losing to manipulate ("Win Trading")</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Acceptable Behavior</h2>

            <h3>5.1 Comments</h3>
            <p>
              The following content is prohibited in comments on matches:
            </p>
            <ul>
              <li>Insults, hate speech, or discrimination</li>
              <li>Spam or unwanted advertising</li>
              <li>Personal attacks against other users</li>
              <li>Inappropriate or offensive content</li>
              <li>Dissemination of false information</li>
            </ul>

            <h3>5.2 Fair Play</h3>
            <p>
              We expect sportsmanship and fair behavior. The service should
              be fun and strengthen the community.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Moderation Rights of Administrators</h2>
            <p>
              The administrators of the service have the right to:
            </p>
            <ul>
              <li>
                <strong>Review and correct matches:</strong>{' '}
                In case of suspected manipulation, matches can be undone
                or deleted.
              </li>
              <li>
                <strong>Adjust ELO values:</strong>{' '}
                In case of proven manipulation, ELO values can be corrected.
              </li>
              <li>
                <strong>Delete comments:</strong>{' '}
                Inappropriate comments can be removed without prior warning.
              </li>
              <li>
                <strong>Ban users:</strong>{' '}
                In case of serious or repeated violations, users can be
                temporarily or permanently banned.
              </li>
              <li>
                <strong>Delete accounts:</strong>{' '}
                In case of serious violations, an account can be completely deleted.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Abuse Handling</h2>

            <h3>7.1 Reporting Violations</h3>
            <p>
              If you observe a violation of these Terms of Service,
              please report it to:{' '}
              <a href="mailto:abuse@example.com">abuse@example.com</a>
            </p>

            <h3>7.2 Sanctions</h3>
            <p>Depending on the severity of the violation, the following measures may be taken:</p>
            <ul>
              <li><strong>Warning:</strong> Written warning via email</li>
              <li><strong>Temporary Ban:</strong> Temporary suspension of the account</li>
              <li><strong>ELO Correction:</strong> Resetting the ELO to the starting value</li>
              <li><strong>Permanent Ban:</strong> Permanent suspension of the account</li>
            </ul>

            <h3>7.3 Einspruchsrecht</h3>
            <p>
              Bei Sanktionen haben Sie das Recht, Einspruch einzulegen.
              Senden Sie Ihren Einspruch innerhalb von 14 Tagen an:{' '}
              <a href="mailto:appeals@example.com">appeals@example.com</a>
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Haftungsausschluss</h2>
            <ul>
              <li>
                Der Dienst wird "wie besehen" bereitgestellt, ohne Garantie auf
                Verfügbarkeit oder Fehlerfreiheit.
              </li>
              <li>
                Wir haften nicht für Verluste von ELO-Punkten durch technische Fehler.
              </li>
              <li>
                ELO-Werte und Rankings haben keinen realen Wert und begründen
                keine Ansprüche.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>9. Datenschutz</h2>
            <p>
              Die Verarbeitung Ihrer Daten erfolgt gemäß unserer{' '}
              <Link to="/privacy">Datenschutzerklärung</Link>, die integraler
              Bestandteil dieser Nutzungsbedingungen ist.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Änderungen der Nutzungsbedingungen</h2>
            <p>
              Wir behalten uns vor, diese Nutzungsbedingungen zu ändern.
              Wesentliche Änderungen werden über den Dienst kommuniziert.
              Die fortgesetzte Nutzung nach einer Änderung gilt als Zustimmung.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Kündigung</h2>
            <p>
              Sie können Ihr Konto jederzeit löschen. Die Löschung ist endgültig
              und kann nicht rückgängig gemacht werden. Nutzen Sie hierfür die
              "Konto löschen"-Funktion in Ihrem Profil.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Anwendbares Recht</h2>
            <p>
              Es gilt deutsches Recht. Gerichtsstand ist Heilbronn, Deutschland.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Salvatorische Klausel</h2>
            <p>
              Sollten einzelne Bestimmungen dieser Nutzungsbedingungen unwirksam
              sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            </p>
          </section>

          <section className="legal-section">
            <p>
              <strong>Status:</strong> January 2026
            </p>
          </section>

          <div className="legal-links">
            <Link to="/impressum">Imprint</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </CardContent>
      </Card>
    </Page>
  );
}

export default Terms;
