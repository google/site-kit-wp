# Key factors section on the Typical Traffic tab

## Feature Description

The chart on the Typical Traffic tab shows a reader that traffic moved. It does not say what moved it. Answering that needs a comparison across every dimension at once — channels, devices, visitor mix, referrers, content, categories and search queries — so that a change can be attributed rather than only observed.

This issue adds the Key factors section below the chart: one block per dimension that moved traffic in the selected period, each naming the values that moved and by how much.

**The order is the server's, not the browser's.** The response ranks the dimensions by how much of the site's own movement each accounts for and the section walks them in that order, so the dimension that explains the most comes first. The section derives nothing: every number it shows is a number the response carried.

Seven dimensions can appear. Each one is looked up in a catalog that says what its heading reads, which part of the response holds its rows, and which component draws them. Two rules live in that lookup rather than in the components. A dimension code the catalog does not know is dropped, so a code the response adds later costs one block rather than the whole tab. And a dimension whose rows are missing from the response is dropped too — the response only orders dimensions it actually carries, so this should not happen, but the lookup treats it as no block rather than as an empty one.

**Search queries are shaped unlike the other six.** A channel or a device is a label and two visitor counts. A query carries clicks in both periods and its average position in both, and a position that fell numerically is an improvement rather than a decline — which no color or arrow convention conveys on its own. That is why the catalog names a component per dimension rather than only a place in the response.

**Labels come from two different places and must not be joined into one translatable sentence.** Analytics returns channel, device and country names in the property's own language rather than the reader's, and page titles and search queries are the site's and its visitors' own, in any script and any writing direction. The plugin's own copy around them is translated and filled in with the values, so a language that orders a sentence differently can.

The response these blocks read comes from #13598; the ranking and the row caps are set in #13595; the panel the blocks sit in is #13599.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* Below the chart, the Typical Traffic tab renders one block per dimension the response names, in the order the response names them, and no block for a dimension the response does not name.
* Each dimension code renders the block the catalog gives it:

  | Code | Rows come from | A row carries |
  | :---- | :---- | :---- |
  | `CHANNELS` | `contextualData.channels` | the channel name, its visitors in the selected period, and its change from the period before |
  | `DEVICES` | `contextualData.devices` | the device category, its visitors, and its change |
  | `VISITOR_MIX` | `contextualData.visitorMix` | new or returning, its visitors, and its change |
  | `REFERRERS` | `contextualData.referrers` | the referring source, its visitors, and its change |
  | `SEARCH_QUERIES` | `contextualData.searchQueries` | the query, its clicks, its change in clicks, and its average position with the change in position |
  | `CONTENT` | `contextualData.content` | the page title, its visitors, and how long ago the page was published |
  | `CATEGORIES` | `contextualData.categories` | the category name, its visitors, and its change |

* A dimension code in the response that the catalog does not know renders no block, and every other block in the response renders.
* A dimension named in the response whose rows are missing from `contextualData` renders no block, and every other block renders.
* A block renders every row the response carried for it, up to the **5** the response caps each dimension at.
* On a search-query row whose average position moved from `8.4` to `5.1`, the change is shown as an improvement; on one that moved from `5.1` to `8.4` it is shown as a decline.
* A row's change reads the same to a screen reader as it does on screen — the direction is spoken, not carried by color and an arrow alone — and a search-query row's position change says which way is better.
* Every number and percentage in a block is formatted for the reader's locale.
* Channel, device and category names arrive in the property's own language and are shown as the response gave them, never joined with the plugin's own copy into a single translatable string.
* A page title or search query longer than its row is truncated without cutting off the wrong end in a right-to-left language.
* Each block is a labelled region a screen reader can move between, and its rows are read as a label with its value and its change.
* A block whose first row has `0` visitors in both periods shows `0` and its change rather than being hidden.
* Every block draws only from the values the tab passes it, so a block renders the same from a fixture as it does on a live dashboard.

