import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import 'features/scanner/scan_intake.dart';

void main() => runApp(const MonionApp());

class MonionApp extends StatelessWidget {
  const MonionApp({super.key});

  @override
  Widget build(BuildContext context) {
    const green = Color(0xff35d087);
    return MaterialApp(
      title: 'Monion Scanner',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xff071612),
        colorScheme: ColorScheme.fromSeed(
          seedColor: green,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const ScannerScreen(),
    );
  }
}

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(
    // Duplicate suppression is done by ScanIntake, so every detection is passed on.
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    torchEnabled: false,
    formats: const <BarcodeFormat>[],
  );

  final ScanIntake _intake = ScanIntake();
  AcceptedScan? _scan;
  double _zoom = 0;

  void _onDetect(BarcodeCapture capture) {
    final accepted = _intake.accept(capture.barcodes);
    if (accepted == null || accepted.value == _scan?.value) return;
    setState(() => _scan = accepted);
  }

  void _clear() {
    _intake.reset();
    setState(() => _scan = null);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _Header(controller: _controller),
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  MobileScanner(controller: _controller, onDetect: _onDetect),
                  const _ScannerOverlay(),
                  Positioned(
                    left: 24,
                    right: 24,
                    bottom: 22,
                    child: _ZoomControl(
                      value: _zoom,
                      onChanged: (value) {
                        setState(() => _zoom = value);
                        _controller.setZoomScale(value);
                      },
                    ),
                  ),
                ],
              ),
            ),
            _ResultPanel(
              value: _scan?.value,
              format: _scan?.format,
              scannedAt: _scan?.scannedAt,
              onClear: _clear,
            ),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.controller});
  final MobileScannerController controller;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 12, 14),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: const Color(0xff35d087),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Text('M',
                style: TextStyle(
                    color: Color(0xff052016),
                    fontWeight: FontWeight.w900,
                    fontSize: 20)),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('MONION',
                    style: TextStyle(
                        fontWeight: FontWeight.w800, letterSpacing: 2)),
                Text('Universal barcode scanner',
                    style: TextStyle(color: Color(0xff8fa79e), fontSize: 12)),
              ],
            ),
          ),
          IconButton(
              onPressed: controller.toggleTorch,
              tooltip: 'Torch',
              icon: const Icon(Icons.flashlight_on_outlined)),
          IconButton(
              onPressed: controller.switchCamera,
              tooltip: 'Switch camera',
              icon: const Icon(Icons.cameraswitch_outlined)),
        ],
      ),
    );
  }
}

class _ScannerOverlay extends StatelessWidget {
  const _ScannerOverlay();

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Center(
        child: Container(
          width: MediaQuery.sizeOf(context).width * .78,
          height: 210,
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xff35d087), width: 2),
            borderRadius: BorderRadius.circular(20),
            boxShadow: const [
              BoxShadow(color: Color(0x4435d087), blurRadius: 18)
            ],
          ),
          alignment: Alignment.bottomCenter,
          child: const Padding(
            padding: EdgeInsets.only(bottom: 14),
            child: DecoratedBox(
              decoration: BoxDecoration(
                  color: Color(0xbb071612),
                  borderRadius: BorderRadius.all(Radius.circular(20))),
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                child: Text('Place a barcode inside the frame',
                    style: TextStyle(fontSize: 12)),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ZoomControl extends StatelessWidget {
  const _ZoomControl({required this.value, required this.onChanged});
  final double value;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
          color: const Color(0xcc071612),
          borderRadius: BorderRadius.circular(24)),
      child: Row(
        children: [
          const Icon(Icons.zoom_out, size: 18),
          Expanded(child: Slider(value: value, onChanged: onChanged)),
          const Icon(Icons.zoom_in, size: 18),
        ],
      ),
    );
  }
}

class _ResultPanel extends StatelessWidget {
  const _ResultPanel(
      {required this.value,
      required this.format,
      required this.scannedAt,
      required this.onClear});
  final String? value;
  final BarcodeFormat? format;
  final DateTime? scannedAt;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(minHeight: 160),
      padding: const EdgeInsets.fromLTRB(22, 18, 22, 24),
      decoration: const BoxDecoration(
        color: Color(0xff0c211b),
        border: Border(top: BorderSide(color: Color(0xff1e3a31))),
      ),
      child: value == null
          ? const Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.qr_code_scanner, color: Color(0xff8fa79e), size: 30),
                SizedBox(height: 8),
                Text('Waiting for a barcode',
                    style: TextStyle(color: Color(0xff8fa79e))),
                SizedBox(height: 4),
                Text('Scan values stay on this device',
                    style: TextStyle(color: Color(0xff60776f), fontSize: 11)),
              ],
            )
          : Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const CircleAvatar(
                    backgroundColor: Color(0xff35d087),
                    foregroundColor: Color(0xff052016),
                    child: Icon(Icons.check)),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(format?.name.toUpperCase() ?? 'BARCODE',
                          style: const TextStyle(
                              color: Color(0xff35d087),
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.2)),
                      const SizedBox(height: 7),
                      SelectableText(value!,
                          style: const TextStyle(
                              fontSize: 17, fontWeight: FontWeight.w700)),
                      if (scannedAt != null) ...[
                        const SizedBox(height: 7),
                        Text('Captured ${_time(scannedAt!)} · not uploaded',
                            style: const TextStyle(
                                color: Color(0xff8fa79e), fontSize: 11)),
                      ],
                    ],
                  ),
                ),
                IconButton(
                    onPressed: onClear,
                    tooltip: 'Scan another',
                    icon: const Icon(Icons.refresh)),
              ],
            ),
    );
  }

  static String _time(DateTime value) =>
      '${value.hour.toString().padLeft(2, '0')}:${value.minute.toString().padLeft(2, '0')}:${value.second.toString().padLeft(2, '0')}';
}
