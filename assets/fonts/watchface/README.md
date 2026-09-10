# Watch-face fonts

Source: https://github.com/google/fonts/tree/main/ofl

Selectable families: Garmin Native, Anton, Roboto Condensed, Doto, Pixelify Sans, Rubik Bubbles. Each family directory includes its original OFL.txt and METADATA.pb alongside the unmodified source font. These assets are separate from the Inter fonts used by the app UI.

Generate the checked-in ASCII glyph atlases and metrics with Python 3 and Pillow 12.3.0:

```sh
python3 scripts/build-fonts.py
```

The generator writes public/fonts/watchface/*.png and src/watchface/font-metrics.json. Supported sizes are 24–120 pixels in increments of 8. Weight choices are Regular and Bold, except Anton, Garmin Native, and Rubik Bubbles (Regular only). No user fonts or executable font-generation inputs are accepted by the compilation endpoint.

Roboto is retained only as the browser preview proxy for Garmin Native; it is not a selectable custom font or compiled bitmap font. Native builds use Garmin’s RobotoRegular vector font. Anton comes from https://github.com/google/fonts/tree/main/ofl/anton.
