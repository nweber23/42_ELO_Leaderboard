import { Page } from '../layout/Page';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import './Legal.css';

export function Impressum() {
  return (
    <Page
      title="Imprint"
      subtitle="Legal information as required by German law (§ 5 TMG)"
    >
      <Card className="legal-card">
        <CardHeader>
          <CardTitle>Imprint</CardTitle>
        </CardHeader>
        <CardContent>
          <section className="legal-section">
            <h2>Information pursuant to § 5 TMG</h2>
            <p>
              <strong>Operator:</strong><br />
              {/* TODO: Replace with actual operator information */}
              [Full Name]<br />
              [Street and House Number]<br />
              [Postal Code and City]<br />
              Germany
            </p>
          </section>

          <section className="legal-section">
            <h2>Contact</h2>
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:contact@example.com">contact@example.com</a>
            </p>
          </section>

          <section className="legal-section">
            <h2>Responsible for content according to § 55 Abs. 2 RStV</h2>
            <p>
              {/* TODO: Replace with actual responsible person */}
              [Full Name]<br />
              [Address as above]
            </p>
          </section>

          <section className="legal-section">
            <h2>Disclaimer</h2>

            <h3>Liability for Contents</h3>
            <p>
              The contents of our pages were created with great care.
              However, we cannot guarantee the correctness, completeness, and topicality of the contents.
              As a service provider, we are responsible for our own content on these pages in accordance with general laws pursuant to § 7 Abs.1 TMG.
            </p>

            <h3>Liability for Links</h3>
            <p>
              Our offer contains links to external third-party websites, on whose contents we have no influence.
              Therefore, we cannot assume any liability for these external contents.
              The respective provider or operator of the pages is always responsible for the contents of the linked pages.
            </p>
          </section>

          <section className="legal-section">
            <h2>Copyright</h2>
            <p>
              The contents and works created by the site operators on these pages are subject to German copyright law.
              Duplication, processing, distribution, and any kind of exploitation outside the limits of copyright law require the written consent of the respective author or creator.
            </p>
          </section>

          <section className="legal-section">
            <h2>Online Dispute Resolution</h2>
            <p>
              The European Commission provides a platform for Online Dispute Resolution (ODR):{' '}
              <a
                href="https://consumer-redress.ec.europa.eu/"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://consumer-redress.ec.europa.eu/
              </a>
            </p>
          </section>
        </CardContent>
      </Card>
    </Page>
  );
}

export default Impressum;
