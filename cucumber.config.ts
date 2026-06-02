const config = {
  paths: ['tests/features/**/*.feature'],
  require: ['tests/e2e/step-definitions/**/*.ts'],
  requireModule: ['ts-node/register'],
  format: ['progress', 'html:cucumber-report.html'],
  parallel: 1,
  worldParameters: {
    baseUrl: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
  },
};

export default config;
