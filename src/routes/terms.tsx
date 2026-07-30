import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms and Conditions - 1Chance" },
      { name: "description", content: "Read the Terms and Conditions for 1Chance" },
    ],
  }),
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-invert dark:prose-invert max-w-none">
          <h1>1Chance - Terms and Conditions</h1>
          <p><strong>Last updated: July 29, 2026</strong></p>
          <p>Please read these Terms and Conditions ("Terms") carefully before using 1Chance (the "Service," "App," "we," "us," or "our"). By creating an account, accessing, or using 1Chance in any way, you ("User," "you") agree to be legally bound by these Terms. If you do not agree, do not use the Service.</p>
          <hr />
          <h2>1. Eligibility</h2>
          <p>1.1 You must be at least <strong>18 years old</strong> to create an account or use 1Chance. By registering, you represent and warrant that you are 18 or older and that you have the legal capacity to enter into these Terms.</p>
          <p>1.2 We reserve the right to request age or identity verification at any time and to suspend or terminate any account where we reasonably believe this requirement has been violated, without liability to you.</p>
          <p>1.3 You may not use the Service if you have previously been banned or removed from 1Chance, or if you are barred from using such services under applicable law.</p>
          <hr />
          <h2>2. Description of the Service</h2>
          <p>2.1 1Chance is a platform that randomly matches registered users with other users (based on stated gender preference and any other matching criteria we may introduce) for real-time text chat, and may allow the sharing of photos and other content within a chat.</p>
          <p>2.2 We do not select, vet, or verify who you are matched with. <strong>All interactions with other users are at your own risk.</strong> We do not conduct criminal background checks, identity verification, or any other screening of users beyond what is expressly stated in these Terms.</p>
          <p>2.3 We may modify, suspend, or discontinue any part of the Service (including specific features such as matching, chat, photo sharing, or notifications) at any time, with or without notice, and without liability to you.</p>
          <hr />
          <h2>3. Your Account</h2>
          <p>3.1 You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.</p>
          <p>3.2 You agree to provide accurate information during registration and to keep it up to date. We are not liable for any loss arising from your failure to do so.</p>
          <p>3.3 You may not create more than one account, impersonate any person or entity, or misrepresent your identity, age, or gender.</p>
          <hr />
          <h2>4. User Conduct</h2>
          <p>By using 1Chance, you agree that you will <strong>not</strong>:</p>
          <ul>
            <li>Harass, threaten, abuse, stalk, intimidate, or defame any other user;</li>
            <li>Send, upload, or share any content that is sexually explicit, obscene, pornographic, violent, hateful, discriminatory, or otherwise unlawful;</li>
            <li>Share another person''s private information without consent ("doxxing");</li>
            <li>Use the Service to solicit money, gifts, or any commercial transaction (including romance-scam or "sugar" solicitations);</li>
            <li>Use the Service for any illegal purpose, including exploitation or endangerment of minors;</li>
            <li>Attempt to circumvent, disable, reverse-engineer, scrape, or interfere with the Service, its matching algorithm, or its security features;</li>
            <li>Use bots, scripts, or automated means to access or interact with the Service;</li>
            <li>Upload any content that infringes the intellectual property or other rights of any third party;</li>
            <li>Distribute malware, spam, or unsolicited advertising through the chat feature.</li>
          </ul>
          <p>We reserve the sole and absolute discretion to determine what constitutes a violation of this section.</p>
          <hr />
          <h2>5. Content and Reporting</h2>
          <p>5.1 <strong>User Content.</strong> Any messages, photos, or other material you send through 1Chance ("User Content") remain your responsibility. You are solely liable for the User Content you share.</p>
          <p>5.2 <strong>License to us.</strong> By submitting User Content, you grant 1Chance a worldwide, non-exclusive, royalty-free, sublicensable license to host, store, transmit, reproduce, and display that content solely for the purpose of operating, securing, and improving the Service (e.g., displaying it to your matched chat partner, storing it for moderation/safety review, or processing an abuse report).</p>
          <p>5.3 <strong>No obligation to monitor.</strong> We are not obligated to monitor, review, or moderate chats or content in real time, but we reserve the right to do so, including for safety, legal compliance, or dispute-resolution purposes, and to remove content or suspend accounts at our sole discretion.</p>
          <p>5.4 <strong>Reporting and blocking.</strong> The Service provides tools to block and report other users. Submitting a report does not guarantee any specific outcome or response time. We may act on, decline to act on, or investigate a report at our sole discretion, and we are under no obligation to disclose the outcome of any investigation to the reporting user.</p>
          <p>5.5 We may retain copies of reported content and account data for as long as reasonably necessary for safety, legal, or compliance purposes, even after account deletion.</p>
          <hr />
          <h2>6. Intellectual Property</h2>
          <p>6.1 The 1Chance name, logo, design, software, and underlying technology are the exclusive property of 1Chance (or its licensors) and are protected by applicable intellectual property laws.</p>
          <p>6.2 You are granted a limited, non-exclusive, non-transferable, revocable license to use the Service for personal, non-commercial use, subject to these Terms. No other rights are granted.</p>
          <p>6.3 You may not copy, modify, distribute, sell, lease, or reverse-engineer any part of the Service without our prior written consent.</p>
          <hr />
          <h2>7. Disclaimers</h2>
          <p>7.1 <strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED</strong>, including but not limited to warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy, or that the Service will be uninterrupted, secure, or error-free.</p>
          <p>7.2 We do not warrant or guarantee the identity, intentions, age, conduct, or character of any user you are matched with. <strong>You interact with other users entirely at your own risk.</strong></p>
          <p>7.3 We are not responsible for any offline meetings, arrangements, or relationships that result from use of the Service. We strongly discourage sharing personal contact information or meeting matched users in person, and any decision to do so is made entirely at your own discretion and risk.</p>
          <p>7.4 <strong>Assumption of Risk.</strong> You expressly acknowledge and agree that using a platform that matches you with strangers carries inherent risks, including but not limited to exposure to offensive, false, or harassing content or behavior, impersonation, fraud, and - in the event of any offline contact or meeting - risk of physical or emotional harm. <strong>You voluntarily and knowingly assume all such risks</strong> as a condition of using the Service.</p>
          <p>7.5 <strong>Release.</strong> To the maximum extent permitted by applicable law, you hereby release 1Chance, its founders, employees, contractors, and affiliates from any and all claims, demands, and damages of any kind, known or unknown, arising out of or in any way connected with disputes, conduct, or interactions between you and any other user of the Service, whether occurring on the Service or offline. <strong>This release does not apply to claims arising from our own gross negligence, willful misconduct, or fraud, to the extent such a limitation is required by applicable law.</strong></p>
          <hr />
          <h2>8. Limitation of Liability</h2>
          <p>8.1 To the maximum extent permitted by applicable law, 1Chance, its founders, employees, contractors, and affiliates shall <strong>not be liable</strong> for any indirect, incidental, special, consequential, exemplary, or punitive damages, including but not limited to loss of data, loss of profits, emotional distress, or damages arising from your interactions with other users, whether based in contract, tort, negligence, strict liability, or otherwise, even if we have been advised of the possibility of such damages.</p>
          <p>8.2 To the maximum extent permitted by applicable law, our total aggregate liability to you for any and all claims arising out of or relating to the Service, whether in one incident or a series of related incidents, shall not exceed the greater of <strong>(a) the amount you paid us in the twelve (12) months preceding the claim, or (b) NGN 5,000</strong>, given that the Service is provided free of charge to most users. This cap applies even if a remedy fails of its essential purpose.</p>
          <p>8.3 <strong>Class Action and Jury Trial Waiver.</strong> To the maximum extent permitted by applicable law, you agree that any claim against 1Chance will be brought only in your individual capacity, and not as a plaintiff or class member in any purported class, collective, or representative proceeding. You further waive any right to a jury trial in connection with any dispute arising out of these Terms, to the extent such a waiver is permitted by applicable law.</p>
          <p>8.4 Some jurisdictions do not allow certain limitations of liability, so some of the above limitations may not apply to you to the extent prohibited by law; in such cases, our liability shall be limited to the minimum extent permitted by law.</p>
          <hr />
          <h2>9. Indemnification</h2>
          <p>You agree to indemnify, defend, and hold harmless 1Chance and its founders, employees, contractors, and affiliates from and against any and all claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in any way connected with: (a) your use of the Service; (b) your User Content; (c) your violation of these Terms; or (d) your interactions with any other user, including any offline meeting or communication.</p>
          <hr />
          <h2>10. Suspension and Termination</h2>
          <p>10.1 We reserve the right, in our sole discretion and without prior notice or liability, to suspend, restrict, or permanently terminate your account and access to the Service at any time, for any reason or no reason, including but not limited to a suspected violation of these Terms.</p>
          <p>10.2 We may also remove or restrict access to any content at any time.</p>
          <p>10.3 You may delete your account at any time. Sections of these Terms that by their nature should survive termination (including Sections 5.5, 6, 7, 8, 9, 11, and 12) will survive.</p>
          <p>10.4 We are not liable to you or any third party for suspension, restriction, or termination of your account.</p>
          <hr />
          <h2>11. Governing Law and Dispute Resolution</h2>
          <p>11.1 These Terms are governed by and construed in accordance with the laws of the <strong>Federal Republic of Nigeria</strong>, without regard to conflict-of-law principles.</p>
          <p>11.2 Any dispute arising out of or relating to these Terms or the Service shall first be attempted to be resolved informally by contacting us at <strong>support@1chance.online</strong>.</p>
          <p>11.3 If a dispute cannot be resolved informally, you agree that it shall be submitted to binding arbitration (or the courts of Lagos, Nigeria, if arbitration is not adopted) and that you waive any right to participate in a class action or class-wide arbitration.</p>
          <hr />
          <h2>12. Changes to These Terms</h2>
          <p>We may update these Terms from time to time at our sole discretion. We will indicate the "Last updated" date above. Continued use of the Service after changes are posted constitutes your acceptance of the revised Terms. If you do not agree to the changes, you must stop using the Service.</p>
          <hr />
          <h2>13. Miscellaneous</h2>
          <p>13.1 <strong>Entire Agreement.</strong> These Terms, along with our Privacy Policy, constitute the entire agreement between you and 1Chance regarding the Service.</p>
          <p>13.2 <strong>Severability.</strong> If any provision of these Terms is found unenforceable, the remaining provisions will remain in full force and effect.</p>
          <p>13.3 <strong>No Waiver.</strong> Our failure to enforce any right or provision of these Terms shall not be deemed a waiver of such right or provision.</p>
          <p>13.4 <strong>Assignment.</strong> You may not assign or transfer these Terms without our prior written consent. We may assign these Terms without restriction.</p>
          <p>13.5 <strong>Contact.</strong> Questions about these Terms should be sent to <strong>support@1chance.online</strong>.</p>
          <hr />
          <p><em>By tapping "I agree," creating an account, or otherwise using 1Chance, you confirm that you have read, understood, and agree to be bound by these Terms and Conditions.</em></p>
        </div>
      </main>
    </div>
  );
}
