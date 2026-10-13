# Key factor cards on the Typical Traffic tab

## Feature Description

The chart on the Typical Traffic tab shows a reader that traffic moved. It does not say what moved it. Answering that means naming the few things that carried the change — a channel, a page, a search keyword, a referring site or a campaign — rather than listing every dimension of the site's traffic side by side.

This issue adds the Key factors section below the chart ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2096-14304&m=dev)): up to three cards under the heading `Key factors behind your traffic`. Each card names one **driver** — the thing that moved traffic — with its change and its share of the site's change. Under it are at most two **attributes**: the values inside the driver that carried that change, such as the referring site behind a `Referral` card, or the device behind a `Direct` card.

**The choice is the server's, not the browser's.** The response already says which cards to show, in which order, with which attributes, and with every share worked out. The section shows what the response carries and works out nothing itself.

**Every card has the same shape.** A channel, a page, a keyword, a site and a campaign each have a label, a change and a share, and so does every attribute. What differs is the title above the label and the unit of the change. A search keyword counts clicks, because its figures come from Search Console. Everything else counts visits. A title and a unit are looked up by the card's kind. A kind the section does not know is skipped, so a kind the response adds later costs one card or one row rather than the whole tab.

**The share reads in the card's own direction.** A card that rose shows its share of everything the site gained, for example `9.8% of traffic growth`. A card that fell shows its share of everything the site lost, for example `71.4% of traffic drop`, even on a site that grew overall. An attribute shows the same kind of share in shorter words: `4.3% of growth`.

**Labels come from two different places and must not be joined into one translatable sentence.** Channel names, page paths, hostnames, campaign names and search queries come from Analytics and Search Console, or from the site's visitors, in any script and any writing direction. They are shown exactly as the response gives them. Device and visitor type are the exception: Analytics reports them as fixed words such as `mobile` and `new`, so the plugin translates the ones it knows and shows any other value as it is. The plugin's own copy around the labels is translated and filled in with the values, so a language that orders a sentence differently can.

The response these cards read comes from #13598, in its `keyFactors` field, which #13844 adds; the cards are chosen when the response is built on the server, in #13845; the panel the cards sit in is #13599.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* Below the chart, the Typical Traffic tab shows the heading `Key factors behind your traffic` and one card for each entry of the response's `keyFactors`, in the same order, per the design.
* When `keyFactors` is empty, the tab shows neither the heading nor any card.
* Each card shows, from top to bottom:
  * The title for its kind:

    | Kind | Title | Unit |
    | :---- | :---- | :---- |
    | `CHANNEL` | `Traffic channel` | visits |
    | `CONTENT` | `Content` | visits |
    | `SEARCH_KEYWORD` | `Search keyword` | clicks |
    | `REFERRING_SITE` | `Referring site` | visits |
    | `CAMPAIGN` | `Campaign` | visits |

  * The card's label.
  * Its change from `previous` to `current`, with its sign, in the kind's unit: a `CHANNEL` card with `previous` `300` and `current` `365` shows `+65 visits`, and a `SEARCH_KEYWORD` card with `previous` `14` and `current` `12` shows `-2 clicks`.
  * A share badge: `9.8% of traffic growth` for a card whose `sharePct` is `9.8` and whose `current` is above its `previous`, and `71.4% of traffic drop` for a card whose `sharePct` is `71.4` and whose `current` is below its `previous`.
* Under the card, each of its `attributes` is a row, in the same order, showing:
  * The title for the attribute's kind:

    | Kind | Title |
    | :---- | :---- |
    | `TRAFFIC_CHANNEL` | `Traffic channel` |
    | `LANDING_PAGE` | `Landing page` |
    | `SEARCH_KEYWORD` | `Search keyword` |
    | `REFERRING_SITE` | `Referring site` |
    | `PLATFORM` | `Platform` |
    | `CAMPAIGN` | `Campaign` |
    | `DEVICE` | `User device` |
    | `USER_TYPE` | `User type` |

  * The attribute's value.
  * Its change with its sign, in clicks when the attribute is a `SEARCH_KEYWORD` or its card is a `SEARCH_KEYWORD` card, and in visits otherwise: `+32 visits`, `-1 click`.
  * A smaller share badge: `4.3% of growth` for an attribute whose `current` is above its `previous`, and `20.1% of drop` for one whose `current` is below it.
