export type FilterOption = {
  id: string;
  label: string;
};

export type FilterGroup = {
  id: string;
  title: string;
  options: readonly FilterOption[];
  layout?: 'row' | 'wrap';
};

export type Place = {
  id: string;
  title: string;
  region: string;
  visited: string;
  rating: number;
  image: string;
};