## Implementation Brief

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/factors/registry.ts` (new file), following `breakdown/columns.ts`:
  * Export `KeyFactorEntry`, an interface with `heading` (the block's title, a translated string), `contextualDataKey` (the key in `contextualData` its rows come from) and `RowsComponent` (the component that draws them).
  * Export `KEY_FACTOR_REGISTRY`, a `Record< BenchmarkingDimensionCode, KeyFactorEntry >` with one entry per code:

    | Code | `contextualDataKey` | `RowsComponent` |
    | :---- | :---- | :---- |
    | `CHANNELS` | `channels` | `ValueFactorRows` |
    | `DEVICES` | `devices` | `ValueFactorRows` |
    | `VISITOR_MIX` | `visitorMix` | `ValueFactorRows` |
    | `REFERRERS` | `referrers` | `ValueFactorRows` |
    | `SEARCH_QUERIES` | `searchQueries` | `SearchQueryFactorRows` |
    | `CONTENT` | `content` | `ContentFactorRows` |
    | `CATEGORIES` | `categories` | `ValueFactorRows` |
  * Take each heading from the acceptance criteria's wording for the dimension, wrapped in `__()`.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactors.tsx` (new file):
  * Props: `dimensions`, the codes in the order the response gave them, and `contextualData`, the rows keyed by dimension. The component derives nothing and reads no store.
  * Walk `dimensions` in order. Skip a code with no entry in `KEY_FACTOR_REGISTRY`, and skip a code whose `contextualDataKey` is absent from `contextualData` or holds no rows. Both rules live here, so a component never has to handle a missing key.
  * Render one `FactorSection` per surviving code, in the order walked.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/factors/FactorSection.tsx` (new file):
  * Render a `section` with `aria-labelledby` pointing at its own heading, built with `useInstanceId`, following `TrafficBreakdownColumn`. Render the heading, then the entry's `RowsComponent` with the rows.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/factors/ValueFactorRows.tsx` (new file):
  * Render one row per `{ label, current, previous }`: the label exactly as the response gave it, `numFmt( current )` for its visitors, and a `ChangeBadge` with `previousValue={ previous }` and `currentValue={ current }`.
  * Render the label as its own element. Never build a translated sentence around it with `sprintf`: Analytics returns channel, device and category names in the property's own language, not the reader's.
  * Beside the badge, render a `VisuallyHidden` sentence saying whether the value rose or fell and by how much, so the direction does not depend on the badge's colour.
  * Key each row by its position in the array, following `TrafficBreakdownColumn`, because nothing reorders and two rows can carry the same label.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/factors/SearchQueryFactorRows.tsx` (new file):
  * Render one row per `{ label, current, previous, positionCurrent, positionPrevious }`: the query, `numFmt( current )` for its clicks, a `ChangeBadge` over `previous` and `current` for the change in clicks, and `PositionChange` for the average position.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/factors/PositionChange.tsx` (new file):
  * Props: `positionCurrent` and `positionPrevious`, both numbers or `null`.
  * Render the current average position with `numFmt( positionCurrent, { maximumFractionDigits: 1 } )`, and the difference `positionCurrent - positionPrevious` with `numFmt( difference, { signDisplay: 'exceptZero', maximumFractionDigits: 1 } )`.
  * A lower position is better, so style a difference below `0` as an improvement and one above `0` as a decline — the opposite of every other change in the tab. Do not use `ChangeBadge` here: it formats its value as a percentage, which a position difference is not.
  * Render a `VisuallyHidden` sentence saying the position improved or declined, and by how much, so which way is better does not depend on the colour.
  * Render nothing when either position is `null`.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/factors/ContentFactorRows.tsx` (new file):
  * Render one row per `{ url, title, visitors, publishedDaysAgo }`: the page title, `numFmt( visitors )` for its visitors, and how long ago the page was published, built with `_n()` over `publishedDaysAgo` so the plural form is the reader's.
  * Fall back to the `url` when `title` is `null`.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/tabs/TypicalTrafficPanel.tsx`:
  * Render `KeyFactors` below the chart, with the decoded `dimensions` and `contextualData`.

* [ ] In `assets/sass/widgets/_googlesitekit-widget-analyticsTrafficOverview.scss`:
  * Style the Key factors blocks and their rows per the design.
  * Truncate a row's label with `overflow: hidden`, `text-overflow: ellipsis` and `white-space: nowrap`, and set no `direction` on the label. The browser then truncates at the label's own logical end, so a right-to-left title loses its left side rather than its right.

The response these blocks read comes from #13598, the ranking and the row caps are set in #13595, and the panel the blocks sit in is #13599.

### Test Coverage

* Add `assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactors.test.tsx` covering:
  * One block per dimension the response names, in the response's order, and no block for a dimension it does not name.
  * A dimension code the registry does not know renders no block, and every other block renders.
  * A dimension named in `dimensions` whose `contextualData` key is missing renders no block, and every other block renders.
  * Each block is a labelled region whose accessible name is its heading.
  * A block renders every row the response carried, up to five.
* Add `assets/js/modules/analytics-4/components/traffic-overview/factors/ValueFactorRows.test.tsx` covering:
  * A row shows its label unchanged, its visitors and its change.
  * The direction of the change is in the text a screen reader reads, not only in the badge's colour.
  * A row with `0` visitors in both periods shows `0` and its change rather than being hidden.
* Add `assets/js/modules/analytics-4/components/traffic-overview/factors/PositionChange.test.tsx` covering:
  * A move from `8.4` to `5.1` is shown as an improvement, and a move from `5.1` to `8.4` as a decline.
  * The screen-reader sentence says which way is better in both cases.
  * Nothing renders when either position is `null`.
* Add `assets/js/modules/analytics-4/components/traffic-overview/factors/ContentFactorRows.test.tsx` covering:
  * A row shows its title, its visitors and how long ago the page was published, and falls back to the URL when the title is `null`.
* Add `KeyFactors.stories.tsx` with stories for the full set of seven blocks, a response whose first dimension is `CONTENT`, and a response carrying only `CHANNELS`. Give each a `scenario`.
* Each new story adds a Backstop scenario and needs a new reference image. Existing references do not move, because nothing outside the new tab changes.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
