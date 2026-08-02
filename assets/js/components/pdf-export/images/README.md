# PDF report images

The PDF report can't draw everything an SVG can, because `@react-pdf/renderer` has no `Mask`, no `ForeignObject`, and no `Filter`. A drawing that needs one of those becomes an image here, and `createPDFImageIcon()` in `../pdf-icons.tsx` draws that image. Every image in this directory has a row in this table:

| File | Source | Drawn at |
| --- | --- | --- |
| `logo-g.png` | `assets/svg/graphics/logo-g.svg` | 24pt, in the report header |

## Regenerate the `logo-g.png` file

Use `puppeteer` rather than `rsvg-convert`, because the letter's CSS `conic-gradient` needs a browser. `rsvg-convert` reports success and hands back a plain white letter.

Render `assets/svg/graphics/logo-g.svg` at 256 by 262 on a transparent background. Set its `viewBox` to `0.107422 0 23.599 24.1136`, and the letter fills the image edge to edge. Then compress it:

```bash
oxipng -o max --strip safe logo-g.png
```

Save the file in RGBA and don't run `pngquant`, which keeps fewer colors. The place where green turns into blue at the bottom right stops looking smooth, and the difference shows in the report at 24pt.
