export interface BentoItemData {
  id: string;
  image: string;
  imageAlt: string;
  title: string;
  category: string;
  eyebrow: string;
  gridClass: string;
  href?: string;
}

export const homeMomentsData: BentoItemData[] = [
  {
    id: 'moment-1',
    image: '/image/lifestyle_kitchen.webp',
    imageAlt: 'Hiya organic mukhwas ready for daily snacking',
    title: 'A Little Bite of Heritage',
    category: 'Daily Goodness',
    eyebrow: 'Heritage',
    gridClass: 'bento-pos-1',
    href: '#our-story',
  },
  {
    id: 'moment-2',
    image: '/image/lifestyle_postmeal.webp',
    imageAlt: 'Hiya organic Jamun bottle in a clean kitchen setting',
    title: 'Post-Meal Freshness',
    category: 'Kitchen Essential',
    eyebrow: 'Freshness',
    gridClass: 'bento-pos-2',
    href: '#our-story',
  },
  {
    id: 'moment-3',
    image: '/image/lifestyle_festive.webp',
    imageAlt: 'Hiya festive delicacies shared among family and friends',
    title: 'Festive Delicacies & Shared Smiles',
    category: 'Festive Moments',
    eyebrow: 'Celebration',
    gridClass: 'bento-pos-3',
    href: '#our-story',
  },
  {
    id: 'moment-4',
    image: '/image/lifestyle_chai.webp',
    imageAlt: 'Aromatic tea masala brewed for afternoon tea time',
    title: 'The Perfect Chai Ritual',
    category: 'Tea Time',
    eyebrow: 'Ritual',
    gridClass: 'bento-pos-4',
    href: '#our-story',
  },
  {
    id: 'moment-5',
    image: '/image/lifestyle_bath.webp',
    imageAlt: 'Natural handmade soap for gentle daily self care',
    title: 'Nourishing Botanical Bath',
    category: 'Self Care',
    eyebrow: 'Wellness',
    gridClass: 'bento-pos-5',
    href: '#our-story',
  },
  {
    id: 'moment-6',
    image: '/image/lifestyle_hair.webp',
    imageAlt: 'Herbal hair oil with natural traditional ingredients',
    title: 'Traditional Hair Care',
    category: 'Everyday Care',
    eyebrow: 'Protection',
    gridClass: 'bento-pos-6',
    href: '#our-story',
  },
];
