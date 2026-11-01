import 'package:flutter_test/flutter_test.dart';
import 'package:monion_mobile/main.dart';

void main() {
  testWidgets('scanner renders its privacy state', (tester) async {
    await tester.pumpWidget(const MonionApp());
    expect(find.text('MONION'), findsOneWidget);
    expect(find.text('Scan values stay on this device'), findsOneWidget);
  });
}
