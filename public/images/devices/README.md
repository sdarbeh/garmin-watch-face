# Device artwork

- `*-preview.png` is the left-facing three-quarter product image with the watch’s stock face, used in the catalog, watch details, and watch picker.
- `*-frame.png` is the unmodified Garmin Connect IQ simulator shell. The editor and design previews place the selected design inside its screen rectangle, defined in `src/devices/catalog.ts`.

The simulator packages supply each frame’s dimensions and screen coordinates. White simulator matte removal is applied at render time; bezel artwork is preserved separately to keep white markings intact.

## Product preview sources

- Forerunner 970: existing product artwork, renamed from `forerunner-970-cutout.png` without changing the image.
- [Fēnix 8 AMOLED](https://res.garmin.com/en/products/010-02904-00/v/cf-lg.png)
- [Fēnix 8 Pro AMOLED](https://res.garmin.com/en/products/010-03198-00/v/cf-lg.png)
- [Forerunner 965](https://res.garmin.com/en/products/010-02809-00/g/cf-lg.png)
- [Forerunner 570 47 mm](https://res.garmin.com/en/products/010-02971-00/g/cf-lg.png)
- [Venu 3](https://res.garmin.com/en/products/010-02784-01/v/cf-lg.png)
- [Venu 4 45 mm](https://res.garmin.com/en/products/010-03013-02/v/cf-lg.png)
- [Fēnix 9 AMOLED](https://res.garmin.com/en/products/010-04762-00/v/cf-lg.png)

The previews retain the original stock photographs. `scripts/extract-device-preview.mjs`
removes only the connected white exterior matte into PNG alpha. An imagegen
background-extraction attempt changed the stock artwork and was not used.

Garmin retains ownership; these files are not represented as openly licensed assets. Review redistribution rights before publishing the app.
