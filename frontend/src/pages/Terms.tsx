import { Link } from 'react-router-dom';
import { Page } from '../layout/Page';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import './Legal.css';

export function Terms() {
  return (
    <Page
      title="Nutzungsbedingungen"
      subtitle="Terms of Service for using the ELO Leaderboard"
    >
      <Card className="legal-card">
        <CardHeader>
          <CardTitle>Nutzungsbedingungen (Terms of Service)</CardTitle>
        </CardHeader>
        <CardContent>
          <section className="legal-section">
            <h2>1. Geltungsbereich</h2>
            <p>
              Diese Nutzungsbedingungen gelten für die Nutzung des ELO Leaderboard
              für Tischtennis und Tischfußball ("der Dienst"). Mit der Registrierung
              und Nutzung akzeptieren Sie diese Bedingungen.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Beschreibung des Dienstes</h2>
            <p>
              Der Dienst ermöglicht 42-Studenten:
            </p>
            <ul>
              <li>Die Erfassung von Tischtennis- und Tischfußball-Matches</li>
              <li>Die Berechnung und Anzeige von ELO-Ranglisten</li>
              <li>Kommentare und Reaktionen auf bestätigte Matches</li>
              <li>Die Einsicht in Spielerprofile und Statistiken</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Zugangsvoraussetzungen</h2>
            <ul>
              <li>Sie müssen ein aktiver 42-Student mit gültigem Intra-Account sein</li>
              <li>Sie müssen dem Campus Heilbronn zugeordnet sein</li>
              <li>Sie müssen mindestens 16 Jahre alt sein</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Regeln für Match-Einreichungen</h2>

            <h3>4.1 Ehrlichkeit</h3>
            <p>
              Sie verpflichten sich, nur korrekte Match-Ergebnisse einzureichen.
              Die Manipulation von Ergebnissen ist verboten.
            </p>

            <h3>4.2 Bestätigungspflicht</h3>
            <p>
              Matches müssen vom Gegner bestätigt werden. Nur bestätigte Matches
              fließen in die ELO-Berechnung ein.
            </p>

            <h3>4.3 Verbotene Handlungen</h3>
            <ul>
              <li>Einreichen von nicht stattgefundenen Matches</li>
              <li>Absprachen zur Manipulation der Rangliste ("Boosting")</li>
              <li>Einreichen von Matches unter falschen Identitäten</li>
              <li>Absichtliches Verlieren zur Manipulation ("Win Trading")</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Akzeptables Verhalten</h2>

            <h3>5.1 Kommentare</h3>
            <p>
              Bei Kommentaren zu Matches sind folgende Inhalte verboten:
            </p>
            <ul>
              <li>Beleidigungen, Hassrede oder Diskriminierung</li>
              <li>Spam oder unerwünschte Werbung</li>
              <li>Persönliche Angriffe gegen andere Nutzer</li>
              <li>Unangemessene oder anstößige Inhalte</li>
              <li>Verbreitung von Falschinformationen</li>
            </ul>

            <h3>5.2 Fair Play</h3>
            <p>
              Wir erwarten sportliches und faires Verhalten. Der Dienst soll
              Spaß machen und die Community stärken.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Moderationsrechte der Administratoren</h2>
            <p>
              Die Administratoren des Dienstes haben das Recht:
            </p>
            <ul>
              <li>
                <strong>Matches zu überprüfen und zu korrigieren:</strong>{' '}
                Bei Verdacht auf Manipulation können Matches rückgängig gemacht
                oder gelöscht werden.
              </li>
              <li>
                <strong>ELO-Werte anzupassen:</strong>{' '}
                Bei nachgewiesener Manipulation können ELO-Werte korrigiert werden.
              </li>
              <li>
                <strong>Kommentare zu löschen:</strong>{' '}
                Unangemessene Kommentare können ohne Vorwarnung entfernt werden.
              </li>
              <li>
                <strong>Nutzer zu sperren:</strong>{' '}
                Bei schweren oder wiederholten Verstößen können Nutzer temporär
                oder dauerhaft gesperrt werden.
              </li>
              <li>
                <strong>Konten zu löschen:</strong>{' '}
                Bei gravierenden Verstößen kann ein Konto vollständig gelöscht werden.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Missbrauchshandhabung</h2>

            <h3>7.1 Meldung von Verstößen</h3>
            <p>
              Wenn Sie einen Verstoß gegen diese Nutzungsbedingungen beobachten,
              melden Sie diesen bitte an:{' '}
              <a href="mailto:abuse@example.com">abuse@example.com</a>
            </p>

            <h3>7.2 Sanktionen</h3>
            <p>Je nach Schwere des Verstoßes können folgende Maßnahmen ergriffen werden:</p>
            <ul>
              <li><strong>Verwarnung:</strong> Schriftliche Ermahnung per E-Mail</li>
              <li><strong>Temporäre Sperre:</strong> Zeitlich begrenzte Sperrung des Kontos</li>
              <li><strong>ELO-Korrektur:</strong> Zurücksetzen des ELO auf Startwert</li>
              <li><strong>Permanente Sperre:</strong> Dauerhafte Sperrung des Kontos</li>
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
              <strong>Stand:</strong> Januar 2026
            </p>
          </section>

          <div className="legal-links">
            <Link to="/impressum">Impressum</Link>
            <Link to="/privacy">Datenschutzerklärung</Link>
          </div>
        </CardContent>
      </Card>
    </Page>
  );
}

export default Terms;
