# Loading, error and short-history states for the Typical Traffic tab

## Feature Description

This issue shows the Typical Traffic tab for every site, however young, and adds what the tab shows in each of its states. Besides loading and error, the tab can be ready, partial, or in one of two zero states. In the partial state the chart shows with a notice naming each part that still waits for recorded traffic. In the zero states a message replaces the whole tab: "Not enough data for this range" when a shorter range would show more ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2094-11912&m=dev)), and "Collecting" when no range can show anything yet ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2096-12859&m=dev)). The notice has no design yet.

Every state is decided from the one response, by comparing `firstTrafficDate` (#13799) with the selected range. History is counted from the first day with recorded traffic, not from the property's creation, because the band and the key factor cards (#13845) count from that day.

This issue lands after #13600, #13800, #13601 and #13799.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1 (see "Panel states", "Gating and visibility" and "Documentation in-product")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* With `typicalTraffic` enabled and Analytics connected, the main dashboard shows the Typical Traffic tab for a property created yesterday. The entity dashboard shows no Typical Traffic tab.
* The first time the tab is selected, it shows placeholders at the size of the chart and of three key factor cards until the response arrives. Returning to the tab within the hour shows its content at once and sends no request.
* When the request fails, the tab shows the Analytics report error with its Retry action, and its request-access action on a shared dashboard where the error allows it. Retry sends a request that reaches the server. The Traffic Overview tab is unaffected.
* With `Last 28 days` selected, ending on `2026-09-15`, the tab shows:

  | `firstTrafficDate` | Tab |
  | :---- | :---- |
  | `2026-07-22` | Ready: the chart with the band on every day, and the key factor cards |
  | `2026-07-23` | Partial: the chart with the band on every day; the notice names the cards |
  | `2026-08-07` | Partial: the chart with the band from `2026-09-03` on; the notice names the band and the cards |
  | `2026-09-02` | Not enough data for this range, suggesting `Last 7 days` |
  | `2026-09-03` | Collecting |
  | `null` | Collecting |

* With `Last 7 days` selected, ending on `2026-09-15`, and a `firstTrafficDate` of `2026-08-28`, the tab is Partial: the chart without a band, the key factor cards, and a notice that names only the band.
* The notice sits above the chart. For each waiting part, and no other, it says what the part waits for: 28 days of recorded traffic up to a day for that day's band, and recorded traffic on every day of the previous period for the cards. It gives no date, and ends with a `Learn more` link to `#`.
* "Not enough data for this range" shows its illustration, the title `Not enough data to show typical traffic`, the label of the suggested range, and a `Learn more` link to `#`, as in the design. "Collecting" shows its illustration, the title `We're still collecting data for your typical traffic`, no range, and a `Learn more` link to `#`, as in the design. Neither shows the chart, the notice, the cards or the feedback buttons.
* A site whose visits all came before the previous period shows the chart at `0` with its band, and no key factors section, notice or call to action.
* The tab never shows a gathering-data message.

## Implementation Brief

* [ ] In `assets/js/util/dates.ts`:
  * Export the `DateRangeOption` interface, so the state function can name its type.

* [ ] In `assets/js/components/ReportErrorActions.js`:
  * Add a module-level constant `RETRYABLE_SELECTOR_NAMES`, holding `getReport` and `getBenchmarkingData`, and change the `retryableErrors` filter to `RETRYABLE_SELECTOR_NAMES.includes( err.selectorData.name )`.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/hooks/useHasTypicalTrafficTab.ts`:
  * Remove the property creation check, so the hook returns `true` when `typicalTraffic` is enabled, the dashboard is the main dashboard, and Analytics is connected.
  * Remove the imports that only that check used: `CORE_USER`, `MODULES_ANALYTICS_4`, `getTypicalTrafficEligibilityDate` and `getPropertyCreateDate`. Update the docblock.

* [ ] Delete `assets/js/modules/analytics-4/components/traffic-overview/utils/getTypicalTrafficEligibilityDate.ts` and its test.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/utils/getTypicalTrafficState.ts` (new file):
  * Export `TYPICAL_TRAFFIC_MINIMUM_EXPECTED_RANGE_DAYS`, set to `28`: the days of recorded traffic a day needs, up to and including itself, for a band.
  * Export the type `TypicalTrafficState`: `'ready' | 'partial' | 'not-enough-data' | 'collecting'`.
  * Export `getTypicalTrafficState( { firstTrafficDate, dailyTraffic, startDate, endDate, dateRanges } ): TypicalTrafficStateResult`:
    * `firstTrafficDate: string | null` and `dailyTraffic: BenchmarkingDailyTrafficRow[]` come from the decoded response. `startDate` and `endDate` are the selected range's dates. `dateRanges: DateRangeOption[]` are the ranges the date-range selector offers.
    * `TypicalTrafficStateResult` is `{ state: TypicalTrafficState, isExpectedRangeWaiting: boolean, areKeyFactorsWaiting: boolean, suggestedDateRange?: DateRangeOption }`.
  * Work it out in this order, with `addDays()` and `getDayCount()` from `assets/js/util/dates.ts`, so no date shifts at a daylight saving change:
    * A range of `n` days ending on `endDate` shows the cards when `firstTrafficDate` is not `null` and is on or before `addDays( endDate, 1 - 2 * n )`, the first day of its previous period.
    * `areKeyFactorsWaiting` is `true` when the selected range does not show the cards, with `n` from `getDayCount( startDate, endDate )`.
    * `isExpectedRangeWaiting` is `true` when at least one `dailyTraffic` row has `null` for `expectedMin` or `expectedMax`.
    * `hasExpectedRange` is `true` when at least one row has both bounds.
    * The state is `collecting` when `hasExpectedRange` is `false` and no range in `dateRanges` shows the cards.
    * The state is `not-enough-data` when `hasExpectedRange` is `false`, `areKeyFactorsWaiting` is `true`, and at least one range in `dateRanges` shows the cards. `suggestedDateRange` is the one of those with the most `days`.
    * Otherwise the state is `partial` when `isExpectedRangeWaiting` or `areKeyFactorsWaiting` is `true`, and `ready` when neither is.
  * Read no store and no clock.

* [ ] In `assets/svg/graphics/` (new files):
  * Add `typical-traffic-not-enough-data.svg`, exported from the `Zero data icon` layer of the design: https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2094-11915&m=dev
  * Add `typical-traffic-collecting.svg`, exported from the illustration above the title in the design: https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2096-12859&m=dev

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/tabs/` (new files):
  * `TypicalTrafficZeroState.tsx`: the layout both zero states share, per the two designs. Props: `graphic: ReactNode`, `title: string` and `description: ReactNode`. Render a `div` with the class `googlesitekit-traffic-overview__typical-traffic-zero-state`, holding the graphic, then the title as a `Typography` heading, then the description as a `Typography` paragraph.
  * `TypicalTrafficNotEnoughData.tsx`: renders `TypicalTrafficZeroState` with the graphic imported from `@/svg/graphics/typical-traffic-not-enough-data.svg`, the title from the acceptance criteria, and a description made with `createInterpolateElement()` from one translatable `sprintf()` pattern. The pattern takes the suggested range's `label`, from the prop `suggestedDateRangeLabel: string`, and maps `a` to a `Link` with `href="#"`, as `TypicalTrafficChartHeader` (added in #13600) maps its `Learn more` link.
  * `TypicalTrafficCollecting.tsx`: renders `TypicalTrafficZeroState` with the graphic imported from `@/svg/graphics/typical-traffic-collecting.svg`, the title from the acceptance criteria, and the description from the design, with its `Learn more` link made the same way.
  * `TypicalTrafficNotice.tsx`: renders `Notice` with `type={ NOTICE_TYPES.INFO }`. Props: `isExpectedRangeWaiting: boolean`, `areKeyFactorsWaiting: boolean` and `daysInSelectedRange: number`. Its `description` holds one sentence for each part that is waiting, in the order band then cards, then the `Learn more` link made the same way. Write each sentence as one translatable string. Fill a count of days with `sprintf()` over a pattern chosen with `_n()`: `TYPICAL_TRAFFIC_MINIMUM_EXPECTED_RANGE_DAYS` in the band's sentence and `daysInSelectedRange` in the cards' sentence.
  * `TypicalTrafficPanelLoading.tsx`: render `PreviewBlock` placeholders shaped like what replaces them: one at the chart's height, then three side by side at a key factor card's height, per the design. Give each `PreviewBlock` the same height the finished element takes, so nothing below the widget moves when the response arrives.

* [ ] In `assets/js/modules/analytics-4/components/traffic-overview/tabs/TypicalTrafficPanel.tsx`:
  * Read `response`, `loading`, `error`, `startDate` and `endDate` from `useBenchmarkingData()`, `getDateRangeNumberOfDays()` from `CORE_USER`, and `clearBenchmarkingData` from `useDispatch( MODULES_ANALYTICS_4 )`.
  * Render exactly one of these inside the tab panel:
    * `error` is set: `WidgetReportError` with `widgetSlug={ TRAFFIC_OVERVIEW_WIDGET_SLUG }`, `moduleSlug={ MODULE_SLUG_ANALYTICS_4 }`, `error`, and `onRetry` calling `clearBenchmarkingData( startDate, endDate )`, which also deletes the API layer's stored copy.
    * `loading` is `true`, or `response` is `undefined`: `TypicalTrafficPanelLoading`.
    * Otherwise, call `getTypicalTrafficState()` with `response.firstTrafficDate`, `response.dailyTraffic`, `startDate`, `endDate` and `Object.values( getAvailableDateRanges() )`, and render by its `state`:
      * `collecting`: `TypicalTrafficCollecting`.
      * `not-enough-data`: `TypicalTrafficNotEnoughData`, with the `label` of `suggestedDateRange`.
      * `partial`: `TypicalTrafficNotice`, then the chart and the key factor cards as in the `ready` state.
      * `ready`: the chart and the key factor cards, rendered together from the one response.

* [ ] In `assets/sass/widgets/_googlesitekit-widget-analyticsTrafficOverview.scss`:
  * Style the placeholder layout so it takes the same space as the finished panel at every breakpoint.
  * Style `.googlesitekit-traffic-overview__typical-traffic-zero-state` per the two zero-state designs: the graphic, the title and the description centered in the panel.
  * Give the notice the space above the chart that the panel's other blocks have.

The chart is #13600, the band is #13800, the key factor cards are #13601, and `firstTrafficDate` is #13799. The loading flag, the error and the clear action come from #13598.

### Test Coverage

* Add `assets/js/modules/analytics-4/components/traffic-overview/utils/getTypicalTrafficState.test.ts` covering every row of the acceptance criteria's table and the `Last 7 days` case, and these boundaries:
  * 27 and 28 days of recorded traffic up to `endDate`: no band on any day, and a band on the last day.
  * A previous period that starts on `firstTrafficDate`, which shows the cards, and one that starts the day before, which holds them back.
  * 13 and 14 days on a 28-day range, which separate the Collecting state from the Not enough data state.
  * `suggestedDateRange` is the range with the most days that shows the cards, and is absent in every other state.
  * A range that crosses a daylight saving change gives the same result, with the test's time zone set to one whose clocks change.
* Extend `assets/js/modules/analytics-4/components/traffic-overview/tabs/TypicalTrafficPanel.test.tsx` (added in #13600) covering:
  * Selecting the tab for the first time shows the placeholders, and they are replaced by the chart and every key factor card in one step when the response arrives.
  * A response already in the store renders the tab with no placeholder step and sends no request.
  * Changing to a date range the tab has not shown shows the placeholders again and sends a request.
  * A failed request shows the report error for Analytics in place of everything else, with its Retry button.
  * Retrying clears the stored response for those dates and sends a request that reaches the network, and shows the placeholders while it is in flight.
  * Each state renders its parts and nothing else: the Ready state has no notice; each Partial case shows the notice with only the sentences for the waiting parts, before the chart; each zero state shows its title and its `Learn more` link, and no chart, no notice, no card and no feedback button.
  * The Not enough data message names `Last 7 days`.
  * A response with visits only before the previous period renders the chart with its zeros and its band, no key factors section and no notice, and renders no call to action and no gathering-data message.
* Update `assets/js/modules/analytics-4/components/traffic-overview/hooks/useHasTypicalTrafficTab.test.ts`: replace the cases that depend on the property's creation time (older than thirteen months, younger than thirteen months, the view-only dashboard, and a creation time that has not loaded) with one where the property was created yesterday and one with no creation time, both of which give `true`.
* Extend `assets/js/components/ReportError.test.js`, which covers `ReportErrorActions`:
  * An error recorded against `getBenchmarkingData` shows the Retry button, and retrying invalidates that selector's resolution.
  * The case for a selector that is not `getReport` still shows no Retry button. Rename it to say neither `getReport` nor `getBenchmarkingData`.
* Extend `assets/js/modules/analytics-4/components/traffic-overview/widgets/TrafficOverviewWidget.test.tsx` covering:
  * A failure on the Typical Traffic tab leaves the Traffic Overview tab showing its visitor total, its chart and its breakdown.
  * The Typical Traffic tab shows for a property created yesterday. Rename the case that says the property is at least thirteen months old, and update the setup comment that says the creation time makes the widget show the tab.
* Add `assets/js/modules/analytics-4/components/traffic-overview/tabs/TypicalTrafficPanel.stories.tsx` with `Ready`, `Loading`, `Error`, `Partial with the band waiting`, `Partial with the cards waiting`, `Partial with both waiting`, `Not enough data` and `Collecting` stories, each with a `scenario`. Build their responses with `createDailyTrafficRows()` from `traffic-overview/test-utils.ts` (added in #13600), with `expectedMin` and `expectedMax` set on the days that have a band, and `provideBenchmarkingData()`.
* Give the `Typical Traffic Selected (typicalTraffic enabled)` story in `TrafficOverviewWidget.stories.tsx` a Ready response for its date range, built the same way, in place of the checked-in fixture, so it shows the chart and the cards with no notice.
* The new stories add VRT scenarios and need new reference images. The `Typical Traffic Selected (typicalTraffic enabled)` story's reference images change too. `ReportErrorActions` renders the same markup for every existing caller, so no other reference image changes.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
