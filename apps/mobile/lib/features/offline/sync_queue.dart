enum QueueKind { trip, attendance, gpsBatch, recordingMetadata, safetyEvent }

class QueueItem {
  const QueueItem(
      {required this.idempotencyKey,
      required this.kind,
      required this.payload,
      required this.createdAt,
      this.attempts = 0});
  final String idempotencyKey;
  final QueueKind kind;
  final Map<String, Object?> payload;
  final DateTime createdAt;
  final int attempts;
}

abstract interface class DurableQueueStore {
  Future<void> insertIfAbsent(QueueItem item);
  Future<List<QueueItem>> pending({int limit = 100});
  Future<void> markDelivered(String idempotencyKey);
  Future<void> markFailed(String idempotencyKey);
}

abstract interface class SyncTransport {
  Future<void> send(QueueItem item);
}

class QueueDrainer {
  QueueDrainer(this.store, this.transport);
  final DurableQueueStore store;
  final SyncTransport transport;

  Future<void> drain() async {
    for (final item in await store.pending()) {
      try {
        await transport.send(item);
        await store.markDelivered(item.idempotencyKey);
      } catch (_) {
        await store.markFailed(item.idempotencyKey);
        break; // preserve ordering and avoid battery-expensive retry storms
      }
    }
  }
}
