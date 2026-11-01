import 'dart:async';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:monion_mobile/features/scanner/scan_pipeline.dart';

FrameSample frame(
        {double sharpness = .9,
        double glare = .05,
        double brightness = .6,
        int id = 0}) =>
    FrameSample(
        bytes: Uint8List.fromList([id]),
        timestamp: DateTime.utc(2026, 10, 1, 7, 30, id),
        sharpness: sharpness,
        glare: glare,
        brightness: brightness);

class FakeRecognizer implements NativeRecognizer {
  ScanCandidate? university;
  ScanCandidate? national;
  ScanCandidate? ocrResult;
  final List<int> seenFrames = [];
  final List<int> ocrFrames = [];
  Completer<void>? gate;

  @override
  Future<ScanCandidate?> barcode(FrameSample frame,
      {required bool universityOnly}) async {
    if (universityOnly) {
      seenFrames.add(frame.bytes.first);
      if (gate != null) await gate!.future;
    }
    return universityOnly ? university : national;
  }

  @override
  Future<ScanCandidate?> ocr(FrameSample frame) async {
    ocrFrames.add(frame.bytes.first);
    return ocrResult;
  }
}

class FakeRoster implements OfflineRoster {
  FakeRoster(this.ids);
  final Set<String> ids;
  final List<String> lookups = [];

  @override
  Future<bool> containsHashedIdentifier(String normalizedIdentifier) async {
    lookups.add(normalizedIdentifier);
    return ids.contains(normalizedIdentifier);
  }
}

void main() {
  late FakeRecognizer recognizer;
  late FakeRoster roster;
  late ScanPipeline pipeline;

  setUp(() {
    recognizer = FakeRecognizer();
    roster = FakeRoster({'U0001', '29001010101234'});
    pipeline = ScanPipeline(recognizer, roster);
  });

  group('quality hints', () {
    test('flags dark, glare and blur in that order', () {
      expect(pipeline.qualityHint(frame(brightness: .1, glare: .5)),
          QualityHint.tooDark);
      expect(pipeline.qualityHint(frame(glare: .3, sharpness: .1)),
          QualityHint.removeGlare);
      expect(pipeline.qualityHint(frame(sharpness: .2)), QualityHint.holdSteady);
      expect(pipeline.qualityHint(frame()), isNull);
    });

    test('a poor frame is not sent to the recognizer', () async {
      expect(await pipeline.offer(frame(brightness: .05)), isNull);
      expect(recognizer.seenFrames, isEmpty);
    });
  });

  test('accepts a university QR that is on the roster, normalized', () async {
    recognizer.university =
        const ScanCandidate(' u 0001 ', ScanSource.universityQr, .99);
    final result = await pipeline.offer(frame());
    expect(result?.identifier, 'U0001');
    expect(result?.source, ScanSource.universityQr);
    expect(roster.lookups, ['U0001']);
  });

  test('falls back to the national ID barcode when the QR is not trusted',
      () async {
    recognizer.university =
        const ScanCandidate('U0001', ScanSource.universityQr, .90);
    recognizer.national = const ScanCandidate(
        '29001010101234', ScanSource.nationalIdBarcode, .97);
    final result = await pipeline.offer(frame());
    expect(result?.identifier, '29001010101234');
    expect(result?.source, ScanSource.nationalIdBarcode);
  });

  test('rejects identifiers that are not on the offline roster', () async {
    recognizer.university =
        const ScanCandidate('U9999', ScanSource.universityQr, .99);
    expect(await pipeline.offer(frame()), isNull);
  });

  test('runs OCR on the sharpest recent frame as the last resort', () async {
    roster.ids.add('OCR42');
    recognizer.ocrResult = const ScanCandidate('ocr42', ScanSource.ocr, .97);
    await pipeline.offer(frame(sharpness: .2, id: 1)); // blurry, remembered
    await pipeline.offer(frame(sharpness: .95, id: 2));
    final result = await pipeline.offer(frame(sharpness: .6, id: 3));
    expect(recognizer.ocrFrames.last, 2);
    expect(result?.identifier, 'OCR42');
    expect(result?.source, ScanSource.ocr);
  });

  test('drops intermediate frames while busy and processes the newest',
      () async {
    recognizer.gate = Completer<void>();
    final first = pipeline.offer(frame(id: 1));
    expect(await pipeline.offer(frame(id: 2)), isNull);
    expect(await pipeline.offer(frame(id: 3)), isNull);
    recognizer.gate!.complete();
    expect(await first, isNull);
    expect(recognizer.seenFrames, [1, 3]);
  });
}
