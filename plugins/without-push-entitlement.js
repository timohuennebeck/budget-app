// Free Apple accounts (personal teams) can't sign the Push Notifications
// capability. With LOOOP_FREE_SIGNING=1 the aps-environment entitlement that
// expo-notifications adds is left out, so the app builds and installs; push
// notifications then don't arrive on that build. Paid accounts leave it unset.
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
  if (process.env.LOOOP_FREE_SIGNING !== '1') return config;
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    return config;
  });
};
