import React from 'react';
import { seoConfig } from '../../../seo/routeSeo';
import './CategoryGuide.css';

// Short guide text and FAQs for a category page (AEO plan, Step 3). The content lives in
// seo/routes.json under the page's route entry ("guide"), which the server also reads for the
// crawlable HTML and the FAQPage JSON-LD (Hiya2.Server/Seo/SeoPageRenderer.cs), so the visible text
// and the structured data always match. Nothing is shown until text is added.

interface GuideFaq {
  question: string;
  answer: string;
}

interface GuideData {
  heading?: string;
  paragraphs?: string[];
  faqs?: GuideFaq[];
}

interface CategoryGuideProps {
  /** The page's route path in seo/routes.json, e.g. "/mukhwas". */
  path: string;
}

const routes = seoConfig.routes as Array<{ path?: string; guide?: GuideData }>;

export const CategoryGuide: React.FC<CategoryGuideProps> = ({ path }) => {
  const guide = routes.find((r) => r.path === path)?.guide;
  const paragraphs = (guide?.paragraphs || []).filter((p) => p.trim() !== '');
  const faqs = (guide?.faqs || []).filter((f) => f.question.trim() !== '' && f.answer.trim() !== '');
  if (paragraphs.length === 0 && faqs.length === 0) return null;

  return (
    <section className="hiyaghar-category-guide" aria-label={guide?.heading || 'About this collection'}>
      <div className="hiyaghar-container">
        {paragraphs.length > 0 && (
          <div className="hiyaghar-category-guide-text">
            {guide?.heading && <h2>{guide.heading}</h2>}
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {faqs.length > 0 && (
          <div className="hiyaghar-category-guide-faqs">
            <h2>Frequently Asked Questions</h2>
            {/* <details>: the answers are always in the page HTML, only hidden until opened. */}
            {faqs.map((f, i) => (
              <details key={i} className="hiyaghar-category-guide-faq">
                <summary>
                  <h3>{f.question}</h3>
                </summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
