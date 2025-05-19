export interface User {
  id?: string;
  email: string; // Notice this is required (not optional)
  firstName?: string;
  lastName?: string;
  name?: string; // First name + last name combined, for convenience
  phoneNumber?: string;
  profileImage?: string | {url: string};
  isEmailVerified?: boolean;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
