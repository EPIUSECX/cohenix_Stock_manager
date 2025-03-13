export interface User {
  name: string;
  full_name: string;
  email: string;
}

export interface LoginResponse {
  message: {
    user: User;
  };
}