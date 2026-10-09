# Visual regression tests

Every Storybook story with a `.scenario` is screenshotted at three viewports and compared with
a reference image committed in [`__screenshots__/`](./__screenshots__). The tests use
[Playwright](https://playwright.dev/docs/test-snapshots) and run in Playwright's official Docker
image, locally and in CI, so a reference image approved on your machine matches CI pixel for
pixel.

## Prerequisites

- **Docker Desktop**, running. On Apple Silicon, turn on *Settings → General → Use Rosetta for
  x86_64/amd64 emulation* if it isn't already: approving reference images runs on
  `linux/amd64`, like CI.
- `npm install` at the repository root.

Comparisons (`test`, `ui`) run on your machine's CPU architecture. On Apple Silicon that is
about twice as fast as emulating amd64, and the results are the same: about a third of the
arm64 screenshots differ from amd64's, but only by color shifts too small to fail the
comparison. Approving (`approve`) renders on `linux/amd64`, so the images you commit are exactly
what CI renders.

## Commands

| Task | Command |
|---|---|
| Build Storybook, then run every test | `npm run test:visualtest` |
| Run some stories, at one viewport | `npm run test:visualtest -- --grep "SettingsEdit" --project=small` |
| Run again without rebuilding Storybook | `tests/vrt/bin/vrt test --grep "SettingsEdit"` |
| **Create or update reference images** | `npm run test:visualapprove -- --grep "<story label>"` |
| See the [report](#the-report) of the last run | `tests/vrt/bin/vrt report` |
| See Playwright's report (full errors, notes and traces) | `tests/vrt/bin/vrt report --playwright` |
| Debug in Playwright's UI mode | `tests/vrt/bin/vrt ui`, then open http://localhost:8080 |
| Check for orphaned or missing reference images | `node tests/vrt/bin/check-snapshots.js [--prune]` |
| Check a story is stable | `tests/vrt/bin/vrt test --grep "<story label>" --repeat-each=10` |

`--grep` matches the test title, which is the story's title and name, for example
`Components/Button/All Buttons VRT`. Projects are the viewports: `small` (420×580), `medium`
(868×1124) and `large` (1124×1124).

`tests/vrt/bin/vrt` uses the Storybook build in `dist/`, and warns when sources have changed
since it was built. Set `VRT_BUILD=1` to rebuild first. Other variables:

- `VRT_WORKERS=<n>`: parallel browsers (default: half your CPU cores).
- `VRT_TRACE=1`: record a Playwright trace for failing tests, viewable in Playwright's report.
- `VRT_PLATFORM=linux/amd64` or `VRT_PLATFORM=native`: run every command on that platform,
  instead of the defaults described under [Prerequisites](#prerequisites).

## The report

Each run writes a report to `tests/vrt/report/`. Open the last one with `tests/vrt/bin/vrt report`;
CI's is linked on the pull request.

- **Every screenshot** is listed by story and viewport, with its reference image. Filter by
  status (failed, new, flaky, not run or passed), by story or by viewport. The report opens on the
  problems, if there are any.
- **A failed story** shows its reference image, the new screenshot, and a diff that highlights the
  pixels that differ, with how many there are. A new story shows its first screenshot. A story
  that failed before its screenshot was taken (an error, or a `readySelector` that never matched)
  shows the page when it failed, and the error.
- **Click an image to compare.** Switch between the reference image, the screenshot and the
  diff, drag a slider across the two images, or show them side by side, fitted or at actual size.
  The number keys switch views, `←` and `→` move between screenshots, and `Esc` closes.
- **A changed or new screenshot** comes with the command that approves it, ready to copy (see
  below). Every problem links to its test in Playwright's report, which has the full error, notes
  such as blocked requests, and traces. Open that report on its own with
  `tests/vrt/bin/vrt report --playwright`.

## Updating reference images

When a change is meant to alter how a story looks:

1. Run `npm run test:visualapprove -- --grep "<story label>"` (the report shows this command for
   each changed screenshot), or leave out `--grep` to update everything. Only images that
   changed, or didn't exist, are written.
2. Review the new images: `git diff --stat tests/vrt/__screenshots__`, and the images
   themselves in your Git client or on GitHub.
3. Commit them with your change.

A full `npm run test:visualapprove` (without `--grep`) also deletes reference images whose
stories no longer exist.

Instead of steps 1–2, you can add the **`VRT: Update reference images`** label to your pull
request: CI renders the changed images and the bot commits them to your branch. This is handy for
large changes. It works for pull requests from branches in this repository, not forks.

## Adding a story

Give the story a `scenario`, usually empty:

```js
export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};
```

Reference images are named after the story's title and name, in kebab case:
`__screenshots__/components/button/default/small.png`. Feature flags come from the story's or
default export's `parameters.features`, which must be an array of string literals.

Scenario options (any other key fails the run):

| Option | Type | Effect |
|---|---|---|
| `readySelector` | string | Wait for an element matching this selector before the screenshot. |
| `delay` | number | Wait at least this many milliseconds after the story renders. Prefer `readySelector`. |
| `hoverSelector` | string | Hover over the first matching element. |
| `clickSelector` | string | Click the first matching element (after hovering, if both are set). |
| `postInteractionWait` | number | Milliseconds to wait after hovering or clicking. |
| `viewport` | string | Capture only this viewport: `small`, `medium` or `large`. |
| `resetDataBlockGroup` | boolean | Re-run `DataBlockGroup`'s font fitting. |
| `waitForFontSizeToMatch` | string | With `fontSizeSmall`, `fontSizeMedium` and `fontSizeLarge` (a number, or `false`): wait until the matching elements reach that font size. |

## What happens in each test

1. The browser is Chromium in its "new" headless mode (`channel: 'chromium'`): Playwright's
   default headless shell places glyphs on whole pixels, which spaces text unevenly. Each
   worker keeps one browser page, so the build and web fonts stay cached. Each test still
   loads the story in a fresh document, with empty storage. Stories that hover or click get a
   page of their own, so the mouse position doesn't carry over.
2. The Storybook build (made with `VRT=1`) turns off animations and transitions, except inside
   `.googlesitekit-vrt-animation-paused`, where they are paused. It waits for the Google Sans
   fonts to load before rendering each story, and draws monospace text in Liberation Mono,
   because the generic `monospace` font isn't stable in the Docker image.
3. The test then waits for:
   - Storybook to report that the story rendered (an error fails the test);
   - network requests to finish;
   - Google Charts to draw;
   - the page to stop changing for 300 ms (at most 3 s);
   - the `readySelector` and `delay`, if set.
4. It compares a full-page screenshot with the reference image. Per-pixel color differences under
   Playwright's default `threshold` of 0.2 are ignored, but no pixel may differ by more than that.

The date is fixed at 15 June 2026, noon UTC, for stories that don't set their own reference
date. Pages can only reach the local Storybook server, Google Fonts and the Google Charts loader;
requests to other hosts fail and are listed as notes on the test in Playwright's report.

## Making a story deterministic

- **Network:** don't load anything else from the network. Inline images (like
  `tests/js/user-avatar.ts`) or mock the request with `fetch-mock`.
- **Content that appears late:** wait for it with a `readySelector`, rather than a `delay`.
- **Animations:** wrap the story in `.googlesitekit-vrt-animation-paused` to keep an
  animation's first frame.
- **Emoji:** avoid them in captured text. The system emoji font loads lazily and can shift the
  text after it.
- **Checking a fix:** after making a story deterministic, run it with `--repeat-each=10`.

## Troubleshooting

- **"The story reloaded the page"**: the story's feature flags weren't known when the test
  loaded it. Set them as literal `parameters.features` on the story or its default export.
- **"isn't in the Storybook build"**: the build in `dist/` is older than the story. Rebuild with
  `VRT_BUILD=1`.
- **"wasn't made for visual regression tests"**: `dist/` was built without `VRT=1`. Run
  `VRT=1 npm run build:storybook`, or set `VRT_BUILD=1`.
- **The test passes in CI but not locally, or the other way round**: make sure `dist/` is up to
  date, and try `VRT_PLATFORM=linux/amd64` to compare exactly as CI does. CI decides whether the
  check passes.
- **Port 3000 is in use**: set `VRT_PORT` to another port.

## In CI

[`visual-regression.yml`](../../.github/workflows/visual-regression.yml) builds Storybook once,
runs the tests in four shards, and merges the results into one [report](#the-report), linked on
the pull request and kept with the run as the `vrt-report` artifact for 14 days. It also runs on
pushes to `develop` and `main`, so reference images broken by two pull requests merging show up
on the commit that broke them. A test that only passes on its retry is reported as flaky rather
than failing the run: its story is listed in the pull request comment, and the **VRT: flaky
screenshots** check is left neutral instead of green, so check those stories before merging.
Run the workflow manually with `repeat_each` to look for flaky stories.

[`vrt-update-reference-images.yml`](../../.github/workflows/vrt-update-reference-images.yml)
runs when the `VRT: Update reference images` label is added to a pull request. Run it manually on
`develop` to open a pull request with updated reference images.
