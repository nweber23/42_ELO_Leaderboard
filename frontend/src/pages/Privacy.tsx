import { Link } from 'react-router-dom';
import { Page } from '../layout/Page';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import './Legal.css';

export function Privacy() {
  return (
    <Page
      title="Privacy Policy"
      subtitle="Privacy Policy as required by GDPR"
    >
      <Card className="legal-card">
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <section className="legal-section">
            <h2>1. Responsible Person</h2>
            <p>
              Responsible for data processing on this website is:<br />
              {/* TODO: Replace with actual operator information */}
              [Full Name]<br />
              [Address]<br />
              Email: <a href="mailto:privacy@example.com">privacy@example.com</a>
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Collected Data</h2>
            <p>
              When using our service, the following personal data is collected and processed:
            </p>
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Data Field</th>
                  <th>Purpose</th>
                  <th>Retention Period</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>intra_id</code></td>
                  <td>Unique user identification</td>
                  <td>Until account deletion</td>
                </tr>
                <tr>
                  <td><code>login</code></td>
                  <td>42 username for display</td>
                  <td>Until account deletion</td>
                </tr>
                <tr>
                  <td><code>display_name</code></td>
                  <td>Display name in the leaderboard</td>
                  <td>Until account deletion</td>
                </tr>
                <tr>
                  <td><code>avatar_url</code></td>
                  <td>Profile picture URL</td>
                  <td>Until account deletion</td>
                </tr>
                <tr>
                  <td><code>campus</code></td>
                  <td>Campus affiliation</td>
                  <td>Until account deletion</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="legal-section">
            <h2>3. Legal Basis for Processing (Art. 6 GDPR)</h2>
            <p>The processing of your data takes place based on:</p>
            <ul>
              <li>
                <strong>Art. 6 Para. 1 lit. a GDPR (Consent):</strong>{' '}
                You gave your consent to data processing when logging in via 42 Intra.
              </li>
              <li>
                <strong>Art. 6 Para. 1 lit. b GDPR (Contract Performance):</strong>{' '}
                Processing is necessary to enable you to use the leaderboard functions.
              </li>
              <li>
                <strong>Art. 6 Para. 1 lit. f GDPR (Legitimate Interest):</strong>{' '}
                We have a legitimate interest in providing a functioning ranking system for the 42 community.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Retention Periods</h2>
            <ul>
              <li>
                <strong>User Data:</strong> Stored until you delete your account or request deletion.
              </li>
              <li>
                <strong>Match Data:</strong> Retained for leaderboard history. Upon account deletion, your matches will be anonymized.
              </li>
              <li>
                <strong>Comments & Reactions:</strong> Deleted upon account deletion.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Third-Party Providers and Data Transfer</h2>

            <h3>5.1 42 Intra API</h3>
            <p>
              We use the 42 Intra API for authentication. In doing so, your public profile data is retrieved from 42.
              For more information, please refer to the privacy policy of 42.
            </p>

            <h3>5.2 Hosting</h3>
            <p>
              This website is hosted by:<br />
              {/* TODO: Replace with actual hosting provider */}
              [Hosting Provider]<br />
              [Address of Host]
            </p>
            <p>
              The hoster processes personal data (e.g., IP addresses) only within the scope of order processing according to Art. 28 GDPR.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Your Rights under GDPR</h2>
            <p>You have the following rights regarding your personal data:</p>

            <h3>6.1 Right of Access (Art. 15 GDPR)</h3>
            <p>
              You have the right to request confirmation as to whether personal data is being processed.
              Use the "Download Data" function in your profile.
            </p>

            <h3>6.2 Right to Rectification (Art. 16 GDPR)</h3>
            <p>
              You have the right to rectification of inaccurate data. Since your data comes from 42 Intra, you can correct it there.
            </p>

            <h3>6.3 Right to Erasure (Art. 17 GDPR)</h3>
            <p>
              You have the right to request the deletion of your data.
              Use the "Delete Account" function in your profile or
              contact us via email.
            </p>

            <h3>6.4 Right to Restriction of Processing (Art. 18 GDPR)</h3>
            <p>
              You can request the restriction of the processing of your data.
            </p>

            <h3>6.5 Right to Data Portability (Art. 20 GDPR)</h3>
            <p>
              You can receive your data in a structured, machine-readable
              format. Use the "Download Data" function.
            </p>

            <h3>6.6 Right to Object (Art. 21 GDPR)</h3>
            <p>
              You can object to the processing of your data at any time.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Cookies</h2>
            <p>
              This website uses only technically necessary cookies for
              authentication. We do not use tracking or advertising cookies.
            </p>
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Purpose</th>
                  <th>Retention Period</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Session Token</td>
                  <td>Authentication</td>
                  <td>24 Hours</td>
                </tr>
                <tr>
                  <td>Cookie Consent</td>
                  <td>Storage of your cookie preference</td>
                  <td>1 Year</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="legal-section">
            <h2>8. Data Security</h2>
            <p>
              We implement technical and organizational security measures:
            </p>
            <ul>
              <li>HTTPS encryption for all data transmissions</li>
              <li>Secure password storage</li>
              <li>Regular security updates</li>
              <li>Access restrictions on server level</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>9. Contact for Privacy Inquiries</h2>
            <p>
              For questions about privacy or to exercise your rights, please contact:<br />
              Email: <a href="mailto:privacy@example.com">privacy@example.com</a>
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Right to Lodge a Complaint</h2>
            <p>
              You have the right to lodge a complaint with a data protection supervisory authority
              if you believe that the processing of your data violates the GDPR.
            </p>
            <p>
              Competent supervisory authority in Baden-Württemberg:<br />
              The State Commissioner for Data Protection and Freedom of Information<br />
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
            <h2>11. Changes to this Privacy Policy</h2>
            <p>
              We reserve the right to adapt this privacy policy to changed legal situations or changes in the service.
            </p>
            <p>
              <strong>Status:</strong> January 2026
            </p>
          </section>

          <div className="legal-links">
            <Link to="/impressum">Imprint</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </CardContent>
      </Card>
    </Page>
  );
}

export default Privacy;
