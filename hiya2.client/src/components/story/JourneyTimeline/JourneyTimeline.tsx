import React from 'react';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import './JourneyTimeline.css';

const STEPS = [
  {
    title: 'A home kitchen in Ahmedabad',
    text: 'It began with family recipes, made the way we always made them at home.',
  },
  {
    title: 'Jars for friends & family',
    text: 'The first jars went to people we love. They kept asking for more.',
  },
  {
    title: 'Our first mukhwas range',
    text: 'Word spread, the orders grew, and the hobby became HIYA Ghar.',
  },
  {
    title: 'The growing HIYA family',
    text: 'Tea masala, handmade soap, Ayurvedic hair oil and gift hampers joined the mukhwas.',
  },
];

/** Our Story: four steps of the brand's journey. Horizontal on desktop, vertical on phones. */
export const JourneyTimeline: React.FC = () => {
  return (
    <section className="hg-journey-section" aria-labelledby="hg-journey-heading">
      <div className="hg-story-container">
        <ScrollReveal variant="fade-up" className="hg-journey-header">
          <span className="hg-section-label">OUR JOURNEY</span>
          <h2 id="hg-journey-heading" className="hg-section-heading">From one kitchen to many homes</h2>
        </ScrollReveal>

        <ol className="hg-journey-list">
          {STEPS.map((step, i) => (
            <li key={step.title} className="hg-journey-step">
              <ScrollReveal variant="fade-up" delay={i * 120} className="hg-journey-step-inner">
                <span className="hg-journey-number" aria-hidden="true">{i + 1}</span>
                <div className="hg-journey-body">
                  <h3 className="hg-journey-title">{step.title}</h3>
                  <p className="hg-journey-text">{step.text}</p>
                </div>
              </ScrollReveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
