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

# Arabic fallback font

`registerPDFFonts()` also embeds this Noto binary so the report renders
Arabic-script text (Arabic and Persian) legibly. The complex-script registry
(`../pdf-text-shaping.ts`, `getComplexScript`) applies it as the sole family for
that text, because `@react-pdf` cannot shape or reorder Arabic within a font
stack. The brand fonts already cover Latin and Cyrillic, so no Cyrillic fallback
is bundled.

| File | Internal family | Weight | Script |
| --- | --- | --- | --- |
| `noto-sans-arabic-regular.ttf` | Noto Sans Arabic | 400 | Arabic |
| `noto-sans-arabic-medium.ttf` | Noto Sans Arabic | 500 | Arabic |

Like the brand fonts, these are webpack `asset/resource` files (emitted under
`dist/fonts/`, never inlined) and `@react-pdf` fetches one only when a rendered
text node references its family, so a Latin or Cyrillic PDF never loads them and
only an Arabic-script PDF does.

Source: the Google Fonts published static subset, retrieved 2026-07-03:

- Noto Sans Arabic, `arabic` subset (v33):
  `https://fonts.gstatic.com/s/notosansarabic/v33/<hash>.ttf`

This is the per-script subset Google serves for the legacy CSS API, so it retains
the `GSUB`/`GPOS` layout tables needed for Arabic shaping. To regenerate from the
upstream Noto release instead, subset with `pyftsubset` keeping
`--layout-features='*'` over the Arabic ranges (`U+0600-06FF`, `U+0750-077F`,
`U+08A0-08FF`, `U+FB50-FDFF`, `U+FE70-FEFF`).

License: the Noto fonts are licensed under the SIL Open Font License, Version
1.1. The license text is in `OFL.txt` in this directory.
