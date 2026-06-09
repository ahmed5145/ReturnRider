/** Merges app.json with env overrides (Expo doctor–compatible). */
module.exports = ({ config }) => {
  const EAS_PROJECT_ID =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? config.extra?.eas?.projectId;

  return {
    ...config,
    owner: 'ahmed5145',
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    extra: {
      ...config.extra,
      eas: {
        ...config.extra?.eas,
        projectId: EAS_PROJECT_ID,
      },
    },
  };
};
