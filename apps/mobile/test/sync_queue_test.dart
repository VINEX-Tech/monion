import 'package:flutter_test/flutter_test.dart';
import 'package:monion_mobile/features/offline/sync_queue.dart';

class MemoryStore implements DurableQueueStore {
  final List<QueueItem> items = [];
  final List<String> delivered = [];
  final List<String> failed = [];

  @override
  Future<void> insertIfAbsent(QueueItem item) async {
    if (items.every((i) => i.idempotencyKey != item.idempotencyKey)) {
      items.add(item);
    }
  }

  @override
  Future<List<QueueItem>> pending({int limit = 100}) async => items
      .where((i) => !delivered.contains(i.idempotencyKey))
      .take(limit)
      .toList();

  @override
  Future<void> markDelivered(String idempotencyKey) async =>
      delivered.add(idempotencyKey);

  @override
  Future<void> markFailed(String idempotencyKey) async =>
      failed.add(idempotencyKey);
}

class FakeTransport implements SyncTransport {
  FakeTransport({this.failOn});
  final String? failOn;
  final List<String> sent = [];

  @override
  Future<void> send(QueueItem item) async {
    if (item.idempotencyKey == failOn) throw StateError('offline');
    sent.add(item.idempotencyKey);
  }
}

QueueItem item(String key) => QueueItem(
    idempotencyKey: key,
    kind: QueueKind.attendance,
    payload: const {'direction': 'IN'},
    createdAt: DateTime.utc(2026, 10, 1));

void main() {
  test('delivers pending items in order', () async {
    final store = MemoryStore();
    for (final key in ['a', 'b', 'c']) {
      await store.insertIfAbsent(item(key));
    }
    final transport = FakeTransport();
    await QueueDrainer(store, transport).drain();
    expect(transport.sent, ['a', 'b', 'c']);
    expect(store.delivered, ['a', 'b', 'c']);
  });

  test('stops at the first failure to keep ordering', () async {
    final store = MemoryStore();
    for (final key in ['a', 'b', 'c']) {
      await store.insertIfAbsent(item(key));
    }
    final transport = FakeTransport(failOn: 'b');
    await QueueDrainer(store, transport).drain();
    expect(store.delivered, ['a']);
    expect(store.failed, ['b']);
    expect(transport.sent, ['a']);
  });

  test('the same idempotency key is queued once', () async {
    final store = MemoryStore();
    await store.insertIfAbsent(item('a'));
    await store.insertIfAbsent(item('a'));
    expect(store.items, hasLength(1));
  });
}
