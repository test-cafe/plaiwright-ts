export const registerPayloads = [
  {
    label: 'invalid email format',
    input: { email: 'not-an-email', password: 'ValidPass123!', fullName: 'Test User' },
    expectedStatus: 400,
    expectedField: 'email',
  },
  {
    label: 'password too short',
    input: { email: 'valid@test.com', password: '123', fullName: 'Test User' },
    expectedStatus: 400,
    expectedField: 'password',
  },
  {
    label: 'missing fullName',
    input: { email: 'valid@test.com', password: 'ValidPass123!' },
    expectedStatus: 400,
    expectedField: 'fullName',
  },
  {
    label: 'valid registration',
    input: { email: 'newuser@test.com', password: 'ValidPass123!', fullName: 'New User' },
    expectedStatus: 200,
    expectedField: null,
  },
] as const;

export const searchPayloads = [
  { query: 'pepperoni', expectedMinCount: 0, expectedStatus: 200 },
  { query: '', expectedMinCount: 0, expectedStatus: 200 },
  { query: 'zzzznotexist', expectedMinCount: 0, expectedStatus: 200 },
  { query: '<script>alert(1)</script>', expectedMinCount: 0, expectedStatus: 200 },
  { query: "'; DROP TABLE products; --", expectedMinCount: 0, expectedStatus: 200 },
] as const;
