/// `GET /api/billing`（server/api/routes/billing.ts）。
class Billing {
  const Billing({
    required this.plan,
    required this.status,
    required this.currentPeriodEnd,
    required this.comped,
    required this.billingLive,
    required this.manageable,
  });

  /// "free" か "premium"。
  final String plan;
  final String status;
  final String? currentPeriodEnd;

  /// 管理者付与。支払いは発生しない。
  final bool comped;

  /// Stripe の設定が入っているか。未設定なら課金導線を出さない。
  final bool billingLive;

  /// 既に顧客レコードがあり、ポータルを開けるか。
  final bool manageable;

  bool get isPremium => plan == 'premium';

  factory Billing.fromJson(Map<String, dynamic> json) => Billing(
        plan: json['plan'] as String? ?? 'free',
        status: json['status'] as String? ?? 'none',
        currentPeriodEnd: json['currentPeriodEnd'] as String?,
        comped: json['comped'] as bool? ?? false,
        billingLive: json['billingLive'] as bool? ?? false,
        manageable: json['manageable'] as bool? ?? false,
      );
}
