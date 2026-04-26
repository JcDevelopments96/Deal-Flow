/* ============================================================================
   TERMS OF SERVICE — minimal but real ToS that gives Deal Docket legal teeth
   against scraping, reverse engineering, and reselling of API responses.

   NOT LEGAL ADVICE. Have a lawyer review before relying on this in a
   dispute. Treat this as a starting template, not a finished agreement.
   ============================================================================ */
import React from "react";
import { THEME } from "../theme.js";
import { isMobile } from "../utils.js";
import { Panel } from "../primitives.jsx";
import { Shield } from "lucide-react";

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 22 }}>
    <h2 style={{ fontSize: 16, fontWeight: 700, color: THEME.text, margin: "0 0 8px" }}>{title}</h2>
    <div style={{ fontSize: 13, color: THEME.textMuted, lineHeight: 1.65 }}>{children}</div>
  </div>
);

export const TermsView = () => {
  const lastUpdated = "2026-04-24";

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: isMobile() ? "16px" : "32px 28px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          Terms of Service
        </h1>
        <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 6 }}>
          Last updated: {lastUpdated}
        </div>
      </div>

      <Panel title="The short version" icon={<Shield size={16} />} accent style={{ marginBottom: 24 }}>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: THEME.textMuted, lineHeight: 1.7 }}>
          <li>Use Deal Docket to research and manage your own real-estate deals.</li>
          <li>Don't scrape, copy, or resell our data.</li>
          <li>Don't reverse engineer, decompile, or clone the app.</li>
          <li>You pay for the plan you signed up for; cancel any time, refunds are at our discretion.</li>
          <li>We provide Deal Docket "as is" — no guarantees about deal outcomes.</li>
        </ul>
      </Panel>

      <Section title="1. Acceptance of Terms">
        By creating an account or otherwise accessing Deal Docket ("the Service"),
        you agree to these Terms of Service. If you don't agree, don't use the
        Service.
      </Section>

      <Section title="2. Account & Eligibility">
        You must be at least 18 years old to use Deal Docket. You are responsible
        for keeping your login credentials secure and for all activity under
        your account. Notify us at the support email below if you suspect
        unauthorized access.
      </Section>

      <Section title="3. Acceptable Use">
        You agree NOT to:
        <ul style={{ marginTop: 6, paddingLeft: 20, lineHeight: 1.7 }}>
          <li><strong>Scrape or harvest data</strong> from any Deal Docket endpoint, page, or API response, whether by automated means or manual extraction at scale, except for your own personal use of search results within the application.</li>
          <li><strong>Resell, redistribute, or republish</strong> property listings, owner records, market data, or any other content obtained through Deal Docket, including derivative works built on top of it.</li>
          <li><strong>Reverse engineer, decompile, or attempt to derive the source code</strong> of any part of Deal Docket's frontend, backend, or proprietary algorithms (including but not limited to lead-scoring formulas, ranking logic, and aggregated market indexes).</li>
          <li><strong>Clone or imitate</strong> the visual design, brand, naming conventions, or product structure of Deal Docket for use in a competing product.</li>
          <li><strong>Bypass or interfere</strong> with rate limits, authentication, billing gates, or any technical measure used to protect the Service.</li>
          <li><strong>Use Deal Docket data for unlawful outreach</strong> — comply with CAN-SPAM, TCPA, the Do Not Call Registry, fair-housing laws, and applicable state regulations when contacting property owners.</li>
          <li><strong>Train AI/ML models</strong> on Deal Docket's content, data, or interface without our prior written consent.</li>
        </ul>
      </Section>

      <Section title="4. Subscriptions & Billing">
        Paid plans are billed monthly or annually in advance via Stripe. You
        can switch plans, update payment, or cancel from <strong>Plans →
        Manage billing</strong>. Cancellations take effect at the end of the
        current billing period; we don't pro-rate refunds for unused time.
        We may offer refunds at our discretion in cases of clear billing
        error or extended outage.
      </Section>

      <Section title="5. Third-Party Services">
        Deal Docket integrates with property data providers, mapping services,
        and outreach tools. Your use of features powered by these third
        parties is also governed by their own terms. We're not responsible
        for the accuracy, availability, or actions of any third-party
        provider — property records, valuation estimates, and short-term-
        rental projections are estimates supplied by the upstream source.
      </Section>

      <Section title="6. Intellectual Property">
        Deal Docket, the Deal Docket logo, the "Find Local Pros" feature, the
        Wholesale Lead Finder workflow, and all proprietary algorithms,
        designs, and content are the property of Deal Docket and protected by
        copyright and other applicable intellectual-property laws. We grant
        you a limited, non-exclusive, non-transferable license to use the
        Service for its intended purpose. No other rights are granted.
      </Section>

      <Section title="7. Disclaimers">
        Deal Docket is provided <strong>"as is"</strong> without warranties of
        any kind, express or implied. We do not guarantee deal outcomes,
        accuracy of third-party data, continuous availability, or that the
        Service will meet any specific investment goal. Real estate
        investing carries inherent risk. Always verify data independently
        before making a financial decision.
      </Section>

      <Section title="8. Limitation of Liability">
        To the fullest extent permitted by law, Deal Docket and its operators
        will not be liable for any indirect, incidental, special,
        consequential, or punitive damages arising out of your use of the
        Service. Our total liability for any direct damages is capped at the
        amount you paid us in the twelve months preceding the claim.
      </Section>

      <Section title="9. Termination">
        We may suspend or terminate your account if you violate these Terms,
        fail to pay, or use the Service in a way that creates legal or
        operational risk for us. You may stop using Deal Docket and delete
        your account at any time.
      </Section>

      <Section title="10. Changes to These Terms">
        We may update these Terms occasionally. Material changes will be
        announced via the app or email. Continuing to use Deal Docket after a
        change means you accept the updated Terms.
      </Section>

      <Section title="11. Governing Law">
        These Terms are governed by the laws of the United States and the
        State in which Deal Docket is headquartered, without regard to
        conflict-of-laws rules.
      </Section>

      <Section title="12. Contact">
        Questions, refund requests, takedown notices, or DMCA concerns:
        send a note to the support email listed on our marketing site.
      </Section>

      <div style={{
        marginTop: 32, padding: 14, background: THEME.bgPanel,
        border: `1px solid ${THEME.border}`, borderRadius: 8,
        fontSize: 11, color: THEME.textDim, lineHeight: 1.55
      }}>
        These Terms are a starting template. They have not been reviewed by
        a licensed attorney for your jurisdiction. Before relying on them in
        a dispute, have counsel review and adjust to your specific business
        and applicable law.
      </div>
    </div>
  );
};
