export interface ProductImage {
  url: string;
  _id?: string;
}

export interface ProductLocation {
  name: string;
  longitude: number;
  latitude: number;
}

export interface ProductUser {
  username?: string;
  email: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: {url: string};
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: ProductImage[];
  location?: ProductLocation;
  user?: ProductUser;
  createdAt?: string;
  updatedAt?: string;
}
