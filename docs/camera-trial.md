# Camera trial plan (IMOU Ranger Pro, candidate)

> Plan only. No camera has been connected or tested. The IMOU Ranger Pro is a
> candidate camera for the trial, not a supported device.

Test the exact candidate hardware and firmware. Camera microSD is always primary
evidence. Bus camera profiles contain host/path and encrypted credentials;
credentials never enter a QR code or log.

Attempt Android local-only hotspot connectivity and profile traffic by network
interface. RTSP video must have zero cellular bytes. If discovery, codec stream
copy, reconnection, app-scoped segmented recording, retention enforcement, or
the soak test fails, select `SD_ONLY`. V1 uploads health and segment metadata,
not video. Validate microSD independently before any pilot.

For phone recording, reserve:

`bitrate_bits_per_second / 8 * maximum_trip_seconds * retention_trip_count`

plus 25% safety reserve and 2 GB for app/OS working space. Stop creating phone
segments before the reserve is crossed and alert `LOW_STORAGE`.
