export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  category: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
};