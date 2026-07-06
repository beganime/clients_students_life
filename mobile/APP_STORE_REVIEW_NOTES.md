# App Store review notes

## ITMS-90118: Invalid routing app setting

Student's Life is not a turn-by-turn navigation or routing app. The iOS binary
must not be submitted as a routing app and must not have a Routing App Coverage
File uploaded in App Store Connect.

For the next iOS upload:

1. Keep `ios.infoPlist` without `MKDirectionsApplicationSupportedModes`.
2. Do not add routing entitlements or Maps routing modes in Expo config.
3. In App Store Connect, open the app version metadata and remove the Routing
   App Coverage File if one was uploaded.
4. Upload a new EAS build after the metadata is corrected.

The app may still open external map links as ordinary URLs. That does not make
the binary a routing app.
