// Adds the App Intents in plugins/capture-intent to the iOS app during
// prebuild: "Log an expense" for the Action Button (Settings › Action Button
// › Shortcut) and "Log payment" for the Apple Pay automation in Shortcuts.
// iOS only.
const fs = require('fs');
const path = require('path');
const {
  IOSConfig,
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
} = require('expo/config-plugins');

const SOURCE_DIR = path.join(__dirname, 'capture-intent');
const SOURCES = ['CaptureExpenseIntent.swift', 'LogPaymentIntent.swift'];
const STRINGS = 'AppIntents.xcstrings';
const FILES = [...SOURCES, STRINGS];
const LANGUAGES = fs
  .readdirSync(path.join(__dirname, '..', 'src/shared/i18n/locales'))
  .map((file) => path.basename(file, '.json'));

function withIntentFiles(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const target = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName,
      );
      for (const file of FILES)
        fs.copyFileSync(path.join(SOURCE_DIR, file), path.join(target, file));
      return config;
    },
  ]);
}

function withIntentInProject(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const group = config.modRequest.projectName;
    for (const swift of SOURCES) {
      if (project.hasFile(`${group}/${swift}`)) continue;
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath: `${group}/${swift}`,
        groupName: group,
        project,
      });
    }
    if (!project.hasFile(`${group}/${STRINGS}`)) {
      IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: `${group}/${STRINGS}`,
        groupName: group,
        project,
        isBuildFile: true,
      });
    }
    return config;
  });
}

// The shortcut title only shows in a language the app declares.
function withLocalizations(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.CFBundleLocalizations = LANGUAGES;
    return config;
  });
}

module.exports = function withCaptureIntent(config) {
  return withLocalizations(withIntentInProject(withIntentFiles(config)));
};
