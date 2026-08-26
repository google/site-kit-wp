# **\[SK\] Part 1 \- Traffic Overview Design**

| Reviewer | Role | Status | Last Change |
| :---- | :---- | :---- | :---- |
| [Mariya Moeva](mailto:mmoeva@google.com) | Approver | Not Started |  |
| [Evan Mattson](mailto:emattson@google.com) | Approver | Waiting for iteration | Aug 21, 2026 |

***Visibility:** Confidential*   
***Status:*** *Review*  
***Author(s):** [Eugene Manuilov](mailto:eugene.manuilov@fueled.com)*  
***PRD:** [Performance intelligence: site benchmarking & forecasts in Site Kit \[PRD\]](https://docs.google.com/document/d/1zwM9ogRlrFO__rLFVYT6SE1qqsjIwzfFUELBiLnYHUQ/edit?pli=1&tab=t.0)*  
***Figma Designs:** [Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=552-10409&m=dev)*  
***Last Major Revision:** Aug 18, 2026* 

# **Context**

## **Objective**

This epic replaces the All Traffic widget with a new traffic card in the Traffic section of the main and entity dashboards: the visitor total with its period-over-period change, the daily traffic chart, and a breakdown of channels, locations and devices shown as three columns rather than as a donut.

## **Background**

`analyticsAllTrafficGA4` answers "how many visitors did I get, and where did they come from?" with a `totalUsers` figure, a daily line chart, and a donut whose slices are one of three dimensions selected from a tab bar above it.

The donut is the widget's defining interaction and its weakest part. It shows one dimension at a time, so comparing channels against devices costs two clicks and a redraw. Its slices carry a share of the period total and no comparison, so a channel that doubled and a channel that halved look identical at the same size. Its "Others" slice is deliberately unselectable, which reads as a broken control rather than as a designed one. And selecting a slice filters the headline figure and the chart beneath it, so **the number at the top of the card means different things at different moments** — a property that has to be explained by a breadcrumb the widget renders into its own title.

Three ranked columns answer the same question without any of that: all three dimensions are on screen at once, each row carries its own change against the previous period, and the total and the chart always report the whole site.

Almost nothing in the current widget survives the change. The donut, the dimension tab bar, the four `core/ui` keys that carry the selection between components, the pie-slice color hook and the per-dimension re-query all go, and what is left is a metric block and a line chart. The widget is therefore built new rather than converted, and the old one is removed once it is.

# **Design**

## **Overview**

We will add one full-width widget, `analyticsTrafficOverview`, registered at priority 1 into `AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY` and `AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY` — the two areas and the priority `analyticsAllTrafficGA4` occupies today, so the card lands in the same slot on both dashboards.

The card is a tab shell. A tab bar sits flush across the top of the card, carrying a single tab in this epic, and beneath it the **Traffic Overview** panel renders three sections in a fixed order:

1. **Total visitors** — the period's `totalUsers` with a change badge against the previous period.  
2. **Traffic chart** — daily visitors across the selected range.  
3. **Traffic breakdown** — three columns, one per dimension: channels, locations and devices, each a ranked list of values with its own period-over-period change.

Five GA4 reports back it, all resolved in the browser through the module's existing reporting stack and all already expressed as report-options builders the current widget's PDF loader uses. **No new PHP, no new datapoint and no new REST surface**: this epic is a front-end replacement of a front-end widget.

**The old widget is removed in the same epic, behind the same flag.** With `trafficOverview` off the dashboard is exactly what it is today; with it on, `analyticsAllTrafficGA4` is not registered at all. The flag therefore selects between two widgets rather than adding one to a page that already has the other — see [Feature flag](#feature-flag).

**One widget serves both dashboards.** Every report carries the entity URL when one is set, which is how the current widget serves the entity dashboard, and the panel renders identically in both contexts: on the entity dashboard the figures describe one URL.

**The PDF report's traffic section moves with the widget and is redrawn to match it.** That section exists only as a property of the widget registration that declares it, so it is re-registered under the new slug — and its three donuts become the three columns, because a printed report should be what the reader saw on screen.

![][image1]

## **Infrastructure**

Almost nothing here is new. The widget registers through the Widgets API into the Traffic areas and contexts that already exist; the tab bar, the metric block, the line chart, the change badge, the loading placeholders and the error and gathering-data states are the ones the rest of the dashboard uses, wired up the usual way.

Five reuses carry weight, because the design depends on a particular property of each:

* **`reportOptions.ts` in the current widget's directory already builds every report the new panel needs.** `getTotalsReportOptions()`, `getGraphReportOptions()` and `getBreakdownReportArgs()` for channels, locations and devices exist because the PDF loader needs the same five reports the dashboard does. It is the one file in that directory the new widget keeps, and it is why the breakdown columns cost no new report definitions.  
* **`getBreakdownReportArgs()` keeps the comparison range in the report args**, so a dimension's current and previous figures come back split by date range inside one report. That is what lets a breakdown row carry a change badge without a second request per column.  
* **The current widget's report hook adds `url` to every report when `getCurrentEntityURL()` returns one, and short-circuits on `canViewSharedModule()`.** Those two behaviors are what make a single registration serve the main and entity dashboards and what stops a view-only user without Analytics issuing requests; both carry over into the new widget's own hook.  
* **`GoogleChart`'s `getChartOptions()` clamps `hAxis.viewWindow` to the selected range and deletes explicit ticks when `gatheringData` is passed**, which is the behavior the chart's gathering-data state is built on rather than around.  
* **`sessionDefaultChannelGrouping`, `country` and `deviceCategory` are all already in `RequestHelpers::validate_shared_dimensions()`**, so all three breakdown reports run on a shared request with no change to the allow-list.

The new work is the widget and its five components, one report hook, a pure helper that turns a comparison report into ranked breakdown rows, one SCSS partial, and the flag. There is no new external dependency: the GA4 Data API is reached the way it always is.

## **Detailed design**

### **Feature flag** {#feature-flag}

The epic is built behind a new `trafficOverview` feature flag.

**The flag selects between two widgets rather than gating one.** In `assets/js/modules/analytics-4/widgets/index.js` the flag decides which registration runs: with it enabled `analyticsTrafficOverview` is registered and `analyticsAllTrafficGA4` is not; with it disabled the reverse. Registering both would put two traffic cards in one area, and gating only the new one would leave the old one in place beneath it.

That branch is the whole of the flag's reach. No PHP reads it, and no other file needs a condition: the old widget's components stay on disk until the flag is removed, unreferenced by anything but the disabled branch.

An issue to remove the flag, the branch and the old widget's remaining files is raised once the feature is stable at 100% — see [Launch plans](#launch-plans).

### **Widget registration and placement**

`TrafficOverviewWidget` registers at full width into `AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY` and `AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY` at priority 1, ahead of Search Console's search funnel at priority 3, so the card is the first thing in the Traffic section on both dashboards.

It registers with `wrapWidget: false` and renders its own `Widget` wrapper, so that it can pass `noPadding` and lay the tab bar flush across the top of the card. `modules` carries `MODULE_SLUG_ANALYTICS_4`, leaving the not-connected and recoverable-module cases to the Widgets API, and the component is wrapped in `whenActive`.

**The registration declares no `isActive`, matching what the widget it replaces declares.** A view-only user whose role has no access to Analytics gets the card with its reports short-circuited rather than no card, which is today's behavior and is a deliberate parity choice rather than an oversight — see [Dashboard sharing](#dashboard-sharing).

The `pdf` entry carries across with the rest of the registration — the same component, loader and label, under the new slug — and its contents are redrawn to match the panel. See [PDF report section](#pdf-report-section).

### **Widget shell**

The widget renders a `Widget` wrapper with no `Header`, which makes the tab bar the first element in the card. The heading copy is the Traffic area's own — "Find out how your audience is growing" over "Track your site's traffic over time", already registered on the area and rendered at the top of the section — so the widget introduces no title string of its own and repeats none of it.

The tab bar reuses `TabBar` and `Tab` from `googlesitekit-components` inside `ScrollableTabs`, the layout Site Goals' own breakdown tabs already use, so tab overflow, keyboard navigation and the desktop scroll arrows behave as they already do elsewhere.

`TrafficOverviewWidget.tsx` holds the active tab in component state and takes its tabs as a list of descriptors — an id, a label and the panel component — so the shell has no knowledge of any individual panel. Each panel is its own component under `traffic-overview/tabs/` and is unmounted when inactive.

**The bar renders while the shell carries its single panel**, rather than being suppressed until a second tab exists. The tab is the panel's label — "Traffic Overview" — which is why the panel renders no heading of its own, and the card's top spacing is the bar's rather than a case designed for its absence. The cost is a tab with nothing to switch to; what it buys is that a second panel is a descriptor added to the list and nothing else, with no spacing rule to revisit and no conditional to unwind.

The shell owns the states the panel does not distinguish for itself:

* **Loading** — `PreviewBlock` placeholders sized per section, held until every report resolves. The five reports are requested together and the sections fill in together, rather than the total appearing seconds before the columns beneath it.  
* **Error** — any of the five reports failed. Renders `WidgetReportError` with the module slug, so the existing retry and request-access affordances apply.  
* **Gathering data** — the property is still gathering data. The chart takes `gatheringData`, the total renders `GatheringDataNotice`, and the breakdown columns render their empty treatment.  
* **Zero data** — the reports resolved with no rows. The panel renders, with the chart's zero-data axis and empty columns, rather than being replaced by a `WidgetReportZero` CTA; a site with no traffic in the selected range still gets a card that says so in place.  
* **Ready** — every figure, the chart and all three columns are on screen.

The footer is a `SourceLink` to the GA4 traffic-acquisition report for the selected date range, carrying the entity URL filter where one is set. **The per-dimension switching the current footer does goes with the dimension tab bar**: with three dimensions on screen at once there is no active dimension for the link to follow, and the traffic-acquisition report is where the channels column — the first of the three — leads.

### **Panel data flow** {#panel-data-flow}

No section component calls a report selector, and only the panel touches the datastore. Two hooks under `traffic-overview/hooks/` carry it:

* `useTrafficReport( reportOptions )` resolves one report. It reads the selected date range and the comparison range off `core/user`, adds the entity URL when `getCurrentEntityURL()` returns one, short-circuits on `canViewSharedModule()` for a view-only user, and returns `{ report, loaded, error }`. **The entity-URL argument is what makes one registration serve both dashboards**, and the view-only guard is what stops a user whose role cannot read Analytics issuing five requests that can only fail.  
* `useTrafficOverviewReports()` calls it five times — once per report below — and returns the reports, a single `loaded` flag and the first error, which is what the shell maps to its states.

| Report | Options builder | Feeds |
| :---- | :---- | :---- |
| `totalUsers` over the range and its comparison range | `getTotalsReportOptions()` | `TotalVisitors` |
| `totalUsers` by `date`, ordered ascending | `getGraphReportOptions()` | `TrafficChart` |
| `totalUsers` by `sessionDefaultChannelGrouping`, both ranges | `getBreakdownReportArgs()` | the channels column |
| `totalUsers` by `country`, both ranges | `getBreakdownReportArgs()` | the locations column |
| `totalUsers` by `deviceCategory`, both ranges | `getBreakdownReportArgs()` | the devices column |

Each report reuses the `reportID` the builders already declare, so a report the PDF export has already resolved for the same range is served from the same cache entry rather than fetched twice.

**The panel issues five reports where the current widget issues three.** The difference is the two breakdown dimensions that are not the active one — reports the current widget issues too, one at a time, as soon as a user touches the dimension tab bar. All five are aggregated queries whose cost does not grow with the size of the site, and the widget's `useInViewSelect` reads mean none of them fire for a card below the fold.

Every section component takes rows and numbers as props and touches no store, which is what makes each renderable from a fixture in Storybook and testable without a registry.

### **Total visitors**

`TotalVisitors` takes the totals report and renders the headline figure with `ChangeBadge` beneath it, formatted through `numFmt`.

`totalUsers` is the metric, as it is today, so the figure does not move as a consequence of this epic.

`ChangeBadge` returns `null` when the previous value is zero and the current one is not, which is the behavior this section wants: a site with no traffic in the previous period shows a total and no badge rather than an unbounded percentage. It renders a zero badge when both periods are zero, which is a true statement rather than a missing one.

**The figure is the whole site's, always.** The breadcrumb the current component renders — "All Visitors ›" followed by the selected dimension value, with a link back — goes with the slice selection it exists to undo. What replaces it is nothing: the title is one string.

### **Traffic chart**

`TrafficChart` renders `GoogleChart` with `chartType="LineChart"` over a two-column table — date and daily visitors — built by a pure function in `traffic-overview/charts/`. Building the table separately from the component puts the date parsing, the tick selection and the zero-data rows under a unit test rather than under inspection.

Three behaviors carry over from the chart it replaces, each for a reason worth keeping:

* **A tick at the start of the range.** The ticks are the plotted dates with the first dropped, so the axis starts with a labelled day rather than with an unlabelled one.  
* **A capped axis when the range is empty.** With no traffic at all the value axis is given a `viewWindow.max` of 100, so a flat zero line sits along the bottom of a plausible axis instead of filling the plot area.  
* **The property-creation marker.** `getPropertyCreateTime()` on `modules/analytics-4` drives a `dateMarkers` entry labelled "Google Analytics property created", so the cliff at the left edge of a young property's chart is explained where it happens. It resolves to nothing for a view-only user, and the marker is simply absent there, as it is today.

**The line color is fixed, and it is the design's rather than today's.** The current chart takes its color from `UI_DIMENSION_COLOR` so that the line matches the selected donut slice; with no selection there is one series and one color, and the design names which one. It is a value in the chart's options rather than a class, so the same value has to reach the printed chart through the PDF theme's own copy of it — see [PDF report section](#pdf-report-section).

`gatheringData` is passed through to `GoogleChart`, which is what puts the chart in its gathering-data treatment and clamps its axis to the selected range.

### **Traffic breakdown** {#traffic-breakdown}

`TrafficBreakdown` ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=552-11543&m=dev)) renders three columns side by side — visitors by channels, by locations, by devices — each a ranked list of values with a count and a change badge per row. It is three components: `TrafficBreakdown` lays the columns out, `TrafficBreakdownColumn` renders one column's heading and rows, and `TrafficBreakdownRow` renders a label, a value and its badge.

The three columns are declared once, in `traffic-overview/breakdown/columns.ts`: the heading copy, the GA4 dimension, and the report-options builder call each one takes. Holding the three against their dimension in one place is what keeps the column order, the copy and the report set from drifting apart across the layout component, the hook and the tests.

**The rows are derived by a pure helper, not by the components.** `getBreakdownRows( report )` in `traffic-overview/utils/` takes a comparison report and returns `Array<{ label, current, previous }>`, ordered by current visitors descending. Three rules live in it:

* **The two date ranges are paired by dimension value, not by row index.** GA4 returns the current and comparison rows in one report split by date range, and a value present in one range and absent from the other has no counterpart row — so the pairing is a lookup keyed on the dimension value, and a missing counterpart is a previous value of zero rather than a shifted row.  
* **The list is capped, and the remainder is aggregated.** Each column shows the top values and an "Others" row summing everything beneath them, at the same cap the donut applies today, so the migration does not change which values a reader sees at the top of a dimension. The "Others" row carries its own aggregated change, and unlike the donut slice it is not interactive, because nothing in this section is.  
* **A column with no rows renders its heading and an empty state**, rather than collapsing, so the three columns keep their widths and a site missing one dimension does not re-flow the other two.

Rows are read-only. **No row selection filters the chart or the total**, and the four `core/ui` keys that carry the current widget's selection — the dimension name, value, color and active row index — are deleted along with the donut. Keeping the interaction is [an alternative we considered](#keeping-the-slice-filtering-on-the-new-rows).

`country` returns GA4's own location names and `deviceCategory` its own device labels; neither is mapped or re-cased in the browser, matching what the donut legend shows today. A `(not set)` value is rendered as returned rather than hidden, since dropping it would make the column's rows fail to add up to the total above them.

### **PDF report section** {#pdf-report-section}

The widget contributes a section to the PDF report through the `pdf` entry on its registration: a component, a data loader, and the label "Site traffic over time" that the section-selection panel lists. The section carries the All visitors tile with the line chart, and three donuts for channels, locations and devices.

**The printed section shows what the reader saw on screen**, which is the rule that decides every question below. The tile and the chart stay, the donuts become the three columns, and the chart is drawn in the panel's line color. A report whose traffic pages still carried donuts would be the one place in the product where the removed control lives on.

The PDF half is not coupled to the dashboard components — `getPDFData` resolves its own reports and `indexPDF.tsx` draws with `@react-pdf/renderer` — so the change is contained in those two files:

* **The loader keeps its five reports and stops rendering donuts.** The totals, graph and three breakdown reports are the ones the panel resolves, built by the same builders; what goes is the donut half — the pie data table, its options and the three renders — leaving `lineChart` as the only entry in `chartImages`.  
* **The rows come from the panel's own helper.** `getBreakdownRows()` replaces `extractAnalyticsDataForPieChart` in the loader, so the printed rows are the rows on screen: the same pairing by dimension value, the same cap, the same "Others" aggregate. The loader's `BreakdownRow` changes shape with it — `{ label, current, previous }` in place of `{ label, percentage }` — because a column shows counts and a change where the donut legend showed a share of the total.  
* **Three ranked tiles replace three donut tiles.** `PDFMetricTileTable` is the existing tile for a ranked list and renders a label and a metric per row, with no per-row change. It gains an optional change field rendered through `PDFChangeBadge`, whose three change colors the PDF theme already defines, rather than a fourth breakdown-only tile being added beside it.  
* **The layout is the All visitors tile above the three columns**, as in the panel, in place of the loop that fills rows two cards at a time. That loop exists because a breakdown whose donut failed to render dropped its tile and left a hole in the grid; with no chart to render there is no such failure, and a dimension with no rows prints its heading and an empty state exactly as its column does on screen.  
* **The line color is a copy and has to be copied again.** `@react-pdf/renderer` cannot read the dashboard's CSS, so `PDF_COLORS` holds hand-copied values of the Sass tokens and the chart options reference one of them. The panel's line color has to be added there and referenced, and the failure mode is worth naming because nothing reports it: the screen and the print diverge silently.

`reportOptions.ts` moves into the new widget's directory along with both of its readers. It sits in the old widget's directory today because the loader and the dashboard components shared it across that boundary; once both are the new widget's, the file belongs beside them.

Neither the label nor the section's position changes. "Site traffic over time" still describes the section, and the report renders each area's widgets in registration priority order, which the new widget keeps at 1\.

### **Removing the All Traffic widget** {#removing-the-all-traffic-widget}

The old widget is deleted in full, and the removal is the part of this epic that reaches outside its own directory. Four things go beyond the components:

1. **The registration.** `analyticsAllTrafficGA4` and its two area assignments are removed from the disabled branch of the flag check once the flag is retired.  
2. **The five `core/ui` keys.** `UI_DIMENSION_NAME`, `UI_DIMENSION_VALUE`, `UI_DIMENSION_COLOR`, `UI_ACTIVE_ROW_INDEX` and `UI_ALL_TRAFFIC_LOADED` in the module's `datastore/constants.ts` have no consumer outside the deleted directory and are removed with it. `UI_ALL_TRAFFIC_LOADED` exists to delay a feature tour while the widget loads, and the tour that reads it is the one retargeted below.  
3. **The welcome feature tour.** Its traffic step targets `.googlesitekit-widget--analyticsAllTrafficGA4` and floats against `.googlesitekit-widget--analyticsAllTraffic__user-count-chart`. The first class is generated from the widget slug, so it becomes `.googlesitekit-widget--analyticsTrafficOverview`; the second is hand-written on the chart wrapper and is retargeted to the new chart's own class. **The step's copy — "Know what's normal for your site" — still describes the card it points at**, so only the selectors move.  
4. **The SCSS partial.** `_googlesitekit-widget-analyticsAllTraffic.scss` is replaced by a partial for the new widget and its import in `admin.scss` updated. The donut-specific rules in `_googlesitekit-dashboard-charts.scss` go with it.

What is deliberately *not* deleted is the PDF half. `reportOptions.ts`, `getPDFData.ts` and `indexPDF.tsx` move into the new widget's directory and are edited in place rather than removed and rewritten, along with their tests — see [PDF report section](#pdf-report-section).

`useAllTrafficWidgetReport` is deleted with the widget it is named for. Its two non-obvious behaviors move into `useTrafficReport` rather than being rediscovered — see [Panel data flow](#panel-data-flow).

### **Architecture requirements**

New front-end code lives under `assets/js/modules/analytics-4/components/traffic-overview/`, laid out as `widgets/` for the registered widget and its shell, `tabs/` for the panel, `components/` for the section components, `charts/` for the chart and its table builder, `breakdown/` for the column catalog and its renderers, `hooks/`, `utils/` and `constants.ts`. Components are TypeScript function components, one component per file, with co-located tests and Storybook stories.

The PDF component and its loader move into the same directory as `pdf/`, and `reportOptions.ts` sits at the directory root, where the panel's hooks and the PDF loader both read it.

Three existing files change outside the new directory, and they are the ones to call out at review: `assets/js/modules/analytics-4/widgets/index.js` gains the branch on the flag, `assets/js/feature-tours/welcome.ts` gains the two retargeted selectors, and `assets/js/components/pdf-export/shared-react-pdf-components/PDFMetricTileTable.tsx` gains its optional per-row change.

The widget wraps its export in `withIntersectionObserver` and reads reports through `useInViewSelect`, so neither the view event nor the five report requests fire for a card below the fold — the same treatment the widget it replaces has.

### **REST infrastructure**

None. Every figure comes from `GET:report` on `Analytics_4`, which the module already serves, and this epic adds no datapoint, no route and no setting. The five reports are ordinary report requests and are cached by the API layer under their own arguments like any other.

## **Common considerations**

### **Dashboard sharing** {#dashboard-sharing}

The widget follows the existing Dashboard Sharing rules for the `analytics-4` module, and **nothing about sharing changes in this epic**: every dimension the five reports query — `date`, `sessionDefaultChannelGrouping`, `country` and `deviceCategory` — is already in `RequestHelpers::validate_shared_dimensions()`, so a shared request runs all five under the module owner's credentials exactly as it runs the three today.

The card renders for a view-only user whose role has Analytics shared, with the same figures an authenticated user sees. For a view-only user whose role does not, `useTrafficReport` returns nothing for every report and the panel holds its loading state — which is what the widget it replaces does, carried over deliberately so that the migration changes no view-only behavior. Adding an `isActive` that hides the card in that case is a correctness improvement and belongs with the Widgets API's own gating rather than inside this replacement.

The property-creation marker is the one element that differs by context: `getPropertyCreateTime()` is not a view-only settings key, so the marker is absent in the view-only dashboard, as it is today.

### **Tester plugin**

Nothing new is required. Every state the panel has follows from the five reports, and the existing report-forcing support reaches all of them: an empty report for the zero-data state, a failing report for the error state, and the module's gathering-data flag for the third.

Two cases are worth naming because they need forced data rather than a real property: a breakdown dimension with more values than the cap, so the "Others" row is exercised, and a dimension value present in the current range and absent from the comparison range, which is the row-pairing rule in [Traffic breakdown](#traffic-breakdown).

### **Site Health**

The epic adds no debug fields. Nothing about the widget is persisted or scheduled, and every figure it draws is a report a support engineer can already run.

### **Feature Discovery**

The widget is introduced by nothing — no notification, tour step or badge of its own. It lands in the slot the All Traffic widget occupies, in a section users already read, showing the same headline figure over the same chart, so there is no new surface to point at.

The existing welcome tour keeps its traffic step, retargeted to the new card's selectors — see [Removing the All Traffic widget](#removing-the-all-traffic-widget).

### **Internal Measurement: GA4 Events**

The epic adds no tracking events, and retires two. `slice_select` and `help_click` under `${ viewContext }_all-traffic-widget` are emitted by the donut — the first when a slice is selected, the second when a reader opens the support link inside an "(other)" or "(not set)" tooltip — and both describe an interaction that no longer exists. Nothing in the new panel is interactive, so there is no successor event to define.

### **Internal Measurement: Feature Metrics**

None. The widget records no outcome and has no lifecycle to count.

## **Alternatives considered**

### **Converting the existing widget rather than building a new one**

The widget could be changed in place: delete `UserDimensionsPieChart` and `DimensionTabs`, add the three columns beside the existing `TotalUserCount` and `UserCountGraph`, and keep the registration, the slug, the CSS classes, the tour selectors and the PDF entry exactly as they are. Nothing outside the directory would move, and the epic would need no flag branch at all.

We build new. What survives conversion is two components out of six, and both of them change: the total loses its breadcrumb and its selection-clearing link, the chart loses its selection-driven color. The four `core/ui` keys thread the selection through every one of those components, so removing the selection is not a deletion at the edges but a rewrite through the middle of each file — with the old props, the old tests and the old snapshots to carry through it. Building beside the old widget also lets both exist behind a flag, which is what makes the change reversible in production and reviewable as one thing rather than as six.

The cost is that the tour selectors and the PDF entry both move, and that the old directory lives on disk until the flag is retired. Both are named where they are handled.

### **Keeping the donut and adding the columns beside it**

The card is wide enough to carry the donut and a column list together, which is closer to what exists and keeps the visual anchor readers already recognize.

We drop the donut. It shows one dimension, so a donut beside three columns is a fourth view of data already in the second one, and the two would have to agree about caps, ordering and the "Others" aggregate at all times. A share-of-total ring also cannot show what the columns exist to show: the change against the previous period, which is the figure that tells a reader whether a channel is worth their attention.

### **Keeping the slice filtering on the new rows** {#keeping-the-slice-filtering-on-the-new-rows}

The rows could be selectable, filtering the chart and the total to a dimension value as the donut does today. It is a genuinely useful capability, it is already implemented, and dropping it is a loss of function rather than only of complexity.

We make the rows read-only. **The headline figure is the widget's most-read number and it should mean one thing** — the site's visitors in the period — rather than a filtered subset the reader may have selected minutes ago and scrolled past. With three columns on screen the ambiguity is worse than with one donut: three independent selections would either compose into a multi-dimension filter the reports would have to express, or overwrite each other, and neither is legible from the rows themselves. The Analytics deep link in the footer is where a reader who wants one channel's own trend goes, and it lands on the report that answers it.

If per-dimension filtering returns, it returns as an explicit control with its own visible state rather than as a side effect of clicking a list.

### **Registering the three columns as three separate widgets**

Each column could be its own registered widget in the Traffic area, gated and loaded independently by the Widgets API, with its own report and its own error state.

The design is one card with one tab bar, which the Widgets API cannot express across separate widgets: each registered widget renders in its own grid cell. Independent gating buys nothing either, since all three columns depend on the same module, the same date range and the same eligibility, and three independent error states in one row is a worse failure mode than one.

### **Leaving the entity dashboard on the old widget**

The new widget could register into the main dashboard only, with `analyticsAllTrafficGA4` staying on `AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY`. The entity dashboard is the less-visited surface and the narrower change is the safer one.

We register into both. Keeping the old widget alive on one dashboard keeps its entire directory alive — the donut, the dimension tabs, the four `core/ui` keys and their tests — so the epic would end with two traffic widgets, two sets of breakdown behavior and no removal at all. Nothing in the panel is main-dashboard-specific: the reports take the entity URL the same way the current ones do, and a breakdown of channels, locations and devices for a single URL is the same question the donut answers there today.

## **Future Work**

### **A per-dimension trend without leaving the dashboard**

A reader who wants one channel's own daily line currently follows the footer link into Analytics. Bringing that back into the card — as an explicit, visibly-stated filter rather than as a click on a list row — is worth doing on its own terms, with its own design for how the filter is shown and cleared. It is not a restoration of the donut's behavior and should not be scoped as one.

### **A breakdown dimension the reader chooses**

The three dimensions are fixed. Channels, locations and devices are what the widget has always offered and what every property has without configuration, but a site whose traffic is best explained by landing page or by campaign has no way to say so. Letting the reader pick the third column, or add a fourth, is a follow-up with a persistence question of its own.

## **Dependencies**

None beyond the GA4 Data API, which the module already depends on. No Site Kit Service endpoint, no other module and no other team's work gates this epic; it can be built, reviewed and shipped on the plugin's own schedule.

## **Migrations**

No migrations are required. Nothing about either widget is persisted: the dimension selection the old widget carries lives in `core/ui` for the lifetime of a page, and the PDF export's section selection lives in the `core/pdf` store's own in-memory state rather than in a user setting, so the widget slug changing under it costs a reader nothing across a reload.

## **Technical debt**

Two items:

1. **Two widgets exist in the tree until the flag is retired.** The old directory, its tests and its snapshots stay on disk behind the disabled branch of the flag check, so a search for a traffic component returns two answers and a reader has to know which one is live. The mitigation is that the flag-removal issue deletes the directory rather than only the condition, and it is written that way from the start.  
2. **A shared PDF tile grows a field for one caller.** `PDFMetricTileTable` is used by tiles across several modules, and the optional per-row change the breakdown columns need is rendered by none of them. The alternative — a breakdown-only tile duplicating the same card, heading and row layout — is the worse trade, but the widening is real and the next ranked tile that wants a change badge should reuse it rather than adding a second one.

# **Quality attributes**

## **Security**

No new surface. The epic adds no REST route, no datapoint, no capability and no request parameter, and issues no request the module does not already issue. Every value rendered is a GA4 report figure the requesting user can already read in the dashboard, and every label — a channel name, a country name, a device category — is GA4's own controlled vocabulary rendered as a React child.

## **Reliability**

The five reports are independent, and the panel treats them as one unit: any error puts the card in `WidgetReportError`, with its existing retry. That is the same all-or-nothing treatment the current widget applies to its three reports, and it is the right one here — a panel showing a total and a chart with three empty columns beneath them is harder to read than an error with a retry.

**Two more reports mean two more ways for the card to fail**, and that is the honest cost of showing three dimensions at once. All five are the same class of aggregated query against the same property, so a failure that takes one is overwhelmingly likely to take all five, which is the case the shared error state serves.

Nothing is persisted and nothing is scheduled, so there is no state to recover: a reload re-resolves five reports, and a cleared browser cache costs round trips rather than correctness.

## **Privacy**

No data leaves the site that does not leave it today. The epic requests no new OAuth scope, creates no custom dimension, and collects nothing from site visitors. The two breakdown dimensions that are new to a default page load — locations and devices — are already queried by the current widget as soon as a reader touches its dimension tabs, and both are GA4's own aggregated categories rather than anything resolvable to a person.

## **Scalability**

Report count is fixed at five and does not grow with the size of the site: every query is aggregated, the two comparison reports carry their current and previous windows as two date ranges in one request, and the breakdown reports are capped by GA4's own ordering rather than by row counts the browser has to filter. A site with 100k posts issues the same five requests a site with ten does.

The largest response is the daily series, at one row per day over the selected range — 90 rows at the widest range the selector offers. The breakdown reports return one row per dimension value in each of two ranges, of which the panel renders a handful.

The two additional reports relative to today are the measurable cost, and they are paid on first render rather than on a dimension-tab click. `useInViewSelect` is what keeps them off the initial page load for a reader who never scrolls to the Traffic section.

## **Accessibility (a11y)**

The tab bar reuses `TabBar` from `googlesitekit-components` inside `ScrollableTabs`, which already handles arrow-key navigation and deliberately keeps its scroll arrows out of the tab order because keyboard navigation scrolls the active tab into view. The panel needs correct `role="tabpanel"` and `aria-labelledby` wiring.

**The breakdown is a gain here rather than a cost.** The donut's data is reachable only through its legend, and its slice tooltips are hover-triggered HTML; three columns of text rows are readable in document order with no interaction at all. Each column is a labelled region, each row pairs its label with its value and change in reading order, and the change badges need a non-visual equivalent so that direction is not carried by color and an arrow glyph alone.

The chart needs a non-visual equivalent as the existing dashboard charts do, and the property-creation marker's text has to be reachable without hovering it.

## **Internationalization (i18n)**

Every string in the widget is a plugin string translated as usual. Numbers and percentages are formatted through `numFmt` throughout, including inside the change badges and the "Others" row, so one convention applies across the card.

Three column headings sitting side by side is the layout constraint worth naming: headings that expand under translation have a third of the card's width each, so the column component has to wrap its heading rather than being tuned to the English one. The same applies to the longest GA4 channel and country names, which are returned by the API in the user's Analytics locale and are not the plugin's to shorten.

# **Project management**

## **Work estimates**

| \# | Title | Design Doc Points | GH Points |
| :---- | :---- | :---- | :---- |
| 1 | [Traffic Overview feature flag](https://github.com/google/site-kit-wp/issues/13406) | 7 |  |
| 2 | [Register the Traffic Overview widget with its tab shell and source link](https://github.com/google/site-kit-wp/issues/13407) | 11 |  |
| 3 | [Traffic Overview: total visitors with period comparison](https://github.com/google/site-kit-wp/issues/13408) | 7 |  |
| 4 | [Traffic Overview: daily traffic chart](https://github.com/google/site-kit-wp/issues/13409) | 11 |  |
| 5 | [Traffic Overview: three-column traffic breakdown](https://github.com/google/site-kit-wp/issues/13410) | 11 |  |
| 6 | [Loading, gathering-data, zero-data and error states](https://github.com/google/site-kit-wp/issues/13411) | 7 |  |
| 7 | [Redraw the PDF report's traffic section to match the new panel](https://github.com/google/site-kit-wp/issues/13412) | 15 |  |
| 8 | [Remove the All Traffic widget and retarget the welcome tour](https://github.com/google/site-kit-wp/issues/13413) | 7 |  |

**TOTAL: 72 STORY POINTS across 8 issues**

The flag issue lands first and carries the branch in `assets/js/modules/analytics-4/widgets/index.js` with an empty registration behind it, so every issue after it is additive and independently shippable.

**The widget registration is the shell and nothing else** — the `Widget` wrapper, the tab bar, the panel component, the two report hooks and the footer link — with the three sections stubbed. It is sized for the fact that the report hooks are where the entity URL and the view-only guard live, and that getting either wrong is invisible on the main dashboard as an authenticated user.

**The breakdown is the largest section issue and the one carrying real logic.** It owns three components, the column catalog, and `getBreakdownRows()` — where the date-range pairing, the cap and the "Others" aggregate are each wrong-but-plausible in a way that reads correctly on a site with five channels. Its acceptance criteria have to name the pairing case: a dimension value present in one range and absent from the other.

The states issue lands after every section exists, because it is the one that needs them all present to be worth reviewing, and it owns the decision to keep the panel rendering on zero data rather than substituting a CTA.

**The PDF issue depends on the breakdown issue and on nothing else**, because what it needs from the dashboard is `getBreakdownRows()` and the line color. It moves the three PDF files, edits them in their new home, and widens the shared ranked tile — so it lands before the removal, which then finds the old directory holding nothing anyone reads.

**The removal lands last and is a real issue rather than cleanup.** It deletes what is left of the old directory, the five `core/ui` constants and the SCSS partial, and it retargets the welcome tour's two selectors — the one change in this epic that is invisible in the widget's own tests and visible only when the tour runs.

## **Documentation in-product**

The card carries the same footer source link into Analytics that it does today, and needs no new support article. Nothing in the panel is unexplained: a total, a daily chart and three ranked lists are the plainest reading of data the dashboard already shows, and the one element that could puzzle a reader — the property-creation marker on the chart — carries its own label.

The "(other)" and "(not set)" support links the donut's tooltips carry are retired with the tooltips. Those two Analytics articles explain why a *slice* is labelled that way; a `(not set)` row in a ranked list beside its visitor count needs no article to be legible, and adding a help icon per row would be noise in a section whose point is that it is scannable.

## **Testing plan considerations**

The data is easy here, which is the main difference from anything the Traffic section has needed recently: every state follows from five ordinary reports and none of them needs a property with particular history.

Jest covers the panel's state machine driven from report fixtures, and the sections from decoded props. `getBreakdownRows()` is the one piece with an exact expected value for every input and belongs under a unit test rather than under a rendered assertion: the date-range pairing, a value missing from one range, the cap, the "Others" aggregate and its change, and an empty report.

Storybook stories cover the panel in loading, gathering-data, zero-data, error and ready states, which also gives VRT coverage of the three-column layout at each breakpoint — the place a heading that wraps to three lines or a column that collapses will show up.

Two cases are worth naming because they are easy to miss:

1. **The entity dashboard.** The panel renders there with `url` on every report, and the reports it issues are not the ones the main dashboard issues. A test that dispatches an entity URL and asserts the report arguments is what catches a hook that drops it.  
2. **The view-only dashboard**, where `canViewSharedModule()` is what decides whether the reports run at all, and where the property-creation marker is absent.

The PDF section keeps the test files it has, edited rather than replaced: the assertions about the three donut renders go with the renders, and what is worth adding in their place is that the loader's rows for a report are the panel's rows for that same report. That equality is the whole claim the printed section rests on, and it is the thing that quietly stops being true the next time the cap or the pairing rule changes on one side only.

The removal needs its own coverage: the welcome tour's traffic step must resolve its target, which is assertable against the rendered widget rather than only by running the tour.

## **Launch plans** {#launch-plans}

The epic follows Site Kit's usual staged rollout. The `trafficOverview` flag is enabled for 20% of users through the Site Kit Service, and — absent critical issues — for the remaining 80% two weeks later.

**The rollout replaces a shipped widget rather than adding one**, which is what makes the staged percentages matter more here than they usually do: the 20% cohort loses the donut and the dimension filtering at the same moment they gain the columns, and the feedback that matters in the first two weeks is about what they can no longer do.

There is no external dependency, so the flag can be enabled as soon as the epic is complete.

An issue to remove the `trafficOverview` flag, the registration branch and the old widget's remaining files should be raised once the feature is stable at 100%.

# **Open questions**

None.

# **Appendices**

The following are implementation-level details that can be settled at the Implementation Brief stage of the individual issues.

### **Report arguments**

What each of the five reports asks for, and therefore the fixtures every front-end issue is built against. Every one of them takes the selected range's `startDate` and `endDate`, and takes `url` when an entity URL is set.

| Report | Metrics | Dimensions | Comparison range | Order |
| :---- | :---- | :---- | :---: | :---- |
| Totals | `totalUsers` | — | Yes | — |
| Graph | `totalUsers` | `date` | No | `date` ascending |
| Channels | `totalUsers` | `sessionDefaultChannelGrouping` | Yes | `totalUsers` descending |
| Locations | `totalUsers` | `country` | Yes | `totalUsers` descending |
| Devices | `totalUsers` | `deviceCategory` | Yes | `totalUsers` descending |

Each carries the `reportID` its builder already declares, which is what makes a report the PDF export has resolved for the same range a cache hit rather than a second request.

### **Breakdown row derivation**

`getBreakdownRows( report )` returns `Array<{ label, current, previous }>` and applies, in order:

1. Split `report.rows` by date range, keying each side on the dimension value.  
2. Pair the two sides on that key. A value present only in the current range takes `previous: 0`; a value present only in the comparison range is dropped, since it has no place in a list ordered by current visitors.  
3. Order by `current` descending.  
4. Take the top rows up to the cap, and sum every remaining row's `current` and `previous` into one trailing "Others" row. Where nothing remains, no "Others" row is added.

The cap and the "Others" label match what `extractAnalyticsDataForPieChart` applies to the donut today, so the same values appear at the top of a dimension before and after the migration.

[image1]: <data:image/png;base64,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>