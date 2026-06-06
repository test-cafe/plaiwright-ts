const BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

function url(path: string, params?: Record<string, string | number>): string {
  const full = `${BASE}${path}`;
  if (!params || Object.keys(params).length === 0) return full;
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  ).toString();
  return `${full}?${qs}`;
}

export const urls = {
  // Cart
  cart: () => url('/api/cart'),
  cartItem: (id: number) => url(`/api/cart/${id}`),
  cartCheckout: () => url('/api/cart/checkout'),
  cartCheckoutCallback: () => url('/api/cart/checkout/callback'),

  // Auth
  authMe: () => url('/api/auth/me'),
  authRegister: () => url('/api/auth/register'),
  authSignin: () => url('/api/auth/signin'),
  authVerify: (code: string) => url('/api/auth/verify', { code }),
  authResetPassword: () => url('/api/auth/reset-password'),
  authForgotPassword: () => url('/api/auth/forgot-password'),

  // Products
  products: (query?: string) =>
    url('/api/products', query ? { query } : undefined),
  product: (id: number) => url(`/api/products/${id}`),

  // Ingredients
  ingredients: () => url('/api/ingredients'),

  // Stories
  stories: () => url('/api/stories'),

  // Upload
  uploadthing: () => url('/api/uploadthing'),
};
