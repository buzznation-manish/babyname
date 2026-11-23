export interface NameFilters { search: string; gender: string; category: string }

export function parseNameFilters(query: Record<string, string | string[] | undefined>): NameFilters {
  return {
    search: typeof query.search === 'string' ? query.search.trim().slice(0, 200) : '',
    gender: typeof query.gender === 'string' && ['BOY', 'GIRL', 'UNISEX'].includes(query.gender) ? query.gender : '',
    category: typeof query.category === 'string' ? query.category.trim().slice(0, 80) : '',
  };
}
