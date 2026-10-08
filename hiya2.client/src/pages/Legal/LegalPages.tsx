import React from 'react';
import { StaticLegalPage } from './StaticLegalPage';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <StaticLegalPage
      title="Privacy Policy"
      metaDescription="Read the Privacy Policy of Hiya Ghar. Learn how we protect your personal data, customer accounts, and order transactions."
      activeSlug="/privacy-policy"
    >
      {(storeSettings) => (
        <>
          <p>
            At <strong>Hiya Ghar</strong> (operated under Padhya Software Technologies / Hiya Enterprises and accessible at <code>hiyaghar.com</code>), we hold customer privacy and transparency as fundamental values. This Privacy Policy describes in comprehensive detail how your personal data is collected, stored, processed, and safeguarded when you visit our website, register an account, or order handcrafted natural foods and wellness products.
          </p>

          <h2>1. Information We Collect</h2>
          <p>We only collect information necessary to fulfill your orders and deliver exceptional customer service:</p>
          <ul>
            <li><strong>Personal Identifiers:</strong> Your full name, delivery shipping address, billing address, phone/WhatsApp number, and email address.</li>
            <li><strong>Account Credentials:</strong> If you register an account, we securely store your encrypted password hash, saved delivery addresses, wishlist items, and reward coin balance.</li>
            <li><strong>Transaction & Order Records:</strong> Details regarding purchased products, total order amounts, coupon codes applied, and shipping tracking numbers.</li>
            <li><strong>Device & Browsing Insights:</strong> IP address, browser type, device information, and pages visited, gathered solely to optimize site speed and prevent fraudulent attempts.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We process your data strictly for legitimate operational purposes:</p>
          <ul>
            <li>To assemble, pack, and ship your handmade mukhwas, tea masalas, or gifting packages.</li>
            <li>To send SMS, WhatsApp, and email order confirmation, dispatch alerts, and live courier tracking links.</li>
            <li>To process verified payments through RBI-compliant secure gateways.</li>
            <li>To provide prompt customer support via email or WhatsApp regarding modifications or inquiries.</li>
            <li>To maintain your reward points, account discounts, and personalized offers (with full opt-out available).</li>
          </ul>

          <h2>3. Payment Security & Data Protection</h2>
          <p>
            We do <strong>NOT</strong> collect, view, or store your credit/debit card numbers, CVVs, UPI PINs, or net banking passwords. All online payments are handled directly by PCI-DSS compliant, RBI-authorized payment processors (such as Razorpay / Cashfree) protected under 256-bit TLS bank-grade encryption.
          </p>

          <h2>4. Cookies & Website Analytics</h2>
          <p>
            Our website uses essential session cookies to remember your shopping cart items, active login status, and customized combo builder choices. We do not sell, rent, or trade your personal information or browsing data to any third-party advertisers.
          </p>

          <h2>5. Data Retention & Your Rights</h2>
          <p>
            You have the full right to access, correct, or request the deletion of your personal account data at any time. You can update your saved addresses and password directly in your <a href="/profile">Account Profile</a> or reach out to our grievance officer.
          </p>

          <h2>6. Grievance Redressal & Contact Information</h2>
          <p>
            For any privacy inquiries, data removal requests, or clarifications regarding our privacy practices, please contact us:
          </p>
          <div className="hiyaghar-trust-badge-card">
            <p><strong>Hiya Ghar (Padhya Software Technologies / Hiya Enterprises)</strong></p>
            <p>Email: <a href={`mailto:${storeSettings.contactEmail || 'support@hiyaghar.com'}`} style={{ color: 'inherit', textDecoration: 'underline' }}>{storeSettings.contactEmail || 'support@hiyaghar.com'}</a></p>
            <p>Phone / WhatsApp: <a href={`tel:${storeSettings.contactPhone || '+91 92744 43617'}`} style={{ color: 'inherit', textDecoration: 'underline' }}>{storeSettings.contactPhone || '+91 92744 43617'}</a></p>
            <p>Operating Address: {storeSettings.contactAddress || 'Ahmedabad, Gujarat, India - 380015'}</p>
            {storeSettings.enableFssaiDisplay && Boolean(storeSettings.fssaiLicenseNumber?.trim()) && (
              <p>FSSAI Registration / Lic No: <strong>{storeSettings.fssaiLicenseNumber}</strong></p>
            )}
          </div>
        </>
      )}
    </StaticLegalPage>
  );
};

