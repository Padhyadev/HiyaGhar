import { useEffect, useState } from 'react';
import { CategoryService } from '../../../services/categoryService';
import type { ApiCategory } from '../../../services/categoryService';

export const getCategorySlug = (categoryName: string) => {
  const nameLower = categoryName.toLowerCase();
  if (nameLower.includes('mukhwas') || nameLower.includes('mukhwash')) return 'mukhwas';
  if (nameLower.includes('tea')) return 'tea-masala';
  if (nameLower.includes('soap')) return 'handmade-soap';
  if (nameLower.includes('hair')) return 'hair-oil';
  return '';
};

export const useSidebarCategories = () => {
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const cats = await CategoryService.getCategories();
      const topCats = cats.filter((c) => {
        const name = c.categoryName.toLowerCase();
        return name.includes('mukhwas') || name.includes('mukhwash') || name.includes('tea') || name.includes('soap') || name.includes('hair');
      }).slice(0, 4);
      setCategories(topCats);
    };

    fetchData();
  }, []);

  return categories;
};
