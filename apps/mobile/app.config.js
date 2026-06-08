/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...require('./app.json').expo,
  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    },
  },
});
