# PDF brand fonts

`registerPDFFonts()` (`../pdf-fonts-react.ts`) embeds these Google Sans binaries
into the generated PDF. Only the weights the PDF design uses are bundled.

| File | Internal family | Weight |
| --- | --- | --- |
| `google-sans-display-regular.ttf` | Google Sans Display | 400 |
| `google-sans-display-medium.ttf` | Google Sans Display | 500 |
| `google-sans-text-regular.ttf` | Google Sans | 400 |
| `google-sans-text-medium.ttf` | Google Sans | 500 |

The display family (headings / large sizes) uses Google Sans Display; the text
family (body / captions) uses Google Sans. The `@react-pdf` family labels are
assigned in `../pdf-theme.ts` (`PDF_FONT_FAMILY_DISPLAY` / `PDF_FONT_FAMILY_TEXT`),
so the binaries' internal names do not need to match those labels.

Source: the Flutter gallery-assets font set
(`https://flutter.googlesource.com/gallery-assets/+/refs/heads/master/lib/fonts/`).

# Non-Latin fallback fonts

`registerPDFFonts()` also embeds these Noto binaries as script fallbacks so the
report renders Cyrillic and Arabic text legibly. They follow the brand family in
a font stack (`../pdf-theme.ts`, `getPDFFontFamily`), so Latin keeps the brand
typeface and non-Latin glyphs come from Noto.

| File | Internal family | Weight | Script |
| --- | --- | --- | --- |
| `noto-sans-cyrillic-regular.ttf` | Noto Sans | 400 | Cyrillic |
| `noto-sans-cyrillic-medium.ttf` | Noto Sans | 500 | Cyrillic |
| `noto-sans-arabic-regular.ttf` | Noto Sans Arabic | 400 | Arabic |
| `noto-sans-arabic-medium.ttf` | Noto Sans Arabic | 500 | Arabic |

Like the brand fonts, these are webpack `asset/resource` files (emitted under
`dist/fonts/`, never inlined) and `@react-pdf` fetches one only when a rendered
text node references its family, so a Latin PDF never loads them and each
non-Latin PDF loads only its script.

Source: the Google Fonts published static subsets, retrieved 2026-07-03:

- Noto Sans, `cyrillic` subset (v42):
  `https://fonts.gstatic.com/s/notosans/v42/<hash>.ttf`
- Noto Sans Arabic, `arabic` subset (v33):
  `https://fonts.gstatic.com/s/notosansarabic/v33/<hash>.ttf`

These are the per-script subsets Google serves for the legacy CSS API, so they
retain the `GSUB`/`GPOS` layout tables needed for Arabic shaping. To regenerate
from the upstream Noto releases instead, subset with `pyftsubset` keeping
`--layout-features='*'` over the Cyrillic ranges (`U+0400-04FF`, `U+0500-052F`,
`U+2DE0-2DFF`, `U+A640-A69F`) and the Arabic ranges (`U+0600-06FF`, `U+0750-077F`,
`U+08A0-08FF`, `U+FB50-FDFF`, `U+FE70-FEFF`).

License: the Noto fonts are licensed under the SIL Open Font License, Version
1.1. The license text is in `OFL.txt` in this directory.
