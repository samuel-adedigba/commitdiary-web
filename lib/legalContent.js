import { legalConfig } from "./legalConfig";

const paddleBuyerTermsUrl = "https://www.paddle.com/legal/checkout-buyer-terms";
const paddleRefundPolicyUrl = "https://www.paddle.com/legal/refund-policy";
const fccpcComplaintUrl = "https://complaints.fccpc.gov.ng/";

const sellerName = legalConfig.legalName || "CommitDiary";
const supportEmail = legalConfig.supportEmail;
const privacyEmail = legalConfig.privacyEmail;

export const legalDocuments = {
  terms: {
    eyebrow: "Terms of service",
    title: "Clear terms for work that stays yours.",
    description:
      "These terms explain how CommitDiary works, what you can expect from the service, and what we need from you.",
    sections: [
      {
        id: "service",
        title: "1. The service",
        paragraphs: [
          "CommitDiary is a developer work journal. The VS Code extension can discover and organise Git activity locally. Optional hosted features can provide authenticated cloud history, engineering reports, sharing, and Discord delivery.",
          "The local experience is available without a paid subscription. Paid features, plan limits, and current availability are shown on the pricing page and in checkout.",
        ],
      },
      {
        id: "account",
        title: "2. Your account",
        paragraphs: [
          "Provide accurate account information and keep your sign-in details secure. You are responsible for activity carried out through your account unless it resulted from our failure to protect it.",
          "You must be legally able to use the service. If you use CommitDiary for a team or organisation, you confirm that you have authority to accept these terms for that organisation.",
        ],
      },
      {
        id: "acceptable-use",
        title: "3. Acceptable use",
        paragraphs: ["You must not use CommitDiary to:"],
        items: [
          "break the law, defraud, harass, or send spam;",
          "infringe another person's intellectual-property or privacy rights;",
          "introduce malware, probe our systems, scrape the service, or interfere with security; or",
          "circumvent plan limits, access controls, or another user's account.",
        ],
      },
      {
        id: "your-content",
        title: "4. Your content and Git data",
        paragraphs: [
          "You keep your rights in your repositories, commit metadata, reports, messages, and other material you provide. You give us only the limited permission needed to host, process, secure, display, and deliver the features you request.",
          "CommitDiary is designed to use bounded Git evidence rather than upload an entire repository. You remain responsible for checking that you have permission to send any repository or work data to a hosted feature.",
        ],
      },
      {
        id: "ai-reports",
        title: "5. Reports and automated assistance",
        paragraphs: [
          "Reports and AI-assisted summaries are working aids. They can be incomplete or wrong and do not replace code review, tests, security review, professional advice, or your own judgement.",
          "Review generated output against the code, tests, product context, and business intent before relying on it or sharing it with others.",
        ],
      },
      {
        id: "paid-plans",
        title: "6. Paid plans and billing",
        paragraphs: [
          `Paid plans are sold through Paddle. ${sellerName} provides the CommitDiary service, while Paddle acts as the merchant of record for the payment transaction, subscription billing, applicable tax collection, and invoicing.`,
          "The price, currency, tax, billing frequency, renewal amount, and any trial terms are shown before payment. A recurring plan renews until cancelled. You can manage or cancel it through the customer billing portal; cancellation normally stops the next renewal and does not remove access before the paid period ends.",
          "Payment failures can limit or suspend paid access after any applicable grace period shown in your account. We do not use a browser redirect as proof of payment or entitlement.",
          "Paddle's buyer terms also apply to the purchase and payment relationship.",
        ],
        links: [{ label: "Read Paddle's buyer terms", href: paddleBuyerTermsUrl }],
      },
      {
        id: "refunds",
        title: "7. Refunds and cancellations",
        paragraphs: [
          "Refund eligibility and the request process are described in our Refund Policy. Payment refunds are handled through Paddle and normally return to the original payment method.",
          "Nothing in these terms removes a consumer right that cannot lawfully be excluded or limits remedies for fraud, negligence, misrepresentation, defective performance, or another non-excludable matter.",
        ],
        links: [{ label: "Read the Refund Policy", href: "/refunds" }],
      },
      {
        id: "availability",
        title: "8. Availability and changes",
        paragraphs: [
          "We work to keep CommitDiary useful and secure, but the service is not promised to be uninterrupted or error-free. Local features may depend on your editor, operating system, Git installation, or network.",
          "We may improve, change, or retire features. If a change materially affects a paid service, we will provide notice where required and will not use a change to remove mandatory consumer rights.",
        ],
      },
      {
        id: "suspension",
        title: "9. Suspension and termination",
        paragraphs: [
          "We may suspend or end access when needed for a material breach, non-payment, security or fraud risk, or repeated or serious policy violations. We will take reasonable steps to explain the reason and restore access when the issue is resolved, where appropriate.",
          "You can stop using the service at any time. Account deletion and data requests are handled through account settings or by contacting us.",
        ],
      },
      {
        id: "complaints",
        title: "10. Complaints and disputes",
        paragraphs: [
          `Contact ${supportEmail} first so we can understand and resolve the issue. Include the account email, transaction or request reference, and a short description; do not send passwords, payment-card data, or secret keys.`,
          "We will handle complaints fairly and keep the process proportionate to the issue. You may retain any mandatory right to contact a competent regulator or court, including the Federal Competition and Consumer Protection Commission where applicable.",
        ],
        links: [{ label: "FCCPC consumer complaint portal", href: fccpcComplaintUrl }],
      },
      {
        id: "law",
        title: "11. Governing law",
        paragraphs: [
          "These terms are governed by the laws of Nigeria, subject to any mandatory consumer or data-protection rights that apply to you. Courts with proper jurisdiction in Nigeria may hear a dispute after the parties have had a reasonable opportunity to resolve it directly.",
        ],
      },
      {
        id: "changes",
        title: "12. Changes to these terms",
        paragraphs: [
          `We may update these terms as the service or law changes. We will show the effective date and, for material changes affecting existing users, provide notice through the service or by email where appropriate. Continued use after the effective date means the updated terms apply to future use.`,
        ],
      },
    ],
  },
  privacy: {
    eyebrow: "Privacy notice",
    title: "Your code context deserves a careful boundary.",
    description:
      "This notice explains what CommitDiary collects, why it uses it, who it shares it with, and the choices available to you.",
    sections: [
      {
        id: "controller",
        title: "1. Who is responsible",
        paragraphs: [
          `${sellerName} is responsible for the personal data CommitDiary collects through its website, extension-connected services, and dashboard. For privacy questions, contact ${privacyEmail}.`,
          "If the legal entity name or registered address shown in your deployment is incomplete, it must be configured before live Paddle domain review. The live notice must identify the actual legal entity and registered or principal business address.",
        ],
      },
      {
        id: "data-we-collect",
        title: "2. Data we collect",
        paragraphs: ["Depending on the features you use, this can include:"],
        items: [
          "account details such as username, email address, authentication records, and profile information;",
          "Git and work-journal data such as repository identity, commit metadata, file paths, statistics, selected patch excerpts, categories, and generated reports;",
          "support requests, feedback, device information, IP address, security events, and service-usage information;",
          "billing identifiers and subscription status received from Paddle. Paddle collects and processes payment details under its own privacy terms; and",
          "integration data when you choose to connect services such as Discord or Git providers.",
        ],
      },
      {
        id: "why-we-use-it",
        title: "3. Why we use it",
        paragraphs: [
          "We use data to create and secure accounts, provide requested features, sync and display work history, generate reports, deliver integrations, provide support, prevent abuse, improve reliability, meet legal obligations, and keep billing records.",
          "We use optional marketing data only where you have given a separate, clear choice. Service access is not conditioned on marketing consent.",
        ],
      },
      {
        id: "legal-bases",
        title: "4. Processing grounds",
        paragraphs: [
          "Depending on the activity and applicable law, we rely on providing the service you requested, complying with a legal obligation, our legitimate interests in security and service operation, or your consent. We do not treat silence or a pre-selected marketing option as consent.",
          "Where processing relies on consent, you can withdraw it as easily as you gave it. Withdrawal does not affect processing that already happened lawfully or processing needed for the service or a legal obligation.",
        ],
      },
      {
        id: "sharing",
        title: "5. When we share data",
        paragraphs: [
          "We share the minimum data needed with service providers that help us host the application, authenticate users, store data, deliver email or support, operate queues, and provide requested integrations. They must handle data under contractual and security controls.",
          "Paddle acts as an independent provider and merchant of record for paid transactions. It processes buyer information for payment, subscription management, tax, invoicing, fraud prevention, and related legal obligations under its own policies.",
          "We may disclose data to professional advisers, authorities, or another party when required by law, needed to protect rights and safety, or necessary for a corporate transaction. We do not sell repository content or personal data.",
        ],
      },
      {
        id: "retention",
        title: "6. Retention",
        paragraphs: [
          "We keep account and work-journal data while your account is active and for as long as needed to provide a feature you requested. After closure, we delete or anonymise it on a controlled schedule unless we need to retain it for a legal obligation, billing record, security investigation, dispute, backup recovery window, or the establishment or defence of a claim.",
          "Security and request logs are retained only for as long as needed for abuse prevention, incident response, troubleshooting, and legal accountability. We review retention periods as the product changes.",
        ],
      },
      {
        id: "your-rights",
        title: "7. Your choices and rights",
        paragraphs: [
          `You may ask us to access, correct, delete, restrict, or provide a copy of personal data, or object to processing where the law allows. You can also withdraw optional consent and unsubscribe from marketing messages. Contact ${privacyEmail}; we may need to verify your identity before acting.`,
          "We will respond within the period required by applicable data-protection law and explain any lawful reason a request cannot be completed in full.",
        ],
      },
      {
        id: "children",
        title: "8. Children and minors",
        paragraphs: [
          "CommitDiary is a developer tool and is not directed to children. Do not create an account or submit personal data if you are not legally able to agree to these terms. If you believe a minor has provided data without the required authorisation, contact us so we can review and remove it where appropriate.",
        ],
      },
      {
        id: "security",
        title: "9. Security",
        paragraphs: [
          "We use access controls, authenticated sessions, encryption in transit, provider safeguards, rate limits, audit signals, and least-privilege operational access appropriate to the risk. No online service can promise absolute security, so protect your credentials and avoid sending secrets or data you are not authorised to share.",
          "If we identify a personal-data incident, we will investigate, contain it, document the response, and notify regulators or affected people when required by applicable law.",
        ],
      },
      {
        id: "international-transfers",
        title: "10. International processing",
        paragraphs: [
          "Some providers may process data outside Nigeria. We assess the transfer and use contractual, organisational, or other safeguards required by applicable data-protection law. The service provider list and material changes to international processing will be reflected here or in an applicable vendor notice.",
        ],
      },
      {
        id: "cookies",
        title: "11. Cookies",
        paragraphs: [
          "CommitDiary currently uses necessary cookies for authentication, session continuity, security, and recovery. These include session, expiry, recovery, and CSRF-protection cookies. We do not currently use advertising cookies or optional analytics cookies on the public site.",
          "If optional analytics, advertising, or similar tracking is introduced, we will update this notice and provide a separate consent and preference mechanism before using it where consent is required. See the Cookie Policy for the current list and purpose of these cookies.",
        ],
        links: [{ label: "Read the Cookie Policy", href: "/cookies" }],
      },
      {
        id: "changes",
        title: "12. Updates and contact",
        paragraphs: [
          `We may update this notice when our processing or legal obligations change. The current version is dated ${legalConfig.effectiveDate}. For privacy requests or concerns, email ${privacyEmail}.`,
        ],
      },
    ],
  },
  refunds: {
    eyebrow: "Refund policy",
    title: "A straightforward way to put things right.",
    description:
      "This policy explains cancellation, refunds, and what to do when a payment or paid feature does not look right.",
    sections: [
      {
        id: "change-of-mind",
        title: "1. Change-of-mind refunds",
        paragraphs: [
          "For a paid CommitDiary plan, you can request a change-of-mind refund within 14 days of the relevant purchase or renewal. Paddle may review the transaction and the service already used when applying its refund process.",
          "This 14-day window does not limit a mandatory right to a refund, remedy, or cancellation under applicable law, including where the service was not supplied as agreed or a payment was unauthorised.",
        ],
      },
      {
        id: "how-to-request",
        title: "2. How to request one",
        paragraphs: [
          "Use Paddle's buyer support at Paddle.net and include the email used for checkout, the transaction reference, and the reason for the request. Never send your card number, CVV, password, API key, or other secret.",
          `If Paddle.net is unavailable or you need help identifying a transaction, contact ${supportEmail} and we will route the request.`,
        ],
        links: [
          { label: "Request help through Paddle", href: "https://paddle.net" },
          { label: "Read Paddle's standard refund policy", href: paddleRefundPolicyUrl },
        ],
      },
      {
        id: "cancellation",
        title: "3. Cancellation",
        paragraphs: [
          "Cancel a recurring plan through the CommitDiary billing portal. Cancellation stops future renewals; access normally remains available until the end of the current paid period. Cancelling does not itself create a refund for time already paid for.",
        ],
      },
      {
        id: "service-problems",
        title: "4. Service problems and payment errors",
        paragraphs: [
          "Contact us promptly if you were charged twice, paid for a plan that was not provisioned, received a material service failure, or see a payment you do not recognise. We will investigate the account and provider records and seek the appropriate correction, refund, or other remedy.",
          "Refunds approved by Paddle normally return to the original payment method. The time for a credit to appear depends on the payment method and financial institution.",
        ],
      },
      {
        id: "fairness",
        title: "5. Fair treatment",
        paragraphs: [
          "We do not use an unreasonable “all sales are final” rule. We will assess requests consistently, communicate the outcome, and preserve rights that cannot lawfully be excluded.",
        ],
      },
      {
        id: "records",
        title: "6. Records and escalation",
        paragraphs: [
          `Keep your receipt and support reference. If we cannot resolve a complaint, you may use the applicable consumer-protection channels, including the FCCPC complaint portal.`,
        ],
        links: [{ label: "Open the FCCPC complaint portal", href: fccpcComplaintUrl }],
      },
    ],
  },
  cookies: {
    eyebrow: "Cookie policy",
    title: "Small files. Clear reasons.",
    description:
      "CommitDiary keeps cookies limited to the work of signing in, securing sessions, and recovering access.",
    sections: [
      {
        id: "necessary",
        title: "1. Necessary cookies only",
        paragraphs: [
          "The website currently uses cookies that are necessary for the service to function. They help maintain an authenticated session, protect requests against cross-site forgery, remember recovery state, and understand when a session expires.",
          "These cookies are not used to create an advertising profile or to sell personal information. Because they are necessary, blocking them can prevent sign-in and protected features from working.",
        ],
      },
      {
        id: "cookie-list",
        title: "2. Current cookie groups",
        items: [
          "Authentication and session: keeps an authenticated browser session active.",
          "Expiry: helps the application know when a session should be refreshed.",
          "Recovery: supports password-recovery and sign-in handoff flows for a limited time.",
          "Security: supports CSRF protection for browser requests.",
        ],
      },
      {
        id: "third-parties",
        title: "3. Providers and checkout",
        paragraphs: [
          "Paddle's hosted checkout and customer portal may set or read cookies under Paddle's own policies when you open those experiences. Review the notices shown by Paddle there.",
          "If we add optional analytics, advertising, or preference cookies, we will list them here and provide a consent control before using them where required.",
        ],
      },
      {
        id: "manage",
        title: "4. Managing cookies",
        paragraphs: [
          "You can delete or block cookies through your browser settings. Necessary cookies may be recreated when you return to sign in. Contact us if you need help with a privacy or cookie request.",
        ],
        links: [{ label: "Contact the CommitDiary team", href: "/contact" }],
      },
    ],
  },
  contact: {
    eyebrow: "Support and complaints",
    title: "A real person should be easy to reach.",
    description:
      "Use the shortest path for billing, account, privacy, or service questions. We will keep the request focused and avoid asking for secrets.",
    sections: [
      {
        id: "support",
        title: "Product and account support",
        paragraphs: [
          `Email ${supportEmail} for sign-in problems, account deletion, extension setup, service failures, or questions about a report. Include the account email and a useful reference, but never include a password, payment-card number, CVV, API key, or private repository content unless it is necessary and you are authorised to share it.`,
        ],
      },
      {
        id: "billing",
        title: "Billing and refunds",
        paragraphs: [
          "For a Paddle purchase, refund, invoice, payment-method, or subscription question, start with Paddle's buyer support. CommitDiary can help identify the relevant account or explain what the service should show.",
        ],
        links: [{ label: "Open Paddle buyer support", href: "https://paddle.net" }],
      },
      {
        id: "privacy",
        title: "Privacy requests",
        paragraphs: [
          `Email ${privacyEmail} to request access, correction, deletion, restriction, portability, or to object to optional processing. We may ask for reasonable identity verification before disclosing or changing personal data.`,
        ],
        links: [{ label: "Read the Privacy Notice", href: "/privacy" }],
      },
      {
        id: "complaints",
        title: "Complaints and escalation",
        paragraphs: [
          "Tell us what happened, when it happened, the account or transaction reference, and the outcome you want. We will acknowledge and investigate in a proportionate way. You may also use the relevant regulatory or court process available to you, including the FCCPC complaint portal where applicable.",
        ],
        links: [{ label: "FCCPC consumer complaint portal", href: fccpcComplaintUrl }],
      },
    ],
  },
};
