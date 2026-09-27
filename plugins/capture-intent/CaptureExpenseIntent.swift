import AppIntents
import UIKit

// "Looop: Ausgabe erfassen" for the Action Button, Shortcuts and Siri. Opens
// the app on looop://capture/voice, which starts voice capture. Added to the
// iOS project by plugins/with-capture-intent.js; texts in AppIntents.xcstrings.

@available(iOS 16.0, *)
struct CaptureExpenseIntent: AppIntent {
  static var title: LocalizedStringResource = LocalizedStringResource("capture.title", table: "AppIntents")
  static var description = IntentDescription(LocalizedStringResource("capture.description", table: "AppIntents"))
  static var openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult {
    if let url = URL(string: "looop://capture/voice") {
      await UIApplication.shared.open(url)
    }
    return .result()
  }
}

@available(iOS 17.0, *)
struct LooopShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: CaptureExpenseIntent(),
      phrases: ["\(.applicationName)", "Log an expense in \(.applicationName)"],
      shortTitle: LocalizedStringResource("capture.short", table: "AppIntents"),
      systemImageName: "mic.fill"
    )
  }
}
