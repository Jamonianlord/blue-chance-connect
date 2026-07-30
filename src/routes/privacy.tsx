import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy - 1Chance" },
      { name: "description", content: "Read the Privacy Policy for 1Chance" },
    ],
  }),
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-invert dark:prose-invert max-w-none">
          <h1>1Chance - Privacy Policy</h1>
          <p><strong>Last updated: July 29, 2026</strong></p>
          <p>This Privacy Policy explains how 1Chance ("we," "us," "our") collects, uses, stores, and shares information when you use the 1Chance app (the "Service"). By using 1Chance, you consent to the practices described here. If you do not agree, do not use the Service.</p>
          <hr />
          <h2>1. Information We Collect</h2>
          <p><strong>1.1 Information you provide directly:</strong></p>
          <ul>
            <li>Account/registration details (e.g., email, password, stated gender, interests/tags)</li>
            <li>Profile photos you upload</li>
            <li>Messages and photos you send within chats</li>
            <li>Reports you submit about other users</li>
          </ul>
          <p><strong>1.2 Information collected automatically:</strong></p>
          <ul>
            <li>Presence data (online/offline status, last-seen timestamps)</li>
            <li>Device and usage data (approximate technical logs such as IP address, browser/app version, and error logs) collected via our hosting and backend providers</li>
            <li>Push notification subscription details (endpoint, encryption keys) if you opt in to notifications</li>
          </ul>
          <p><strong>1.3 Information we do not intentionally collect:</strong> We do not knowingly collect government ID numbers, financial/payment information, or precise real-time GPS location.</p>
          <hr />
          <h2>2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Operate core features - account creation, gender-based random matching, real-time chat, and photo sharing;</li>
            <li>Maintain presence and "online now" indicators for matching purposes;</li>
            <li>Send push notifications you''ve opted into (e.g., "someone matching your preference is online");</li>
            <li>Investigate reports, enforce our Terms and Conditions, and take safety or moderation action (including reviewing reported chat content or photos);</li>
            <li>Maintain, secure, and improve the Service, including diagnosing technical issues;</li>
            <li>Comply with legal obligations or respond to lawful requests from authorities.</li>
          </ul>
          <p><strong>We do not sell your personal information to third parties, and we do not use your chat content or photos for advertising or profiling purposes.</strong></p>
          <hr />
          <h2>3. Legal Basis / Consent</h2>
          <p>By registering for and using 1Chance, you consent to the collection and processing of your information as described in this Policy, to the extent required under applicable Nigerian data protection law (including the Nigeria Data Protection Act) or other applicable law.</p>
          <hr />
          <h2>4. How We Store and Share Information</h2>
          <p><strong>4.1 Storage.</strong> Data (including account records, messages, photos, and presence data) is stored using our backend infrastructure provider (Supabase) and our hosting provider (Cloudflare). Photos are stored in access-controlled storage with signed, time-limited URLs rather than public links.</p>
          <p><strong>4.2 Sharing with other users.</strong> By design, your profile information, photos you upload to a chat, and messages you send are shared with the specific user you are matched or chatting with. This is a core function of the Service, not a third-party disclosure, and you acknowledge this when you use the Service.</p>
          <p><strong>4.3 Service providers.</strong> We may share limited data with infrastructure and service providers (e.g., hosting, database, push-notification delivery) solely to operate the Service. These providers are not authorized to use your data for their own purposes.</p>
          <p><strong>4.4 Legal disclosure.</strong> We may disclose information if required by law, court order, or governmental request, or where we believe in good faith that disclosure is necessary to protect the rights, safety, or property of 1Chance, our users, or the public - including in response to a harassment, abuse, or safety report.</p>
          <p><strong>4.5 Business transfers.</strong> If 1Chance is involved in a merger, acquisition, investment, or sale of assets, user information may be transferred as part of that transaction, subject to this Policy (or a policy at least as protective).</p>
          <hr />
          <h2>5. Data Retention</h2>
          <p><strong>5.1</strong> We retain your account data for as long as your account is active.</p>
          <p><strong>5.2</strong> Reported content, block/report records, and related account data may be retained for a reasonable period after deletion for safety, dispute-resolution, fraud-prevention, or legal-compliance purposes, as described in our Terms and Conditions.</p>
          <p><strong>5.3</strong> You may request deletion of your account at any time; see Section 7 below.</p>
          <hr />
          <h2>6. Your Choices</h2>
          <ul>
            <li><strong>Notifications:</strong> You may opt out of push notifications at any time through your device settings or in-app controls.</li>
            <li><strong>Profile information:</strong> You may update your profile, photo, and interests at any time.</li>
            <li><strong>Blocking:</strong> You may block any user, which prevents further matching or contact with that user.</li>
          </ul>
          <hr />
          <h2>7. Your Rights and Account Deletion</h2>
          <p>Subject to applicable law, you may:</p>
          <ul>
            <li>Request access to the personal information we hold about you;</li>
            <li>Request correction of inaccurate information;</li>
            <li>Request deletion of your account and associated personal information, subject to our right to retain limited records as described in Section 5.2 and our Terms and Conditions;</li>
            <li>Withdraw consent to processing, which may result in suspension or termination of your ability to use the Service.</li>
          </ul>
          <p>To exercise these rights, contact us at <strong>support@1chance.online</strong>. We may take reasonable steps to verify your identity before acting on a request.</p>
          <hr />
          <h2>8. Children''s Privacy</h2>
          <p>1Chance is not directed at, and may not be used by, anyone under 18 years old. We do not knowingly collect information from anyone under 18. If we learn that we have collected information from a user under 18, we will delete the account and associated data.</p>
          <hr />
          <h2>9. Security</h2>
          <p>We use reasonable technical and organizational measures (such as access-controlled storage and signed URLs for media) to protect your information. However, <strong>no method of transmission or storage is 100% secure</strong>, and we cannot guarantee absolute security. You share information with other users, and ultimately with us, at your own risk.</p>
          <hr />
          <h2>10. International Users</h2>
          <p>Our infrastructure providers may store or process data outside Nigeria. By using the Service, you consent to the transfer and processing of your information in jurisdictions that may have different data protection laws than your own.</p>
          <hr />
          <h2>11. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time at our sole discretion. We will update the "Last updated" date above. Continued use of the Service after changes are posted constitutes acceptance of the revised Policy.</p>
          <hr />
          <h2>12. Contact Us</h2>
          <p>Questions about this Privacy Policy or requests regarding your data should be sent to <strong>support@1chance.online</strong>.</p>
          <hr />
          <p><em>By using 1Chance, you acknowledge that you have read and understood this Privacy Policy.</em></p>
        </div>
      </main>
    </div>
  );
}
