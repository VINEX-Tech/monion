import 'dart:collection';
import 'dart:typed_data';

enum ScanSource { universityQr, nationalIdBarcode, ocr }

enum QualityHint { holdSteady, moveCloser, removeGlare, tooDark }

class FrameSample {
  const FrameSample(
      {required this.bytes,
      required this.timestamp,
      required this.sharpness,
      required this.glare,
      required this.brightness});
  final Uint8List bytes;
  final DateTime timestamp;
  final double sharpness;
  final double glare;
  final double brightness;
}

class ScanCandidate {
  const ScanCandidate(this.identifier, this.source, this.confidence);
  final String identifier;
  final ScanSource source;
  final double confidence;
}

abstract interface class NativeRecognizer {
  Future<ScanCandidate?> barcode(FrameSample frame,
      {required bool universityOnly});
  Future<ScanCandidate?> ocr(FrameSample frame);
}

abstract interface class OfflineRoster {
  Future<bool> containsHashedIdentifier(String normalizedIdentifier);
}

/// Backpressure-aware pipeline: while processing, one newer frame replaces the
/// pending frame. Raw images are never retained or emitted as telemetry.
class ScanPipeline {
  ScanPipeline(this._recognizer, this._roster, {this.minimumConfidence = .96});
  final NativeRecognizer _recognizer;
  final OfflineRoster _roster;
  final double minimumConfidence;
  final Queue<FrameSample> _sharpFrames = Queue();
  FrameSample? _latest;
  bool _processing = false;

  Future<ScanCandidate?> offer(FrameSample frame) async {
    _latest = frame;
    if (_processing) return null;
    _processing = true;
    try {
      while (_latest != null) {
        final current = _latest!;
        _latest = null;
        _remember(current);
        if (qualityHint(current) != null) continue;

        final university =
            await _recognizer.barcode(current, universityOnly: true);
        final acceptedUniversity = await _validate(university);
        if (acceptedUniversity != null) return acceptedUniversity;

        final nationalId =
            await _recognizer.barcode(current, universityOnly: false);
        final acceptedNational = await _validate(nationalId);
        if (acceptedNational != null) return acceptedNational;

        // OCR is deliberately gated and uses the sharpest recent ROI frame.
        final sharpest =
            _sharpFrames.reduce((a, b) => a.sharpness >= b.sharpness ? a : b);
        final acceptedOcr = await _validate(await _recognizer.ocr(sharpest));
        if (acceptedOcr != null) return acceptedOcr;
      }
      return null;
    } finally {
      _processing = false;
    }
  }

  QualityHint? qualityHint(FrameSample frame) {
    if (frame.brightness < .18) {
      return QualityHint.tooDark;
    }
    if (frame.glare > .22) {
      return QualityHint.removeGlare;
    }
    if (frame.sharpness < .35) {
      return QualityHint.holdSteady;
    }
    return null;
  }

  void _remember(FrameSample frame) {
    _sharpFrames.addLast(frame);
    while (_sharpFrames.length > 4) {
      _sharpFrames.removeFirst();
    }
  }

  Future<ScanCandidate?> _validate(ScanCandidate? candidate) async {
    if (candidate == null || candidate.confidence < minimumConfidence) {
      return null;
    }
    final normalized =
        candidate.identifier.replaceAll(RegExp(r'\s+'), '').toUpperCase();
    if (normalized.isEmpty ||
        !await _roster.containsHashedIdentifier(normalized)) {
      return null;
    }
    return ScanCandidate(normalized, candidate.source, candidate.confidence);
  }
}
