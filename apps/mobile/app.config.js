/** @type {import('expo/config').ExpoConfig} */
const base = require('./app.json').expo;

const EAS_PROJECT_ID =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? 'aa737750-09c8-4cf8-969c-121feefc9597';

module.exports = () => ({
  ...base,
  owner: 'ahmedm1',
  extra: {
    ...base.extra,
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
});
