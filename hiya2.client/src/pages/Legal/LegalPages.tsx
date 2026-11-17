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
            At <strong>Hiya Ghar</strong> (accessible at <code>hiyaghar.com</code>), we hold customer privacy and transparency as fundamental values. This Privacy Policy describes in comprehensive detail how your personal data is collected, stored, processed, and safeguarded when you visit our website, register an account, or order handcrafted natural foods and wellness products.
          </p>

          <h2>1. Information We Collect</h2>
          <p>We only collect information necessary to fulfill your orders and deliver exceptional customer service:</p>
          <ul>
            <li><strong>Personal Identifiers:</strong> Your full name, delivery shipping address, billing address, phone/WhatsApp number, and email address.</li>
            <li><strong>Account Credentials:</strong> If you register an account, we securely store your encrypted password hash, saved delivery addresses, and wishlist items.</li>
            <li><strong>Transaction & Order Records:</strong> Details regarding purchased products, total order amounts, offers applied, and delivery status.</li>
            <li><strong>Gift Details:</strong> If you send an order as a gift, the recipient's name and phone number, and for personalised gifts the photo and message you add. These are used only to prepare and print your gift insert, and are stored privately.</li>
            <li><strong>Device & Browsing Insights:</strong> IP address, browser type, device information, and pages visited, gathered solely to optimize site speed and prevent fraudulent attempts.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We process your data strictly for legitimate operational purposes:</p>
          <ul>
            <li>To assemble, pack, and deliver your handmade mukhwas, tea masalas, or gifting packages.</li>
            <li>To send your order confirmation by email and to contact you by phone or WhatsApp about your delivery.</li>
            <li>To process verified payments through RBI-compliant secure gateways.</li>
            <li>To provide prompt customer support via email or WhatsApp regarding modifications or inquiries.</li>
            <li>To maintain your account discounts and personalized offers (with full opt-out available).</li>
          </ul>

          <h2>3. Payment Security & Data Protection</h2>
          <p>
            We do <strong>NOT</strong> collect, view, or store your credit/debit card numbers, CVVs, UPI PINs, or net banking passwords. All online payments are handled directly by PCI-DSS compliant, RBI-authorized payment processor Razorpay, protected under 256-bit TLS bank-grade encryption.
          </p>

          <h2>4. Cookies & Website Analytics</h2>
          <p>
            Our website uses essential browser storage to remember your shopping cart items, wishlist, active login status, and gift choices. We do not sell, rent, or trade your personal information or browsing data to any third-party advertisers.
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
            <p><strong>Hiya Ghar</strong></p>
            <p>Email: <a href={`mailto:${storeSettings.contactEmail || 'hiyaghar@gmail.com'}`} style={{ color: 'inherit', textDecoration: 'underline' }}>{storeSettings.contactEmail || 'hiyaghar@gmail.com'}</a></p>
            <p>Phone / WhatsApp: <a href={`tel:${storeSettings.contactPhone || '+91 92744 43617'}`} style={{ color: 'inherit', textDecoration: 'underline' }}>{storeSettings.contactPhone || '+91 92744 43617'}</a></p>
            <p>Operating Address: {storeSettings.contactAddress || '303, APM Mall Complex, Near Bharat Petrol Pump, Sattadhar Cross Road, Ghatlodiya Ahmedabad 380061, Gujarat, India'}</p>
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
            All Hiya Ghar digestives, mukhwas recipes, spice masalas, cold-process soaps, and hair oils are handcrafted in small batches, and the full ingredients of every product are listed on its product page. All our mukhwas are tobacco-free and supari-free. Because of natural harvesting variations, slight natural variations in seed size, color tone, or botanical aroma may occur across batches, which is a hallmark of authentic handcrafted products.
          </p>

          <h2>2. Pricing, Invoicing & Taxes</h2>
          <ul>
            <li>All product prices are quoted in Indian Rupees (INR) and are inclusive of all applicable Goods and Services Tax (GST).</li>
            <li>We reserve the right to revise prices or offer promotional voucher discounts at our discretion.</li>
            <li>In the event of an inadvertent pricing error, we reserve the right to notify you and cancel or adjust the order before dispatch.</li>
          </ul>

          <h2>3. Orders, Dispatch & Delivery Acceptance</h2>
          <p>
            Upon order placement, you will receive an automated order confirmation by email. We currently deliver only to selected pin codes around Ghatlodiya, Ahmedabad; deliverability is checked at checkout. Hiya Ghar reserves the right to decline or cancel orders due to non-serviceable pin codes, fraudulent suspicions, or inventory stock-outs. Customers are responsible for providing complete, accurate shipping addresses and contact phone numbers for seamless doorstep handover.
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
            <li><strong>Before Dispatch:</strong> You may cancel your order anytime before it is shipped, from <a href="/orders">My Account → Orders</a> or by contacting our support team with your Order ID. You will receive a 100% full refund with zero deductions.</li>
            <li><strong>After Dispatch:</strong> Once an order has been shipped or is out for delivery, it can no longer be cancelled.</li>
          </ul>

          <h2>2. Damaged, Defective, or Incorrect Package Replacement</h2>
          <p>
            We use multilayer protective packaging to ensure every glass jar and pouch reaches you in pristine condition. However, if your order arrives damaged or with missing items:
          </p>
          <ul>
            <li>Notify our customer care team within <strong>48 hours</strong> of package delivery.</li>
            <li>Provide clear photos/unboxing video of the parcel and the affected items along with your Order ID.</li>
            <li>Our team will immediately arrange a <strong>free replacement</strong> on priority, or initiate a full refund.</li>
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
            <p>Email: <a href={`mailto:${storeSettings.contactEmail || 'hiyaghar@gmail.com'}`}>{storeSettings.contactEmail || 'hiyaghar@gmail.com'}</a></p>
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
            At <strong>Hiya Ghar</strong>, we treat every order like a fresh gift prepared with care, and deliver it safely to your doorstep in tamper-evident packaging.
          </p>

          <h2>1. Delivery Area</h2>
          <p>
            We currently deliver only to selected pin codes around Ghatlodiya, Ahmedabad (about 5 km from our kitchen). Enter your pin code at checkout to confirm that we deliver to your address. We are working to reach more areas soon.
          </p>

          <h2>2. Delivery Charges & Free Delivery</h2>
          <ul>
            {storeSettings.enableFreeShipping && (
              <li><strong>Free Delivery:</strong> All orders with a final price (after discount) of <strong>₹{storeSettings.freeShippingThreshold || 500}</strong> or above qualify for free delivery.</li>
            )}
            <li><strong>Delivery Fee:</strong> Flat <strong>₹{storeSettings.standardShippingPrice ?? 49}</strong>{storeSettings.enableFreeShipping ? <> on orders below ₹{storeSettings.freeShippingThreshold || 500}</> : null}.</li>
          </ul>

          <h2>3. Order Processing & Delivery Time</h2>
          <ul>
            <li><strong>Handling & Dispatch:</strong> Every order is freshly prepared, sealed and packed after it is placed, then dispatched for delivery. We do not offer same-day dispatch.</li>
            <li><strong>Delivery Time:</strong> Usually takes <strong>{storeSettings.standardDeliveryDays || '3–5 business days'}</strong> from the order date.</li>
          </ul>

          <h2>4. Order Status</h2>
          <p>
            You will receive an email confirming your order as soon as it is placed. You can see your order status, and delivery details once your order is shipped, anytime in <a href="/orders">My Account → Orders</a>.
          </p>

          <h2>5. Tamper-Evident & Weatherproof Packaging</h2>
          <p>
            Our natural food products are packed inside premium, moisture-barrier jars with protective safety shrink-bands and cushioned outer corrugated boxes to maintain authentic flavor, crunch, and complete freshness until they reach you.
          </p>

          <h2>6. Non-Delivery & Address Issues</h2>
          <p>
            Please provide a complete address and keep your phone number reachable so we can coordinate the delivery with you. If we cannot reach you or deliver to the address given, we will contact you to arrange another delivery.
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
    {(storeSettings) => (
      <>
        <p>
          We are always delighted to hear from our customers, patrons, and gifting partners.
        </p>

        <div className="hiyaghar-trust-badge-card">
          <h2>Hiya Ghar Customer Support</h2>
          <p>
            <strong>Customer Care & WhatsApp:</strong>{' '}
            <a href={`tel:${storeSettings.contactPhone || '+91 92744 43617'}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
              {storeSettings.contactPhone || '+91 92744 43617'}
            </a>{' '}
            (
            <a
              href={`https://wa.me/${(storeSettings.contactPhone || '919274443617').replace(/[^0-9]/g, '')}?text=Hello%20HiyaGhar,%20I%20have%20an%20inquiry.`}
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
            <a href={`mailto:${storeSettings.contactEmail || 'hiyaghar@gmail.com'}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
              {storeSettings.contactEmail || 'hiyaghar@gmail.com'}
            </a>
          </p>
          <p><strong>Operating Hours:</strong> Monday – Saturday (10:00 AM – 7:00 PM IST)</p>
          <p><strong>Operating Address:</strong> {storeSettings.contactAddress || '303, APM Mall Complex, Near Bharat Petrol Pump, Sattadhar Cross Road, Ghatlodiya Ahmedabad 380061, Gujarat, India'}</p>
          {storeSettings.enableFssaiDisplay && storeSettings.fssaiLicenseNumber && (
            <p><strong>FSSAI Registration / Lic No:</strong> {storeSettings.fssaiLicenseNumber}</p>
          )}
        </div>
      </>
    )}
  </StaticLegalPage>
);

export const OurStoryPage: React.FC = () => (
  <StaticLegalPage
    title="Our Story"
    metaDescription="Discover the heritage, passion, and natural ingredients behind Hiya Ghar handcrafted mukhwas, chai masalas, and wellness products."
  >
    {(storeSettings) => (
      <>
        <p>
          <strong>Hiya Ghar</strong> was born from a deep love for timeless Indian tradition, authentic culinary heritage, and pure, wholesome ingredients.
        </p>

        <h2>Our Heritage & Philosophy</h2>
        <p>
          In every Indian home, a meal is never truly complete without a comforting post-meal digestive. Our handcrafted mukhwas, aromatic royal chai spices, and artisan personal care products are prepared in small batches using time-honored traditional techniques.
        </p>

        <h2>100% Handcrafted & Natural</h2>
        <p>
          Every blend is roasted, mixed, and packed in small batches to preserve its natural aromas, essential digestive oils, and maximum freshness. We source only premium-grade whole spices, natural seeds, and real botanical extracts.
        </p>

        <div className="hiyaghar-trust-badge-card">
          <h2>Certified Purity & Quality</h2>
          <p><strong>Brand:</strong> Hiya Ghar</p>
          <p><strong>Origin:</strong> Ahmedabad, Gujarat, India</p>
          {storeSettings.enableFssaiDisplay && storeSettings.fssaiLicenseNumber && (
            <p><strong>FSSAI Registration / Lic No:</strong> {storeSettings.fssaiLicenseNumber}</p>
          )}
          <p><strong>Support Email:</strong> {storeSettings.contactEmail || 'hiyaghar@gmail.com'}</p>
        </div>
      </>
    )}
  </StaticLegalPage>
);

