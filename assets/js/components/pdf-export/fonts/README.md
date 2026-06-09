# PDF brand fonts

`registerPDFFonts()` (`../pdf-fonts-react.ts`) embeds these Google Sans binaries
into the generated PDF. Only the weights the PDF design uses are bundled.

| File | Internal family | Weight |
| --- | --- | --- |
| `google-sans-display-regular.ttf` | Google Sans Display | 400 |
| `google-sans-text-regular.ttf` | Google Sans | 400 |
| `google-sans-text-medium.ttf` | Google Sans | 500 |

The display family (headings / large sizes) uses Google Sans Display; the text
family (body / captions) uses Google Sans. The `@react-pdf` family labels are
assigned in `../pdf-theme.ts` (`PDF_FONT_FAMILY_DISPLAY` / `PDF_FONT_FAMILY_TEXT`),
so the binaries' internal names do not need to match those labels.

Source: the Flutter gallery-assets font set
(`https://flutter.googlesource.com/gallery-assets/+/refs/heads/master/lib/fonts/`).
