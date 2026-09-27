// Adds the "Log an expense" App Intent (plugins/capture-intent) to the iOS
// app during prebuild, so it can be assigned to the Action Button in
// Settings › Action Button › Shortcut. iOS only; Android has no Action Button.
const fs = require('fs');
const path = require('path');
const {
  IOSConfig,
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
} = require('expo/config-plugins');

const SOURCE_DIR = path.join(__dirname, 'capture-intent');
const FILES = ['CaptureExpenseIntent.swift', 'AppIntents.xcstrings'];
const LANGUAGES = ['en', 'de', 'es', 'fr', 'it', 'pt', 'pt-BR'];

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
    const [swift, strings] = FILES;
    if (!project.hasFile(`${group}/${swift}`)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath: `${group}/${swift}`,
        groupName: group,
        project,
      });
    }
    if (!project.hasFile(`${group}/${strings}`)) {
      IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: `${group}/${strings}`,
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