export const TermsConditionsPage: React.FC = () => {
  return (
    <StaticLegalPage
      title="Terms & Conditions"
      metaDescription="Terms and Conditions governing the use of Hiya Ghar website and purchase of handmade food items."
      activeSlug="/terms-conditions"
    >
      {(storeSettings) => (
        <>
          <p>
            Welcome to <strong>Hiya Ghar</strong>. By browsing, creating an account, or placing an order on <code>hiyaghar.com</code>, you agree to be bound by the following Terms and Conditions, which represent a binding agreement between you and Hiya Ghar.
          </p>

          <h2>1. Artisanal Product Authenticity & Natural Variations</h2>
          <p>
            All Hiya Ghar digestives, mukhwas recipes, spice masalas, cold-process soaps, and hair oils are handcrafted in small batches using 100% natural, honest ingredients without synthetic artificial colors or preservatives. Because of natural harvesting variations, slight natural variations in seed size, color tone, or botanical aroma may occur across batches, which is a hallmark of authentic handcrafted products.
          </p>

          <h2>2. Pricing, Invoicing & Taxes</h2>
          <ul>
            <li>All product prices are quoted in Indian Rupees (INR) and are inclusive of all applicable Goods and Services Tax (GST).</li>
            <li>We reserve the right to revise prices or offer promotional voucher discounts at our discretion.</li>
            <li>In the event of an inadvertent pricing error, we reserve the right to notify you and cancel or adjust the order before dispatch.</li>
          </ul>

          <h2>3. Orders, Dispatch & Delivery Acceptance</h2>
          <p>
            Upon order placement, you will receive an immediate automated invoice acknowledgement. Hiya Ghar reserves the right to decline or cancel orders due to non-serviceable pin codes, fraudulent suspicions, or inventory stock-outs. Customers are responsible for providing complete, accurate shipping addresses and contact phone numbers for seamless doorstep handover.
          </p>

          <h2>4. Intellectual Property Rights</h2>
          <p>
            All brand names, logos, custom illustrations, packaging designs, product descriptions, recipe formulations, and visual imagery on this website are the proprietary intellectual property of Hiya Ghar. Unauthorized reproduction or commercial re-use is strictly prohibited.
          </p>

          <h2>5. Food Safety & Hygiene Commitment</h2>
          <p>
            We manufacture, blend, and package our edible food products adhering to stringent hygiene practices, using food-grade materials and verified processes.
          </p>
          {storeSettings.enableFssaiDisplay && Boolean(storeSettings.fssaiLicenseNumber?.trim()) && (
            <div className="hiyaghar-trust-badge-card">
              <p><strong>FSSAI Certified Brand:</strong> Licensed under FSSAI Registration Number <strong>{storeSettings.fssaiLicenseNumber}</strong>.</p>
            </div>
          )}

          <h2>6. Governing Law & Jurisdiction</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with orders shall be subject to the exclusive jurisdiction of the courts located in Ahmedabad, Gujarat, India.
          </p>
        </>
      )}
    </StaticLegalPage>
  );
};

