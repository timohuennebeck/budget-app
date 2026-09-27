import AppIntents
import Foundation

// "Looop: Zahlung erfassen" for the Shortcuts "Transaction" automation
// (Wallet, iOS 17+): Amount and Merchant come from the Apple Pay payment.
// Runs in the background without opening the app and only notes the payment
// in Documents/wallet-payments.json; the app turns pending payments into
// drafts to confirm the next time it opens (src/features/wallet).

@available(iOS 16.0, *)
struct LogPaymentIntent: AppIntent {
  static var title: LocalizedStringResource = LocalizedStringResource("payment.title", table: "AppIntents")
  static var description = IntentDescription(LocalizedStringResource("payment.description", table: "AppIntents"))
  static var openAppWhenRun: Bool = false

  @Parameter(title: LocalizedStringResource("payment.amount", table: "AppIntents"))
  var amount: IntentCurrencyAmount

  @Parameter(title: LocalizedStringResource("payment.merchant", table: "AppIntents"))
  var merchant: String?

  func perform() async throws -> some IntentResult & ProvidesDialog {
    try WalletInbox.append(
      amount: NSDecimalNumber(decimal: amount.amount).doubleValue,
      currency: amount.currencyCode,
      merchant: merchant?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    )
    return .result(dialog: IntentDialog(LocalizedStringResource("payment.saved", table: "AppIntents")))
  }
}

/// Pending payments, oldest first. The app reads and clears the file.
enum WalletInbox {
  private struct Payment: Codable {
    let id: String
    let amount: Double
    let currency: String
    let merchant: String
    let date: String
  }

  private static var url: URL {
    FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("wallet-payments.json")
  }

  static func append(amount: Double, currency: String, merchant: String) throws {
    guard amount > 0 else { return }
    var payments: [Payment] = []
    if let data = try? Data(contentsOf: url) {
      payments = (try? JSONDecoder().decode([Payment].self, from: data)) ?? []
    }
    payments.append(Payment(
      id: UUID().uuidString.lowercased(),
      amount: amount,
      currency: currency,
      merchant: merchant,
      date: ISO8601DateFormatter().string(from: Date())
    ))
    try JSONEncoder().encode(payments).write(to: url, options: .atomic)
  }
}
