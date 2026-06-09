/** @type {import('expo/config').ExpoConfig} */
const base = require('./app.json').expo;

// Env overrides app.json; app.json is written by `eas init` (account ahmed5145).
const EAS_PROJECT_ID =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? base.extra?.eas?.projectId;

module.exports = () => ({
  ...base,
  owner: 'ahmed5145',
  ios: {
    ...base.ios,
    infoPlist: {
      ...base.ios?.infoPlist,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  extra: {
    ...base.extra,
    eas: {
      ...base.extra?.eas,
      projectId: EAS_PROJECT_ID,
    },
  },
});