export const RefundPolicyPage: React.FC = () => {
  return (
    <StaticLegalPage
      title="Refund & Cancellation Policy"
      metaDescription="Review Hiya Ghar refund, replacement, and cancellation rules for damaged or incorrect deliveries."
      activeSlug="/refund-policy"
    >
      {(storeSettings) => (
        <>
          <p>
            At <strong>Hiya Ghar</strong>, customer satisfaction and trust are at the heart of our kitchen. Because we craft natural food items, our return and refund policy is designed to be transparent, fair, and prompt.
          </p>

          <h2>1. Order Cancellation Policy</h2>
          <ul>
            <li><strong>Before Dispatch:</strong> You may request order cancellation anytime before the parcel is picked up by our courier partner by contacting our support team with your Order ID. You will receive a 100% full refund with zero deductions.</li>
            <li><strong>After Dispatch:</strong> Once an order is handed over to logistics partners and assigned an AWB tracking number, in-transit cancellations cannot be accepted.</li>
          </ul>

          <h2>2. Damaged, Defective, or Incorrect Package Replacement</h2>
          <p>
            We use multilayer protective packaging to ensure every glass jar and pouch reaches you in pristine condition. However, if your order arrives damaged or with missing items:
          </p>
          <ul>
            <li>Notify our customer care team within <strong>48 hours</strong> of package delivery.</li>
            <li>Provide clear photos/unboxing video of the parcel and the affected items along with your Order ID.</li>
            <li>Our team will immediately arrange a <strong>free replacement shipment</strong> with express priority dispatch, or initiate a full refund.</li>
          </ul>

          <h2>3. Non-Returnable Items (Food & Personal Hygiene)</h2>
          <p>
            In accordance with Indian food safety regulations and hygiene standards, edible consumable goods (mukhwas, chai masalas) and opened personal care soaps/oils cannot be returned for restock once the safety seal has been opened, unless damaged in transit.
          </p>

          <h2>4. Refund Timelines & Settlement Method</h2>
          <ul>
            <li><strong>Prepaid Orders (UPI / Debit / Credit Cards / NetBanking):</strong> Approved refunds are credited directly back to the original payment source within <strong>5–7 business days</strong>.</li>
            <li><strong>Cash on Delivery (COD) Orders:</strong> Refunds are transferred via direct NEFT / IMPS or UPI after confirming the customer's bank account or UPI ID.</li>
          </ul>

          <h2>5. How to Initiate a Support Request</h2>
          <p>
            Reach out to our friendly support team for immediate resolution:
          </p>
          <div className="hiyaghar-trust-badge-card">
            <p>Email: <a href={`mailto:${storeSettings.contactEmail || 'support@hiyaghar.com'}`}>{storeSettings.contactEmail || 'support@hiyaghar.com'}</a></p>
            <p>WhatsApp / Call: <a href={`https://wa.me/${(storeSettings.contactPhone || '919274443617').replace(/[^0-9]/g, '')}`}>{storeSettings.contactPhone || '+91 92744 43617'}</a></p>
            <p>Support Timings: Monday – Saturday (10:00 AM – 7:00 PM IST)</p>
          </div>
        </>
      )}
    </StaticLegalPage>
  );
};

export const ShippingPolicyPage: React.FC = () => {
  return (
    <StaticLegalPage
      title="Shipping & Delivery Policy"
      metaDescription="Check Hiya Ghar shipping delivery timelines, courier partners, and free delivery thresholds."
      activeSlug="/shipping-policy"
    >
      {(storeSettings) => (
        <>
          <p>
            At <strong>Hiya Ghar</strong>, we treat every order like a fresh gift prepared with care. We partner with India’s top logistics providers including Blue Dart, Delhivery, DTDC, and India Post to deliver safe, tamper-evident packages across the nation.
          </p>

          <h2>1. Shipping Rates & Free Delivery Threshold</h2>
          <ul>
            <li><strong>Free Standard Delivery:</strong> All orders with a cart subtotal of <strong>₹{storeSettings.freeShippingThreshold || 500}</strong> or above qualify for 100% Free Standard Shipping across India.</li>
            <li><strong>Standard Shipping Fee:</strong> Flat <strong>₹{storeSettings.standardShippingPrice ?? 40}</strong> on orders below ₹{storeSettings.freeShippingThreshold || 500}.</li>
            {storeSettings.enableExpressDelivery && (
              <li><strong>Express Delivery Option:</strong> Flat <strong>₹{storeSettings.expressShippingPrice ?? 99}</strong> for expedited priority air transit where serviceable.</li>
            )}
          </ul>

          <h2>2. Order Processing & Transit Timelines</h2>
          <ul>
            <li><strong>Handling & Dispatch Time:</strong> Orders placed before 1:00 PM IST are prepared, fresh-sealed, and dispatched on the same business day. Orders placed after 1:00 PM or on Sundays/Public Holidays are dispatched the next business day.</li>
            <li><strong>Standard Transit Time:</strong> Usually takes <strong>{storeSettings.standardDeliveryDays || '3–5 business days'}</strong> depending on regional pin code connectivity.</li>
            <li><strong>Express Air Delivery:</strong> Delivered within <strong>{storeSettings.expressDeliveryDays || '1–2 business days'}</strong> across major metro hubs.</li>
            <li><strong>Ahmedabad Local Deliveries:</strong> Delivered within 24 to 48 hours directly from our local kitchen.</li>
          </ul>

          <h2>3. Real-Time Tracking & Notifications</h2>
          <p>
            The moment your order is packed and dispatched, you will receive an SMS and Email containing your courier partner name and unique AWB Tracking Number. You can track your parcel's live journey anytime on our <a href="/track-order">Live Order Tracking</a> page.
          </p>

          <h2>4. Tamper-Evident & Weatherproof Packaging</h2>
          <p>
            Our natural food products are packed inside premium, moisture-barrier jars with protective safety shrink-bands and cushioned outer corrugated boxes to maintain authentic flavor, crunch, and complete freshness during all transit conditions.
          </p>

          <h2>5. Non-Delivery & Address Issues</h2>
          <p>
            Couriers will attempt delivery up to 3 times before returning the parcel. Please ensure your contact phone number is reachable to receive courier OTPs and delivery coordination calls.
          </p>
        </>
      )}
    </StaticLegalPage>
  );
};

