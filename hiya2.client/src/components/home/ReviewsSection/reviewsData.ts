export interface Review {
  id: string;
  customerName: string;
  rating: number;
  review: string;
  productName?: string;
  verified?: boolean;
  location?: string;
  date?: string;
}

export const reviewsData: Review[] = [
  {
    id: 'rev-1',
    customerName: 'Priya S.',
    rating: 5,
    review:
      'The Jamun bottle and Aavla mukhwas have become an absolute daily essential in our household. The authentic taste and quality are unmatched!',
    productName: 'Organic Jamun Mukhwas',
    verified: true,
    location: 'Mumbai',
    date: '2 days ago',
  },
  {
    id: 'rev-2',
    customerName: 'Anish M.',
    rating: 5,
    review:
      'Hiya Tea Masala brings back the exact comforting aroma of homemade chai spices. You can tell every ingredient is chosen with genuine care.',
    productName: 'Royal Spice Tea Masala',
    verified: true,
    location: 'Ahmedabad',
    date: '1 week ago',
  },
  {
    id: 'rev-3',
    customerName: 'Kavita R.',
    rating: 5,
    review:
      'Gifted the festive hamper to my family for Diwali and everyone was blown away. Gorgeous packaging and pure nostalgic flavors!',
    productName: 'Luxury Festive Hamper',
    verified: true,
    location: 'Bengaluru',
    date: '2 weeks ago',
  },
  {
    id: 'rev-4',
    customerName: 'Rohan K.',
    rating: 5,
    review:
      'The herbal soap feels so gentle and natural on the skin. Love how Hiya brings traditional heritage ingredients into our modern daily routine.',
    productName: 'Herbal Healing Soap',
    verified: true,
    location: 'Delhi',
    date: '3 weeks ago',
  },
  {
    id: 'rev-5',
    customerName: 'Meera D.',
    rating: 5,
    review:
      'Superb quality products and fast shipping! The digestive mukhwas is crisp, delightfully fresh, and perfectly balanced after every meal.',
    productName: 'Aavla Mukhwas',
    verified: true,
    location: 'Pune',
    date: '1 month ago',
  },
  {
    id: 'rev-6',
    customerName: 'Vikram T.',
    rating: 5,
    review:
      'The organic hair oil is pure magic. Lightweight, non-sticky, and deeply nourishing. My hair feels noticeably healthier within 2 weeks.',
    productName: 'Nourishing Herbal Hair Oil',
    verified: true,
    location: 'Jaipur',
    date: '1 month ago',
  },
  {
    id: 'rev-7',
    customerName: 'Sneha P.',
    rating: 5,
    review:
      'The Salted Gotli is addictive in the best way possible! Clean, traditional preparation that tastes like grandmother’s kitchen.',
    productName: 'Salted Gotli Mukhwas',
    verified: true,
    location: 'Surat',
    date: '2 months ago',
  },
];
