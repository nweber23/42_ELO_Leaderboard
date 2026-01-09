import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import './CookieConsent.css';

const COOKIE_CONSENT_KEY = 'cookie_consent';
const COOKIE_CONSENT_VERSION = 'v1'; // Increment to re-show banner after policy changes

export type ConsentStatus = 'pending' | 'accepted' | 'rejected';

export function getCookieConsent(): ConsentStatus {
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!stored) return 'pending';

  try {
    const parsed = JSON.parse(stored);
    if (parsed.version !== COOKIE_CONSENT_VERSION) {
      return 'pending';
    }
    return parsed.status as ConsentStatus;
  } catch {
    return 'pending';
  }
}

export function setCookieConsent(status: 'accepted' | 'rejected'): void {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
    status,
    version: COOKIE_CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  }));
}

export function hasConsented(): boolean {
  return getCookieConsent() === 'accepted';
}

interface CookieConsentBannerProps {
  onConsentChange?: (accepted: boolean) => void;
}

export function CookieConsentBanner({ onConsentChange }: CookieConsentBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show banner if consent is pending
    const consent = getCookieConsent();
    if (consent === 'pending') {
      // Small delay to prevent flash on page load
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setCookieConsent('accepted');
    setVisible(false);
    onConsentChange?.(true);
  };

  const handleReject = () => {
    setCookieConsent('rejected');
    setVisible(false);
    onConsentChange?.(false);
    // Clear any existing non-essential cookies/storage here if needed
  };

  if (!visible) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-label="Cookie consent">
      <div className="cookie-consent__content">
        <div className="cookie-consent__text">
          <h3 className="cookie-consent__title">Cookie Notice</h3>
          <p className="cookie-consent__message">
            This website uses technically necessary cookies for
            authentication. We do not use tracking or advertising cookies.{' '}
            <Link to="/privacy" className="cookie-consent__link">
              Learn more
            </Link>
          </p>
        </div>
        <div className="cookie-consent__actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReject}
            className="cookie-consent__btn"
          >
            Decline
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAccept}
            className="cookie-consent__btn"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsentBanner;
