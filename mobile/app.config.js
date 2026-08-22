const appJson = require('./app.json');

const app = appJson.expo;

module.exports = {
  ...app,
  ios: {
    ...app.ios,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_INFO_PLIST || app.ios.googleServicesFile,
  },
  android: {
    ...app.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON || app.android.googleServicesFile,
  },
};
