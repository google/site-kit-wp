# Key factors section on the Typical Traffic tab

## Feature Description

The chart on the Typical Traffic tab shows a reader that traffic moved. It does not say what moved it. Answering that needs a comparison across every dimension at once — channels, devices, visitor mix, referrers, content, categories and search queries — so that a change can be attributed rather than only observed.

This issue adds the Key factors section below the chart: one block per dimension that moved traffic in the selected period, each naming the values that moved and by how much.

**The order is the server's, not the browser's.** The response ranks the dimensions by how much of the site's own movement each accounts for and the section walks them in that order, so the dimension that explains the most comes first. The section derives nothing: every number it shows is a number the response carried.

Seven dimensions can appear. Each one is looked up in a catalog that says what its heading reads, which part of the response holds its rows, and which component draws them. Two rules live in that lookup rather than in the components. A dimension code the catalog does not know is dropped, so a code the response adds later costs one block rather than the whole tab. And a dimension whose rows are missing from the response is dropped too — the response only orders dimensions it actually carries, so this should not happen, but the lookup treats it as no block rather than as an empty one.

**Search queries are shaped unlike the other six.** A channel or a device is a label and two visitor counts. A query carries clicks in both periods and its average position in both, and a position that fell numerically is an improvement rather than a decline — which no color or arrow convention conveys on its own. That is why the catalog names a component per dimension rather than only a place in the response.

**Labels come from two different places and must not be joined into one translatable sentence.** Analytics returns channel, device and country names in the property's own language rather than the reader's, and page titles and search queries are the site's and its visitors' own, in any script and any writing direction. The plugin's own copy around them is translated and filled in with the values, so a language that orders a sentence differently can.

The response these blocks read comes from #13598; the ranking and the row caps are set in #13595; the panel the blocks sit in is #13599.

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

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