export const ContactUsPage: React.FC = () => (
  <StaticLegalPage
    title="Contact Us"
    metaDescription="Get in touch with Hiya Ghar for customer support, custom corporate gifting hampers, or wholesale inquiries."
  >
    <p>
      We are always delighted to hear from our customers, patrons, and gifting partners.
    </p>

    <div className="hiyaghar-trust-badge-card">
      <h2>Hiya Ghar Customer Support</h2>
      <p>
        <strong>Customer Care & WhatsApp:</strong>{' '}
        <a href="tel:+919274443617" style={{ color: 'inherit', textDecoration: 'underline' }}>
          +91 92744 43617
        </a>{' '}
        (
        <a
          href="https://wa.me/919274443617?text=Hello%20HiyaGhar,%20I%20have%20an%20inquiry."
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#10b981', fontWeight: 600 }}
        >
          Chat on WhatsApp
        </a>
        )
      </p>
      <p>
        <strong>Support Email:</strong>{' '}
        <a href="mailto:support@hiyaghar.com" style={{ color: 'inherit', textDecoration: 'underline' }}>
          support@hiyaghar.com
        </a>
      </p>
      <p><strong>Operating Hours:</strong> Monday – Saturday (10:00 AM – 7:00 PM IST)</p>
      <p><strong>Operating Address:</strong> Ahmedabad, Gujarat, India - 380015</p>
      <p><strong>FSSAI Registration / Lic No:</strong> 10723026001148</p>
    </div>
  </StaticLegalPage>
);

export const OurStoryPage: React.FC = () => (
  <StaticLegalPage
    title="Our Story"
    metaDescription="Discover the heritage, passion, and natural ingredients behind Hiya Ghar handcrafted mukhwas, chai masalas, and wellness products."
  >
    <p>
      <strong>Hiya Ghar</strong> was born from a deep love for timeless Indian tradition, authentic culinary heritage, and pure, wholesome ingredients.
    </p>

    <h2>Our Heritage & Philosophy</h2>
    <p>
      In every Indian home, a meal is never truly complete without a comforting post-meal digestive. Our handcrafted mukhwas, aromatic royal chai spices, and artisan personal care products are prepared using time-honored traditional techniques without artificial preservatives or synthetic chemicals.
    </p>

    <h2>100% Handcrafted & Natural</h2>
    <p>
      Every blend is roasted, mixed, and packed in small batches to preserve its natural aromas, essential digestive oils, and maximum freshness. We source only premium-grade whole spices, natural seeds, and real botanical extracts.
    </p>

    <div className="hiyaghar-trust-badge-card">
      <h2>Certified Purity & Quality</h2>
      <p><strong>Brand:</strong> Hiya Ghar (Hiya Enterprises)</p>
      <p><strong>Origin:</strong> Ahmedabad, Gujarat, India</p>
      <p><strong>FSSAI Registration / Lic No:</strong> 10723026001148</p>
      <p><strong>Support Email:</strong> support@hiyaghar.com</p>
    </div>
  </StaticLegalPage>
);

