import { Page } from '../layout/Page';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import './Legal.css';

export function Impressum() {
  return (
    <Page
      title="Impressum"
      subtitle="Legal information as required by German law (§ 5 TMG)"
    >
      <Card className="legal-card">
        <CardHeader>
          <CardTitle>Impressum</CardTitle>
        </CardHeader>
        <CardContent>
          <section className="legal-section">
            <h2>Angaben gemäß § 5 TMG</h2>
            <p>
              <strong>Betreiber:</strong><br />
              {/* TODO: Replace with actual operator information */}
              [Vollständiger Name]<br />
              [Straße und Hausnummer]<br />
              [PLZ und Stadt]<br />
              Deutschland
            </p>
          </section>

          <section className="legal-section">
            <h2>Kontakt</h2>
            <p>
              <strong>E-Mail:</strong>{' '}
              <a href="mailto:contact@example.com">contact@example.com</a>
            </p>
          </section>

          <section className="legal-section">
            <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>
              {/* TODO: Replace with actual responsible person */}
              [Vollständiger Name]<br />
              [Adresse wie oben]
            </p>
          </section>

          <section className="legal-section">
            <h2>Haftungsausschluss</h2>

            <h3>Haftung für Inhalte</h3>
            <p>
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt.
              Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte
              können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind
              wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach
              den allgemeinen Gesetzen verantwortlich.
            </p>

            <h3>Haftung für Links</h3>
            <p>
              Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren
              Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
              fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
              verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber
              der Seiten verantwortlich.
            </p>
          </section>

          <section className="legal-section">
            <h2>Urheberrecht</h2>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf
              diesen Seiten unterliegen dem deutschen Urheberrecht. Die
              Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
              Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
              schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>

          <section className="legal-section">
            <h2>Online-Streitbeilegung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur
              Online-Streitbeilegung (OS) bereit:{' '}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
          </section>
        </CardContent>
      </Card>
    </Page>
  );
}

export default Impressum;
