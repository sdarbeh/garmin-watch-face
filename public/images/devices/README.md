# Device artwork

- `*-preview.png` is the left-facing three-quarter product image with the watch’s stock face, used in the catalog, watch details, and watch picker.
- `*-frame.png` is the unmodified Garmin Connect IQ simulator shell. The editor and design previews place the selected design inside its screen rectangle, defined in `src/devices/catalog.ts`.

The simulator packages supply each frame’s dimensions and screen coordinates. White simulator matte removal is applied at render time; bezel artwork is preserved separately to keep white markings intact.

## Product preview sources

- Forerunner 970: existing product artwork, renamed from `forerunner-970-cutout.png` without changing the image.
- [Fēnix 8 AMOLED](https://res.garmin.com/en/products/010-02904-00/v/cf-lg.png)
- [Fēnix 8 Pro AMOLED](https://res.garmin.com/en/products/010-03198-00/v/cf-lg.png)
- [Forerunner 965](https://res.garmin.com/en/products/010-02809-00/g/cf-lg.png)

The three new previews retain the original stock photographs, with the white exterior matte and ground shadow removed into PNG alpha. An imagegen background-extraction attempt returned an opaque checkerboard and was not used.

Garmin retains ownership; these files are not represented as openly licensed assets. Review redistribution rights before publishing the app.
