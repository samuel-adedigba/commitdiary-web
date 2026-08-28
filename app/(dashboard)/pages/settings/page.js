'use client'

import { useRef, useState } from 'react';
import { Container } from 'react-bootstrap';
import { FiBell, FiCreditCard, FiKey, FiUser } from 'react-icons/fi';

// import widget as custom components
import { PageHeading } from 'widgets'

// import sub components
import { DeleteAccount, GeneralSetting } from 'sub-components'

// import custom components
import ApiKeyManager from '/components/custom/ApiKeyManager';
import WebhookSettings from '/sub-components/settings/WebhookSettings';
import BillingSettings from '/sub-components/settings/BillingSettings';

const settingsSections = [
  { id: 'account', label: 'Account settings', description: 'Profile and account controls', icon: FiUser },
  { id: 'api-keys', label: 'API Keys', description: 'Connect your developer tools', icon: FiKey },
  { id: 'billing', label: 'Billing', description: 'Plan and payment details', icon: FiCreditCard },
  { id: 'notifications', label: 'Notifications', description: 'Discord delivery preferences', icon: FiBell },
];

const Settings = () => {
  const [activeSection, setActiveSection] = useState('account');
  const tabRefs = useRef({});

  const handleTabKeyDown = (event, currentIndex) => {
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % settingsSections.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + settingsSections.length) % settingsSections.length;
    if (nextIndex === currentIndex) return;

    event.preventDefault();
    const nextSection = settingsSections[nextIndex];
    setActiveSection(nextSection.id);
    tabRefs.current[nextSection.id]?.focus();
  };

  const activeSectionDetails = settingsSections.find((section) => section.id === activeSection);

  return (
    <Container fluid className="p-6">
      <PageHeading heading="Settings" as="h1" />

      <div className="settings-shell">
        <div className="settings-overview">
          <div>
            <span className="settings-eyebrow">Workspace preferences</span>
            <h2 className="settings-title">Everything in one place</h2>
            <p className="settings-subtitle mb-0">Manage your profile, developer access, plan, and notifications without losing your place.</p>
          </div>
          <div className="settings-overview-mark" aria-hidden="true">CD</div>
        </div>

        <div className="settings-tabs-card">
          <nav className="settings-tabs" aria-label="Settings sections" role="tablist">
            {settingsSections.map((section, index) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  ref={(element) => { tabRefs.current[section.id] = element; }}
                  type="button"
                  className={`settings-tab${isActive ? ' active' : ''}`}
                  id={`settings-tab-${section.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="settings-panel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveSection(section.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  <span className="settings-tab-icon" aria-hidden="true"><Icon size={17} /></span>
                  <span className="settings-tab-copy">
                    <strong>{section.label}</strong>
                    <small>{section.description}</small>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="settings-panel-heading">
          <div>
            <span className="settings-eyebrow">Settings</span>
            <h2>{activeSectionDetails?.label}</h2>
          </div>
          <p>{activeSectionDetails?.description}</p>
        </div>

        <section
          id="settings-panel"
          className="settings-panel"
          role="tabpanel"
          aria-labelledby={`settings-tab-${activeSection}`}
          tabIndex={-1}
        >
          {activeSection === 'account' && <><GeneralSetting /><DeleteAccount /></>}
          {activeSection === 'api-keys' && <ApiKeyManager />}
          {activeSection === 'billing' && <BillingSettings />}
          {activeSection === 'notifications' && <WebhookSettings />}
        </section>
      </div>

    </Container>
  )
}

export default Settings