* A card with no attributes shows no attribute rows.
* A `CONTENT` card's label, and a `LANDING_PAGE` attribute's value, link to that path on the site and open in a new tab: `/best-ice-cream-shops/` on `https://example.com` links to `https://example.com/best-ice-cream-shops/`.
* A `DEVICE` value of `desktop`, `mobile` or `tablet` shows as `Desktop`, `Mobile` or `Tablet`, and a `USER_TYPE` value of `new` or `returning` shows as `New visitors` or `Returning visitors`. Any other device or user-type value, and every other label, is shown exactly as the response gave it.
* A card whose kind is not one of the five above shows no card, and every other card shows. An attribute whose kind is not one of the eight above shows no row, and every other row of its card shows.
* Every number and percentage on a card is formatted for the reader's locale, and the plural of `visit` and `click` follows the reader's language.
* Labels and values that come from the response are never joined with the plugin's own copy into a single translatable string.
* A label or value longer than its row is cut off with an ellipsis, and in a right-to-left language it is cut off at its own end.
* Each card is a labelled region a screen reader can move between, named by the card's label. A change's sign and a share's `growth` or `drop` are in the text, so neither depends on color.
* Every card draws only from the values the tab passes it, so a card renders the same from a fixture as it does on a live dashboard.

## Implementation Brief

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/factors/registry.ts` (new file), following `breakdown/columns.ts`:
  * Export `KeyFactorKindEntry`, an interface with `title`, a translated string, and `unit`, `'visits' | 'clicks'`.
  * Export `KEY_FACTOR_KINDS`, a `Record< BenchmarkingKeyFactorKind, KeyFactorKindEntry >` with the titles and units from the acceptance criteria, each title wrapped in `__()`.
  * Export `KEY_FACTOR_ATTRIBUTE_TITLES`, a `Record< BenchmarkingKeyFactorAttributeKind, string >` with the titles from the acceptance criteria, each wrapped in `__()`.
  * Export `getKeyFactorValueLabel( kind: BenchmarkingKeyFactorAttributeKind, label: string | null ): string | null`, which returns the translated label for a `DEVICE` value of `desktop`, `mobile` or `tablet` and for a `USER_TYPE` value of `new` or `returning`, and returns `label` unchanged for anything else.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactors.tsx` (new file):
  * Props: `keyFactors`, a `BenchmarkingKeyFactor[]`, and `referenceSiteURL`, a string. The component reads no store and works out nothing, and passes `referenceSiteURL` down to each card, and from the card to its attributes, for `KeyFactorLabel`.
  * Drop each card whose `kind` has no entry in `KEY_FACTOR_KINDS`. When no card is left, render `null`.
  * Otherwise render the heading from the acceptance criteria, then one `KeyFactorCard` per card, keyed by its position in the array.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactorCard.tsx` (new file):
  * Props: `keyFactor`, a `BenchmarkingKeyFactor`.
  * Render a `section` with `aria-labelledby` pointing at the label, built with `useInstanceId`, following `TrafficBreakdownColumn`.
  * Render the kind's title from `KEY_FACTOR_KINDS`, then the label through `KeyFactorLabel`, then `KeyFactorChange` with the card's counts and unit, then `KeyFactorShareBadge` with `size="large"`.
  * Render one `KeyFactorAttribute` per attribute whose `kind` has an entry in `KEY_FACTOR_ATTRIBUTE_TITLES`, passing `'clicks'` as the unit when the card's kind is `SEARCH_KEYWORD`.
  * Leave room in the card's top-right corner for the card's feedback control, which the Typical Traffic feedback controls add; render nothing there in this issue.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactorAttribute.tsx` (new file):
  * Props: `attribute`, a `BenchmarkingKeyFactorAttribute`, and `cardUnit`, `'visits' | 'clicks'`.
  * Render the title from `KEY_FACTOR_ATTRIBUTE_TITLES`, the value through `KeyFactorLabel` with `getKeyFactorValueLabel()`, `KeyFactorChange` in `'clicks'` when the attribute's kind is `SEARCH_KEYWORD` and in `cardUnit` otherwise, and `KeyFactorShareBadge` with `size="small"`.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactorLabel.tsx` (new file):
  * Props: `label`, a `string | null`, `isPath`, a boolean, and `referenceSiteURL`, a string.
  * When `isPath` is true, render the label as a `Link` to `referenceSiteURL` joined with the path, with `target="_blank"`, following the path link in `DetailsPermaLinks`. Otherwise render the label as text.
  * `KeyFactorCard` passes `isPath` for a `CONTENT` card, and `KeyFactorAttribute` for a `LANDING_PAGE` attribute.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactorChange.tsx` (new file):
  * Props: `current`, `previous` and `unit`.
  * Render `current - previous` with `numFmt( change, { signDisplay: 'exceptZero' } )` inside a `sprintf()` over `_n( '%s visit', '%s visits', Math.abs( change ) )`, or the same with `click` and `clicks`.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactorShareBadge.tsx` (new file):
  * Props: `sharePct`, `isGrowth` (`current > previous`), and `size`, `'large' | 'small'`.
  * Format the share with `numFmt( sharePct / 100, { style: 'percent', maximumFractionDigits: 1 } )` and place it in the pattern from the acceptance criteria for the size and direction, through `sprintf()`: `%s of traffic growth` and `%s of traffic drop` for `large`, `%s of growth` and `%s of drop` for `small`.
  * Do not use `ChangeBadge`: it prints a percentage change between two values, not a share.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/tabs/TypicalTrafficPanel.tsx`:
  * Render `KeyFactors` below the chart, with the decoded `keyFactors` and `getReferenceSiteURL()` from `core/site` as `referenceSiteURL`.

* [ ] In `assets/sass/widgets/_googlesitekit-widget-analyticsTrafficOverview.scss`:
  * Style the heading, the cards with their vertical rule and dot, the attribute rows and the two badge sizes per the design. Hide the rule and the dot from assistive technology.
  * Cut off a label with `overflow: hidden`, `text-overflow: ellipsis` and `white-space: nowrap`, and set no `direction` on it. The browser then cuts the label off at its own logical end, so a right-to-left label loses its left side rather than its right.

The `keyFactors` field of the decoded response and the `BenchmarkingKeyFactor` type are #13844, read through #13598, and the panel the cards sit in is #13599.

### Test Coverage

* Add `assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactors.test.tsx` covering:
  * One card per entry of `keyFactors`, in order, under the heading.
  * No heading and no card when `keyFactors` is empty, or when every card has an unknown kind.
  * A card with an unknown kind is skipped, and the other cards render.
* Add `assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactorCard.test.tsx` covering:
  * Each kind's title, and the change in visits, or in clicks for a `SEARCH_KEYWORD` card.
  * The share badge reads `of traffic growth` for a card that rose and `of traffic drop` for one that fell.
  * An attribute on a `SEARCH_KEYWORD` card, and a `SEARCH_KEYWORD` attribute on a `CHANNEL` card, count clicks; any other attribute counts visits.
  * An attribute with an unknown kind is skipped, and a card with no attributes renders no rows.
  * A `CONTENT` card's label and a `LANDING_PAGE` value link to the path on the reference site URL.
  * Each card is a labelled region whose accessible name is its label.
* Add `assets/js/modules/analytics-4/components/traffic-overview/factors/registry.test.ts` covering `getKeyFactorValueLabel()`: the five known values are translated, and any other device or user-type value, and any value of another kind, is returned unchanged.
* Add `KeyFactors.stories.tsx` with stories for three cards of three kinds with attributes, a falling card on a growing site, a card with no attributes, a single card, and a long right-to-left label. Give each a `scenario`.
* Each new story adds a VRT scenario and needs a new reference image. Existing references do not move, because nothing outside the new tab changes.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
