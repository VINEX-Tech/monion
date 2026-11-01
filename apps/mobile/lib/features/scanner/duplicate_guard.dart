class DuplicateGuard {
  DuplicateGuard({this.visibleCardDebounce = const Duration(seconds: 2)});
  final Duration visibleCardDebounce;
  String? _lastIdentifier;
  DateTime? _lastAcceptedAt;

  bool mayAccept(String identifier, DateTime now) {
    if (_lastIdentifier == identifier &&
        _lastAcceptedAt != null &&
        now.difference(_lastAcceptedAt!) < visibleCardDebounce) {
      return false;
    }
    _lastIdentifier = identifier;
    _lastAcceptedAt = now;
    return true;
  }

  void cardLeftRegion() => _lastIdentifier = null;
}
