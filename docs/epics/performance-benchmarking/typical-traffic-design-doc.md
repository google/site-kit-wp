# **\[SK\] Part 2 \- Typical Traffic Design**

| Reviewer | Role | Status | Last Change |
| :---- | :---- | :---- | :---- |
| [Mariya Moeva](mailto:mmoeva@google.com) | Approver | Not Started |  |
| [Evan Mattson](mailto:emattson@google.com) | Approver | Not Started |  |

***Visibility:** Confidential*   
***Status:*** *Review*  
***Author(s):** [Eugene Manuilov](mailto:eugene.manuilov@fueled.com)*  
***PRD:** [Performance intelligence: site benchmarking & forecasts in Site Kit \[PRD\]](https://docs.google.com/document/d/1zwM9ogRlrFO__rLFVYT6SE1qqsjIwzfFUELBiLnYHUQ/edit?pli=1&tab=t.0)*  
***Figma Designs:** [Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=552-10409&m=dev)*  
***Last Major Revision:** Aug 18, 2026* 

# **Context**

## **Objective**

This epic adds a second tab, **Typical Traffic**, to the `analyticsTrafficOverview` widget on the main dashboard: thirteen months of the site's own daily traffic in one chart and a section naming the factors that moved traffic in the selected period — together with the server-side datapoint that gathers and derives everything the tab draws.

## **Background**

The Traffic Overview tab answers "how many visitors did I get, and where did they come from?" over the selected date range. What it cannot answer is whether the number is normal.

Most site owners have neither the analytics background nor the historical context to judge a 12% dip. Without a sense of their own seasonality, a normal January decline reads as a crisis and a seasonal December spike reads as a growth trend. Answering that needs two things the Overview tab does not have. The first is the site's own history well beyond the 90-day maximum of the header date-range selector, so that the current period can be read against the shape of the year around it. The second is a comparison across every dimension at once — channels, devices, visitor mix, referrers, content, categories and search queries — so that a movement can be attributed rather than only observed.

Neither is a report the browser should be issuing. Thirteen months of daily rows and seven comparison reports across two modules is eight requests to compose one view, one of which belongs to Search Console and would be issued from inside an Analytics widget. This epic puts that gathering on the server, in one datapoint whose only parameters are the two dates the dashboard already has.

# **Design**

## **Overview**

We will add a second tab to the existing `analyticsTrafficOverview` widget, behind a new `typicalTraffic` feature flag. The tab renders two sections:

1. **Typical traffic chart** — daily visitors across the trailing thirteen months, ending where the selected date range ends. It is the site's own shape over a year, not the 28 or 90 days the header selector offers.
2. **Key factors** — what moved traffic in the selected period, one section per dimension, ordered by how much of the site's movement each dimension accounts for.

Behind it, four new pieces:

1. **A datapoint that gathers and derives.** `GET:benchmarking-data` on `Analytics_4` runs the GA4 reports, collects Search Console rows through a filter, derives the daily series and the ranked dimension rows, and returns everything the tab draws.  
2. **A filter Search Console answers.** `googlesitekit_benchmarking_contextual_data` is where the search-query rows come from, so no module holds a reference to another.  
3. **A flat wire format.** One positional encoding, written in PHP and read in JS, which is what keeps a response of four hundred daily rows and seven dimension arrays affordable in browser storage.  
4. **A datastore slice.** `modules/analytics-4` gains a `benchmarking` slice that resolves the response and decodes it.

**Nothing about this feature is cached on the server.** Search Console and Analytics report data is not stored server-side, which rules out a transient in front of the datapoint. The response is cached by the API layer in browser storage under the two dates it depends on, like any other `GET`.

**The tab is gated on thirteen months of property history and the Traffic Overview tab is not.** A property younger than that cannot support a year of context, and the gate is on the tab rather than on the widget so that a young site keeps the traffic card it already has — see [Gating and visibility](#gating-and-visibility).

**The tab is main-dashboard only.** The analysis is a whole-site one, and thirteen months of one URL's traffic is not the question the entity dashboard asks; `GET:benchmarking-data` has no URL parameter at all.

**The whole tab works in the view-only dashboard.** The datapoint is shareable, so the reports run under the module owner's credentials on a shared request exactly as every other shared report does — see [Dashboard sharing](#dashboard-sharing).

![][image1]

## **Infrastructure**

Almost nothing on the front end is new. The tab is one more descriptor in the widget shell that already holds its tabs as a list; the chart, the loading placeholders, the change badges and the error state are the ones the rest of the dashboard uses. The server-side half has a working precedent in Email Reporting, which already runs GA4 and Search Console reports to compose a payload rather than to answer a single report request.

Six reuses carry weight in the design, because it depends on a particular property of each:

* **`Module::get_data()` and `Module::set_data()` dispatch a datapoint in-process.** That is how the data datapoint runs its reports: no HTTP hop and no REST round trip, using the module's own service client — see [Report gathering](#report-gathering).  
* **`Module::get_oauth_client_for_datapoint()` resolves the client per datapoint**, including for a nested in-process dispatch, which is what carries the datapoint into the view-only dashboard — see [Dashboard sharing](#dashboard-sharing).  
* **`GET:batch-report` on `Analytics_4` runs up to five report requests per GA4 call.** The reports the response needs therefore cost two round trips rather than seven, chunked the way `Email_Reporting_Data_Requests::collect_batch_reports()` chunks them.  
* **`POST:searchanalytics-batch` on `Search_Console`** answers the query rows the same way, which is what the [contextual-data filter](#cross-module-contextual-data) hands back, and it answers them on a shared request too.  
* **The API layer caches `GET` responses in browser storage, keyed on the datapoint and an MD5 of its query parameters.** That is what holds the response, under the two dates it depends on, with no cache of the slice's own.  
* **`Custom_Dimensions_Data_Available`** answers server-side whether `googlesitekit_post_date` and `googlesitekit_post_categories` are gathering data, which decides whether those two reports are run at all — see [Response assembly](#response-assembly).

The new infrastructure is the gathering and the transport in front of it: one `Analytics_4` datapoint, the filter Search Console answers, the [wire format](#wire-format) both languages read, and the `benchmarking` datastore slice behind them. The external dependencies are the GA4 Data API and the Search Console API, reached the way they always are.

## **Detailed design**

### **Feature flag**

The epic is built behind a new `typicalTraffic` feature flag.

The tab descriptor is added to the widget shell's tab list under the flag check, so with the flag off the widget carries the tabs it carries today and nothing about the Traffic section changes. The datapoint is added to `Analytics_4::get_datapoint_definitions()` only when the flag is enabled, and Search Console adds its [contextual-data callback](#cross-module-contextual-data) under the same check — with the flag off neither module carries any benchmarking code into a request.

Two additions sit outside the flag: `sessionSource` among the [shareable dimensions](#report-gathering) and `propertyCreateTime` among the [view-only settings keys](#gating-and-visibility). Both are single entries in allow-lists the rest of the plugin reads on every request, and making what a shared report may query depend on a feature flag is a worse property than the widening itself. Neither is reachable by the tab with the flag off.

### **Gating and visibility** {#gating-and-visibility}

The tab is present when all of:

1. The `typicalTraffic` flag is enabled — implicit, since the descriptor is added under the check.  
2. The view context is the main dashboard, authenticated or view-only. The entity dashboard renders the widget with the Traffic Overview tab alone.  
3. The property has enough history: `getPropertyCreateTime()` on `modules/analytics-4` is at least 13 months back.

**Condition 3 gates the tab and not the widget, and that distinction is the load-bearing one.** The widget is the site's traffic card: a property connected last month must keep its visitor total and its daily chart. Putting a history requirement on the widget's own `isActive` would take the whole card away from exactly the sites least able to spare it. So a young property gets the widget with one tab, and the tab appears — with no dismissal, notification or announcement — on the day the property is old enough to support it.

**Condition 3 holds in the view-only dashboard, and nothing is relaxed for it.** It needs `propertyCreateTime` added to `Analytics_4\Settings::get_view_only_keys()` — without it a view-only user resolves `getPropertyCreateTime()` to nothing and the condition can never pass, and with it the history gate stays one condition evaluated the same way for everyone.

**That widening has one visible side effect outside this tab, and it is a welcome one.** The Traffic Overview chart marks the property's creation date from the same selector and currently draws nothing for a view-only user, because the value does not reach them. Once the key is shared, the marker appears there too — the same explanation of the same cliff, for a reader who could previously only see the cliff.

The gate and [what the chart plots](#typical-traffic-chart) do not measure the same history. The gate asks for 13 months from the property's creation; the chart asks for 13 months before the selected range's `endDate`. A property that has only just passed the gate therefore has a chart whose earliest weeks are the property's own first weeks, which is where the property-creation marker on the chart earns its place. **The chart draws whatever the property has rather than waiting for a full window**; what the gate buys is that there is a year of shape to look at at all.

Where the property is old enough but the traffic is thin, the tab still renders. Whether it should — and what "too thin to call anything typical" means — is an [open question](#what-is-the-minimum-history-and-volume-for-the-typical-traffic-tab?).

### **Widget shell changes**

The shell holds its tabs as a list of descriptors and its active tab in component state, so the tab is one conditional entry in that list and one panel component under `traffic-overview/tabs/`.

Three consequences of adding a second tab are the shell's rather than the panel's:

* **A panel is unmounted when inactive**, so `GET:benchmarking-data` is not requested until a reader selects the tab. The first selection therefore shows a loading state, and the second is instant because the API layer holds the response for the hour. **The datapoint's cost is paid by the readers who open the tab**, which is the right default for the more expensive of the two panels.  
* **The tab bar now has something to switch to**, which settles the question of whether it renders.  
* **Tab state resets on reload**, as it does today. The card opens on Traffic Overview every time, and nothing persists a preference.

The shell resolves nothing on the new tab's behalf: the panel owns its own request, unlike the Overview panel whose reports the shell's hooks resolve. Each panel resolving its own data is what keeps a reader who never opens the second tab from paying for it.

### **Panel data flow** {#panel-data-flow}

No section component in the tab calls a selector, and only the panel touches the datastore. One hook in `traffic-overview/hooks/`, `useBenchmarkingData()`, reads the selected date range off `core/user`, calls the [`benchmarking` slice's](#datastore-slice) selectors with those two dates, and returns the decoded response, a loading flag and an error.

The response decodes into the fields the sections render:

| Field | Shape | Rendered by |
| :---- | :---- | :---- |
| `visitors` | `{ current, previous }` totals for the selected period | `KeyFactors`, for the site-level movement each factor is measured against |
| `dailyTraffic` | one row per day across the thirteen-month window: `{ date, visitors }` | `TypicalTrafficChart` |
| `dimensions` | dimension codes ordered by absolute movement, highest first | the order `KeyFactors` walks its sections in |
| `contextualData` | the dimension arrays, keyed by code, each row `{ label, current, previous }` | `KeyFactors` |

Both the response's shape and its field names are the plugin's own: camelCase, flat, and unrelated to anything the reports return. What crosses the wire is the positional [wire format](#wire-format); the table above is what the slice's decoder produces from it, and it is the shape every section component is written against.

Every section component takes rows and numbers as props and touches no store, which is what makes each of them renderable from a fixture in Storybook and testable without a registry. The fixture is one decoded object per state rather than a set of report responses per section.

### **Typical traffic chart** {#typical-traffic-chart}

`TypicalTrafficChart` renders `GoogleChart` with `chartType="LineChart"` over a two-column table — date and daily visitors — built by a pure function in `traffic-overview/charts/`.

**The window is thirteen months and it is not the header's.** The selected date range decides where the window ends and nothing else about it: the chart plots the 395 days up to and including the selected range's `endDate` whether the reader has 28 or 90 days selected. That independence is the tab's whole point — a chart that shrank to the selected range would answer the same question the Overview tab already answers — and it is the one thing about this chart a reader has to understand, which is what the section's support link covers.

Three consequences follow from the window rather than from the series:

* **The x axis carries monthly ticks**, formatted `MMM`, over transparent gridlines. Weekly ticks at this width are unreadable and daily ticks are not tick marks at all.  
* **The value axis is fitted to the whole window**, so a seasonal peak eleven months back sets the scale the current period is read against. That is the comparison the chart exists to make, and it is also why a site with one viral week has a flat-looking year — a property of the data rather than of the chart.  
* **The selected range is marked rather than isolated.** A shaded region spanning the selected range's `startDate` to `endDate` shows the reader where the rest of the dashboard is looking inside the year. It is drawn as a React child positioned in `GoogleChart`'s `ready` handler from `getChartLayoutInterface()` — `getChartAreaBoundingBox()` for the plot box and `getXLocation( date )` for the two edges — the way `DateMarker` already positions its line, and it re-positions on redraw because `ready` fires again. An overlay that paints *behind* the plotted line needs a negative `z-index`, which only works inside a stacking context, so the chart's wrapper takes a modifier class giving it `z-index: 0` and the chart declares `backgroundColor: 'transparent'`.

The property-creation marker carries over from the Overview chart, through `dateMarkers` and `getPropertyCreateTime()`, and matters more here: on a property between 13 and 14 months old it explains the flat run at the left edge of the window.

`gatheringData` is not passed. `getChartOptions()` clamps `hAxis.viewWindow` to the *selected date range* in that state, which would crop thirteen months down to 28 days; the panel's own [loading and insufficient-data states](#panel-states) cover what the flag would.

Whether the series is plotted as raw daily counts or smoothed is an [open question](#is-the-thirteen-month-series-plotted-daily-or-smoothed?).

### **Key factors**

`KeyFactors` ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=702-24771&m=dev)) renders one section per dimension that moved traffic in the selected period, in the order the response gives them, each naming the values that moved and by how much. Every value comes from `contextualData`; the section derives nothing.

Seven dimensions can appear, each with a code:

| Code | Rows | Source |
| :---- | :---- | :---- |
| `CHANNELS` | channel name, current and previous visitors | `sessionDefaultChannelGrouping` |
| `DEVICES` | device category, current and previous visitors | `deviceCategory` |
| `VISITOR_MIX` | new or returning, current and previous visitors | `newVsReturning` |
| `REFERRERS` | referring source, current and previous visitors | `sessionSource` |
| `SEARCH_QUERIES` | query, current and previous clicks, current and previous position | the [contextual-data filter](#cross-module-contextual-data) |
| `CONTENT` | page path and title, visitors, days since publication | `pagePath` filtered on `customEvent:googlesitekit_post_date` |
| `CATEGORIES` | category name, current and previous visitors | `customEvent:googlesitekit_post_categories` |

Each code maps to an entry in a catalog in `traffic-overview/factors/registry.ts`: its title copy, the `contextualData` key it reads, and the component that renders it. **The catalog is what a code resolves to, and three rules live in the lookup rather than in the components:**

* A code with no catalog entry is dropped, so a code the response adds later costs one section rather than the panel.  
* A code whose `contextualData` key is absent from the response is dropped as well. The response orders only the dimensions it carries, so this should not arise; the lookup treats it as no section rather than as an empty one.  
* Sections render in the response's order and the panel shows the top few. Which few, and whether the rest are reachable at all, is a layout decision the catalog does not make.

**The ordering is derived server-side, not in the browser.** The datapoint ranks the dimensions by the absolute change each accounts for and returns that order — see [Response assembly](#response-assembly). Ranking in the browser would mean every consumer of these rows re-deriving the same arithmetic over the same numbers, and it would put the decision about what counts as movement on the side of the wire with the weakest guarantees about how a number is printed.

Each section's copy is the plugin's own: translated patterns filled with `sprintf` over values formatted through `numFmt`, with a `ChangeBadge` per row. The rows carry a label, a value and a change, and no shared row component in the plugin has a column for the change, so the row list is a new component — shared with nothing, since the Overview tab's breakdown columns render a different shape.

`SEARCH_QUERIES` is the one entry whose rows are not a label and two numbers: a query carries clicks and average position, and a position that *fell* numerically is an improvement. Its renderer is the reason a catalog entry carries a component rather than only a `contextualData` key.

### **Data datapoint** {#data-datapoint}

`GET:benchmarking-data` is a `Shareable_Datapoint` implementing `Executable_Datapoint` under `includes/Modules/Analytics_4/Datapoints/`, taking the module instance, `Credentials` and `Context` through its `$definition` array.

**Its only request parameters are `startDate` and `endDate`**, the two every report datapoint already takes. The thirteen-month window, the comparison window, the reports, the ranked rows and the dimension order are all derived from them.

Unlike the module's other datapoints it is not a wrapper over one service call, so it does not use `create_request()`/`parse_response()` to shape a single Google API call. It returns a closure over three steps:

1. **Gather.** Two batched GA4 report calls, and one Search Console call through the filter — see [Report gathering](#report-gathering). A GA4 failure ends the request with the module's own `WP_Error`, which is what puts the tab in its error state. A Search Console failure costs one `contextualData` key and nothing else.  
2. **Derive.** The zero-filled daily series, the period totals, the ranked dimension rows and the dimension order — see [Response assembly](#response-assembly).  
3. **Encode.** The [wire format](#wire-format): the positional arrays the tab decodes.

The datapoint implements `Permission_Aware_Datapoint`, and the check it declares is the dashboard-viewing capability rather than the authenticated-dashboard one, so a view-only user reaches it.

It lives on the Analytics module rather than in a new core controller because every input is GA4 and Search Console data and every consumer is an Analytics widget.

**Everything the tab draws is in this one response.** One request means one loading state and one error state, and it means the sections fill in together rather than one at a time.

### **Report gathering** {#report-gathering}

The datapoint runs reports through `Module::get_data()` and `Module::set_data()`, which dispatch a datapoint in-process against the module's own service client — the same path Email Reporting uses to compose its payload, with no HTTP hop and no REST permission round trip.

GA4 reports go through `GET:batch-report`, which takes up to five report requests per call. `Analytics_4` therefore answers the response in two calls rather than seven:

| Report | Feeds |
| :---- | :---- |
| `totalUsers` by `date`, ascending, over 395 days ending on `endDate` | `dailyTraffic`, and the `visitors` totals for both windows |
| `totalUsers` by `sessionDefaultChannelGrouping`, both windows | `CHANNELS` |
| `totalUsers` by `newVsReturning`, both windows | `VISITOR_MIX` |
| `totalUsers` by `deviceCategory`, both windows | `DEVICES` |
| `totalUsers` by `sessionSource`, both windows | `REFERRERS` |
| `screenPageViews`/`totalUsers` by `pagePath`, filtered on `customEvent:googlesitekit_post_date` | `CONTENT` |
| `totalUsers` by `customEvent:googlesitekit_post_categories`, both windows | `CATEGORIES` |

Each dimension report carries its current and comparison window as two date ranges in one request rather than as two requests. The last two are requested only where `Custom_Dimensions_Data_Available` says the dimension is not gathering data, so a site without either issues five reports rather than seven — one batched call instead of two.

**Both `visitors` totals come out of the daily series rather than out of a totals report.** The selected period and the one before it are at most 180 days together, comfortably inside the 395 the series already spans, so summing is free and — more usefully — guarantees the headline the tab compares against cannot disagree with the chart above it.

**`sessionSource` is added to the shareable dimension list in `RequestHelpers::validate_shared_dimensions()`.** Every other dimension above is already in it; without this one a shared request fails as a whole batch rather than losing the `REFERRERS` rows, and the tab's error state is what a view-only user sees. Widening the list is the deliberate choice over dropping `REFERRERS` on a shared request, which would make the response depend on which kind of user loaded the dashboard first. A traffic-source name is the same class of data as the channel grouping already on the list.

The report options live in `includes/Modules/Analytics_4/Benchmarking/Report_Options.php`, following the `Email_Reporting/Report_Options.php` precedent, which keeps every window and dimension in one readable place rather than spread through the datapoint.

### **Cross-module contextual data** {#cross-module-contextual-data}

`Analytics_4` does not call Search Console. It applies a filter and takes what comes back:

```php
$contextual_data = apply_filters(
	'googlesitekit_benchmarking_contextual_data',
	$contextual_data,
	array(
		'start_date'         => $start_date,
		'end_date'           => $end_date,
		'compare_start_date' => $compare_start_date,
		'compare_end_date'   => $compare_end_date,
		'row_limit'          => $row_limit,
	)
);
```

`Search_Console::register()` adds the callback that answers with the `SEARCH_QUERIES` rows, deriving them through its own `POST:searchanalytics-batch` datapoint and its own settings, in a `Benchmarking\Report_Data_Builder` alongside the `Email_Reporting` one. The callback returns the array untouched unless the module `is_connected()`, so a site without a verified property simply omits the key — the same degradation the response already defines for a missing custom dimension. Search Console is force-active, so its `register()` always runs and the connection check is the only gate that matters.

Sharing is the second gate, and it is Search Console's own rather than Analytics'. The callback's report runs under the Search Console owner's credentials for a view-only caller, but only where `search-console` is shared with that caller's role; where it is not, the report fails and the key is omitted for that request. **No cache pools that difference across callers**: every stored copy of a response lives in the requesting user's own browser, so two callers who assemble different responses are never served each other's.

**No module holds a reference to another.** Analytics owns the extension point and the response shape; Search Console owns its own reports, credentials and connection state; a later module with something to contribute adds a callback rather than an edit to the Analytics datapoint. The cost is that the response's contents are not readable from one file alone, which is why the keys and their row shapes are specified under [Response assembly](#response-assembly) rather than left to the callbacks.

The datapoint validates the returned array against those keys and shapes before it encodes — unknown keys dropped, scalars cast, the same row cap applied — because the filter is public and what comes back reaches the dashboard. A callback that errors or returns something unusable costs its key, not the request.

### **Response assembly** {#response-assembly}

Every field is derived in PHP by [the data datapoint](#data-datapoint), from the reports it has just run:

| Response field | Derived from |
| :---- | :---- |
| `dailyTraffic` | the 395-day daily series, zero-filled |
| `visitors` | the same series, summed over the selected window and the one before it |
| `contextualData` | each dimension report, paired across its two date ranges, ranked and capped |
| `dimensions` | the dimension codes, ordered by the absolute movement each accounts for |

Four rules the assembly holds to:

* **GA4 returns no row for a day with no traffic**, so the series is keyed by date and the gaps are filled with zeros before anything is computed. A missing day must not shorten the window or shift every later row's position, which in a format whose [date axis is implicit](#wire-format) it otherwise would.  
* **A dimension's two windows are paired by value, not by row index.** A value present in one window and absent from the other has no counterpart row, so the pairing is a lookup keyed on the dimension value and a missing counterpart is a previous value of zero.  
* **Each dimension's rows are scored, filtered, ranked and capped** before they are encoded — see [Key factor scoring](#key-factor-scoring) for the score and the filters. The rows the response carries are the rows the tab renders, so the cap bounds both what a reader sees and what browser storage holds — an [open question](#how-many-rows-does-each-dimension-carry?).  
* **The dimension order is the sum of its surviving rows' scores**, descending. A dimension whose values all moved a little ranks below one where a single value moved a lot and explains the site's own trend, which is the ordering a reader wants: the section that explains the most goes first. This is also the ordering the Traffic Insights design forwards to the generative endpoint as `ranked_dimensions`, expressed in the service's own dimension codes via the mapping the two epics share.

The comparison window is the preceding window of the same length, computed off the two request parameters. The tab sends dates rather than the date-range slug, so the cache key changes when the reference date rolls over instead of holding yesterday's answer under today's range.

The assembly has to be deterministic — stable ordering, stable rounding, stable row caps — because that is what makes it testable against fixtures, and because two runs over unchanged figures that serialize differently are two cache entries.

Assembly lives in `includes/Modules/Analytics_4/Benchmarking/` — `Report_Options` for the windows and dimensions, a response builder over the report rows, and the [wire format](#wire-format)'s encoder — as classes with no dependency on the REST layer, so PHPUnit can drive them from fixed report fixtures.

### **Key factor scoring** {#key-factor-scoring}

One formula scores every row in every dimension, so a query, a channel and a device are ranked on the same scale. For a row with `current` and `previous` visitor (or click) counts, against the selected period's site-wide `visitors.current` and `visitors.previous`:

1. **`delta`** `= current - previous`.  
2. **`trafficImpactPct`** `= delta / MAX( visitors.previous, visitors.current ) * 100` — the row's own change as a percentage of the larger of the two site-wide totals, so a rapidly growing site doesn't inflate a row that only kept pace with it.  
3. **`selfChangePct`** `= delta / previous * 100`, or `100` when `previous` is `0` and `current` is greater than `0` — how much the row itself moved, independent of the site.  
4. **`siteGrowthRate`** `= ( visitors.current - visitors.previous ) / visitors.previous` for the period as a whole.  
5. **`excessImpactPct`** `= ( delta - previous * siteGrowthRate ) / MAX( visitors.previous, visitors.current ) * 100` — how far the row's own movement departs from what the site's overall growth rate alone would have predicted for it, as a percentage of the site-wide total.  
6. **`score`** `= ( 0.6 * ABS( trafficImpactPct ) + 0.4 * ABS( excessImpactPct ) ) * weight * boost`.

`weight` is fixed per dimension — `CONTENT` 1.5, `SEARCH_QUERIES` 1.4, `REFERRERS` 1.3, `CATEGORIES` 1.2, `CHANNELS` 1.1, `DEVICES` 1.0, `VISITOR_MIX` 1.0 — so a specific driver outweighs a broad one of equal raw impact, on the reasoning that `DEVICES` and `VISITOR_MIX` usually only mirror a channel or referrer shift counted elsewhere. `boost` is `1.25` when the row's own direction agrees with the site's overall direction and `1.0` otherwise; the site's direction is `UP` when its period-over-period change is at least `3%`, `DOWN` at `-3%` or below, and `STABLE` between them, and a row's own direction follows the same sign convention on its `delta`.

A row is dropped — scored but never ranked, capped or summed into its dimension's total — when any of these hold:

* **The significance floor.** `ABS( delta ) < 5` or `ABS( trafficImpactPct ) < 0.40`. Below this a row is noise on any site's traffic.  
* **The counter-trend filter.** The row's direction opposes the site's overall direction, and it clears neither `ABS( trafficImpactPct ) >= 1.0` nor ( `ABS( selfChangePct ) >= 10` and `ABS( delta ) >= 25` ). A site growing overall can still have individual values that fell; this is what keeps a handful of visitors moving the wrong way out of an ordering built to explain the site's own trend.  
* **The macro-divergence filter, on `DEVICES` and `VISITOR_MIX` rows only.** `ABS( selfChangePct - totalPctChange ) < 5`, where `totalPctChange` is the site's own period-over-period percentage change. A device or segment that only tracks the site's overall change explains nothing beyond it.

Within a dimension, its surviving rows are ranked by `score`, descending, and capped per [the row-cap open question](#how-many-rows-does-each-dimension-carry?). Across dimensions, `dimensions` orders on the sum of each dimension's surviving row scores, descending — an empty dimension, every one of whose rows was dropped, carries no entry.

### **Wire format** {#wire-format}

The response is positional rather than keyed: a row is an array whose index `n` means the same field on both sides of the wire, rather than an object repeating its keys once per row.

Volume is what forces it. Thirteen months of daily rows is 395 of them, and beside them up to seven capped dimension arrays whose labels are page titles, search queries and referrer hostnames. As objects with per-row date strings and repeated keys that is tens of kilobytes of browser storage per date range, held for an hour, per date range a reader opens.

Six rules define the format:

1. **Positions, not keys.** A `constants.ts` on the JS side and a matching set of class constants on the PHP side name every index. Neither a component nor a builder ever writes a literal index.  
2. **The date axis is implicit.** One start date, then one row per day. The derivation already zero-fills the days GA4 omits, so the row count is the day count and 395 date strings become one.  
3. **A string table at the head.** Labels, URLs and post titles are hoisted into one array and referenced by index, so a URL appearing in two dimensions is stored once.  
4. **PHP rounds once.** Every non-integer is rounded server-side before encoding, and the browser never re-rounds or re-serializes a number.  
5. **An enum travels as its index in a fixed list**, not as its string. A dimension code is a number; a decoder that does not recognize one falls back the way an unrecognized catalog entry does.  
6. **A version integer leads the encoded structure**, and a decoder that does not recognize it treats the response as unusable rather than guessing. The browser cache prefix already carries `GOOGLESITEKIT_VERSION`, so a cached response cannot outlive a plugin update; the version is insurance for a request already in flight across one.

**The contract is a decoder in JS against an encoder in PHP, not a codec on each side.** The browser never encodes anything, so half of the ways two implementations of one format can disagree do not exist. What is left is checked in as one JSON fixture that **both** the PHP encoder's PHPUnit test and the JS decoder's Jest test read. That shared file is the mechanism that keeps the two sides honest; a description of the layout in prose is not.

The layout is in the [appendix](#wire-format-layout).

### **Datastore slice** {#datastore-slice}

A new `assets/js/modules/analytics-4/datastore/benchmarking.ts` slice, combined into the module store, over one `createFetchStore`:

| Fetch store | Params | Request |
| :---- | :---- | :---- |
| `getBenchmarkingData` | `{ startDate, endDate }`, both required and `YYYY-MM-DD` | `API.get`, `cacheTTL: HOUR_IN_SECONDS` |

* `getBenchmarkingData( startDate, endDate )` — the decoded response the [panel reads](#panel-data-flow). Its resolver fetches, then decodes; the decoded object is what is stored, so a re-render does not re-decode four hundred rows.  
* `isLoadingBenchmarkingData( startDate, endDate )` — resolution state and the fetch store's in-flight flag.  
* The failure is the error store's: `getErrorForSelector( 'getBenchmarkingData', [ startDate, endDate ] )` carries the status the datapoint returned, and the panel maps it to its error state.

One action, `clearBenchmarkingData( startDate, endDate )`, drops the stored value and the API layer's cache entry through `invalidateCache()`. It runs on the error state's retry. **There is nothing else to invalidate**: no server-side entry exists, so a cleared browser cache means the next mount goes all the way to the reports.

The hour the API layer holds the response for is its default and is the right one here: the figures move as the day accumulates, and a tab that is one hour stale on the current day while the Overview tab beside it is not would be visible to a reader comparing the two.

### **Panel states** {#panel-states}

Three states the panel distinguishes, all decided by the one request:

* **Loading** — `PreviewBlock` placeholders sized per section, held until the response resolves. This is the state the tab is in the first time a reader selects it.  
* **Error** — the request failed: the GA4 reports behind it errored, or the datapoint itself did. Renders `WidgetReportError` with the module slug, so the existing retry and request-access affordances apply.  
* **Ready** — the chart and every factor section are on screen.

There is no separate gathering-data state. A property gathering data cannot be 13 months old, so the [history gate](#gating-and-visibility) has already removed the tab. There is no zero-data state either: a property with 13 months of history and no traffic in the selected period gets a chart showing exactly that, and factor sections whose rows are zeros, which is a more honest answer than a CTA.

### **Architecture requirements**

New front-end code joins the existing widget directory: `assets/js/modules/analytics-4/components/traffic-overview/` gains a panel under `tabs/`, its chart under `charts/`, the factor catalog and its renderers under `factors/`, one hook, and the format's field indices in `constants.ts` — where nothing outside that file holds a literal index. Components are TypeScript function components, one component per file, with co-located tests and Storybook stories.

New PHP lives in two places: `includes/Modules/Analytics_4/Datapoints/` for the datapoint, and `includes/Modules/Analytics_4/Benchmarking/` for the report options, the response builder and the wire format's encoder — with `includes/Modules/Search_Console/Benchmarking/` for the callback that answers the [contextual-data filter](#cross-module-contextual-data), the same per-module layout `Email_Reporting/` already uses on both modules.

Three existing files change outside this feature, and they are the ones to call out at review: `Analytics_4\Settings::get_view_only_keys()` gains `propertyCreateTime`, `Analytics_4\Report\RequestHelpers::validate_shared_dimensions()` gains `sessionSource`, and `Analytics_4::get_datapoint_definitions()` gains the datapoint under the flag check.

### **REST infrastructure**

One new datapoint, no new route. `GET:benchmarking-data` is dispatched by the `READABLE` branch of the module datapoint route like any other read, and implements `Permission_Aware_Datapoint` for its own permission check. The GA4 and Search Console reports behind it are dispatched in-process rather than over REST, so the report routes are involved only in the dashboard's other widgets.

**Opening the tab is one request.** Everything after it, for the hour the response is held, is answered from browser storage without reaching the server.

## **Common considerations**

### **Dashboard sharing** {#dashboard-sharing}

The tab follows the existing Dashboard Sharing rules for the `analytics-4` module. It renders wherever the widget does, and **`GET:benchmarking-data` is shareable**, so a view-only user gets the whole tab.

It needs no branch for it: the reports run under the module owner's credentials through `get_oauth_client_for_datapoint()`, exactly as every other shared report does. Two changes are what make that work, specified where each belongs — `sessionSource` in the [shareable dimension list](#report-gathering) and `propertyCreateTime` among the [view-only settings keys](#gating-and-visibility).

**Nothing is pooled across users, so no sharing boundary runs through a cache.** Every stored copy of every response lives in the requesting user's own browser, behind a key prefix that hashes their login and session. A view-only user with Analytics but not Search Console shared gets a response without the `SEARCH_QUERIES` key and a tab built on that response and no other — which follows from where the cache lives rather than from anything the datapoint does.

The consequence to state plainly is that **two view-only users of the same dashboard can see different factor sections**, where one's role has Search Console shared and the other's does not. That is the correct outcome — a reader should not be shown rows they have no access to — and it is visible rather than hidden, because a dimension with no data has no section.

### **Tester plugin** {#tester-plugin}

The states that matter for QA are hard to produce on a real site: a property with 13+ months of history and a genuine seasonal shape, and each combination of dimensions that drives a different ordering of the factor sections.

One filter over the response covers almost all of it, and it is the single point where the states behind it are reachable: an absent `contextualData` key, a dimension with rows but no movement, a dimension order that puts an unusual code first, a daily series with gaps GA4 would have omitted, and a series whose earliest months predate the property.

The history gate should be forceable on and off, so the tab is reachable without a mature property and absent with one.

Reaching any forced state needs the browser cache out of the way, which `setUsingCache( false )` covers. **There is nothing to clear on the server**: a forced response takes effect on the next request rather than after a stored one expires.

The view-only path needs its own coverage, since it is the same path rather than a reduced one: a shared request under the owner's token, and a shared request whose caller cannot read Search Console data, against the same date range.

### **Site Health**

The epic adds no debug fields. Nothing about the tab is persisted or scheduled, and the datapoint composes its answer inside the request that asks for it, so there is no stored outcome or timing for a debug field to expose.

### **Feature Discovery**

The tab is introduced by nothing — no notification, tour step or badge. It appears in a card the reader already uses, beside a tab they already read, and a tab bar is its own affordance.

The one discovery question the tab does raise is answered by not answering it: a property that becomes eligible gains the tab silently rather than announcing it. Announcing it would mean a notification whose trigger is a date computed from `getPropertyCreateTime()`, for a tab the reader has never seen and cannot miss.

### **Internal Measurement: GA4 Events**

The epic adds no tracking events.

### **Internal Measurement: Feature Metrics**

None. Nothing in the tab records an outcome.

## **Alternatives considered**

### **Gathering the reports in the browser rather than in PHP**

The alternative was to derive everything client-side: the panel fetches the GA4 and Search Console reports through `getReport`, pairs and ranks the rows in `utils/`, and needs no datapoint at all. That reuses the plugin's reporting stack as it stands — caching and de-duplication, `areReportsLoading`, `getFirstReportError`, gathering-data and partial-data state, the `reportID` conventions.

We derive in PHP. Three properties of this particular data decide it:

* **The derived data has exactly one consumer.** Shared report caching pays off when several widgets read the same report, and nothing else on the dashboard reads a 395-day daily series or six dimension reports with comparison windows. One derived response cached under the date range serves this tab better than seven reports the rest of the dashboard never asks for.  
* **The cross-module dependency leaves the front end.** Client-side, the tab issues a Search Console request from inside an Analytics widget, wiring one module's reporting into another's component tree. Server-side it is a filter Search Console answers on its own terms, and neither module holds a reference to the other — see [Cross-module contextual data](#cross-module-contextual-data).  
* **One language owns the ranking.** The pairing, the ranking, the row caps and the rounding happen once, in PHP, and the browser renders the result. Deriving them in JS would put the same arithmetic on the side of the wire that has the weakest guarantees about number formatting, and would put the dimension order — which decides what a reader sees first — in the component that renders it.

The costs are real. The daily series is fetched twice on the Traffic section — once client-side for the Overview chart, once inside the benchmarking request — because the two paths do not share a cache. Loading is all-or-nothing across the tab rather than per section. And a reader who opens the tab pays for seven reports where the Overview tab's five are already warm.

### **Keyed JSON on the wire instead of a positional format**

The response could be the flat camelCase shape the components read, with no encoding step: readable in devtools, no version integer, no shared fixture, and no format implemented twice.

We encode. 395 daily rows with a date string and a key per field, beside seven capped dimension arrays, is several times the bytes in browser storage — held for an hour, per date range a reader opens, in a store the plugin shares with every other cached response. **A format is the cheapest thing in this design to get right and the most expensive to change later**, which is the argument for fixing it now rather than after the response has more in it.

What it costs is named under [Technical debt](#technical-debt): one format, two languages, and a field added to one without the other is a silent misread rather than a type error. The shared fixture both test suites read is the mitigation, and it is a convention this epic introduces rather than one the repo already enforces.

### **Calling Search Console directly instead of filtering for its rows**

`Analytics_4` could resolve the Search Console module from `Modules` and call its datapoint, which is what `Email_Reporting_Data_Requests` does — an `if`/`elseif` over module slugs in one place that knows both modules. It is less indirection, and the whole response is then readable from one file.

The filter wins on which module owns what. Search Console's connection state, its property setting, its report shape and its failure modes stay behind its own callback instead of being conditions inside an Analytics datapoint; the extension point is declared once and any later contributor adds a callback rather than an edit. The Email Reporting precedent is a Core class composing two modules it is allowed to know about, which is not the position `Analytics_4` is in here.

The cost is that the response's contents are not enumerable from the datapoint alone, and a badly behaved callback holds up the one request the tab is waiting on. The first is answered by specifying the keys and row shapes under [Response assembly](#response-assembly); the second is the same exposure any `apply_filters()` in a request path carries.

### **Gating the whole widget on thirteen months of history**

The history requirement could sit on the widget's `isActive`, which is one condition in one place and removes the need for the panel to reason about eligibility at all.

We gate the tab. The widget is the site's traffic card, and a property connected two months ago needs its visitor total and its daily chart more than a mature one does. Moving the gate up would take the whole card away from those sites — a regression introduced by an epic that adds a feature — in exchange for a simpler conditional.

### **Telling the reader why the tab is missing**

A young property could get the tab anyway, with a panel explaining that thirteen months of history are needed and naming the date the analysis becomes available — which is exactly computable from `getPropertyCreateTime()`.

We show no tab. A tab is a promise that there is something behind it, and an empty one that explains its own absence is a worse version of not being there: it costs a reader a click to learn nothing actionable, on every visit, for up to a year. The eligibility date is better placed in support documentation, which is where a reader who wonders why goes — see [Documentation in-product](#documentation-in-product).

### **Plotting the selected date range on the Typical Traffic chart**

The chart could follow the header selector like every other chart in the dashboard, which is the consistent behavior and needs no explanation to anyone.

We fix the window at thirteen months. A chart that shrinks to 28 days plots the same series the Overview tab already plots and answers the same question, which leaves the tab with nothing of its own; and the comparison the tab exists to support — is this period normal for this site? — needs a year of the site's own shape behind the period to be a comparison at all. The cost is one chart in the dashboard that does not follow the selector, which the section's support link and the shaded selected-range region are what make legible.

## **Future Work**

### **The Typical Traffic tab on the entity dashboard**

The tab is main-dashboard only. A per-URL version is a different analysis rather than the same one filtered: a single page's traffic over thirteen months is dominated by its own publication date, and the dimension breakdown behind the factor sections is thin for most URLs. If it is wanted, it needs its own design for what "typical" means for one page.

### **Low-traffic handling**

Low-traffic sites need rolling averages, more cautious language and de-emphasized short-term change. The chart's thirteen-month window already does part of that by putting a week's noise next to a year's shape, but the factor sections still report a change on rows whose absolute numbers are small enough for the change to be meaningless. What that should do — suppress the badge, widen the cap, or say something different — is a follow-up, and it overlaps with [the smoothing question](#is-the-thirteen-month-series-plotted-daily-or-smoothed?).

## **Dependencies**

No new external dependency. The GA4 Data API and the Search Console API are both already depended on, and no Site Kit Service endpoint, other team's work or Google-side approval gates this epic.

The one internal dependency is the widget this tab is added to: the shell that holds its tabs as a list, and the directory the panel lands in. Everything in this epic is additive to it — no existing tab, component or report changes.

Search Console is a soft dependency rather than a hard one. Where it is disconnected, or shared with a role that a view-only reader does not have, the `SEARCH_QUERIES` section is absent and the rest of the tab is unaffected.

## **Migrations**

No migrations are required. Nothing the tab reads or draws is persisted: the response is composed and discarded inside the PHP request that produced it, and its only copy lives in browser storage.

## **Technical debt** {#technical-debt}

Two items:

1. **One format is implemented twice, in two languages.** The [wire format](#wire-format)'s encoder is PHP and its decoder is JS, and a field added to one without the other is a silent misread rather than a type error. The shared fixture both test suites run against is the mitigation, and it is a convention this epic introduces rather than one the repo already enforces. The debt is real and the alternative — keyed objects on the wire — costs several times the bytes in browser storage.  
2. **The plugin derives analytical inputs on behalf of one tab.** `Benchmarking/` exists because the browser is the wrong place to pair, rank and cap seven dimension reports. If those rows ever gain a second consumer, the derivation is in the right place already; if the tab is removed, it is dead weight and should be deleted rather than maintained. Keeping it in classes with no REST or widget dependencies is what makes that removal a deletion rather than an unpicking.

# **Quality attributes**

## **Security**

The new surface is one read datapoint and one public filter. Two risks:

**A public filter feeding the dashboard.** `googlesitekit_benchmarking_contextual_data` lets any plugin on the site contribute rows, and any string it returns is rendered in the dashboard. **The data datapoint validates what the filter hands back rather than forwarding it**: known keys only, the row shape each key declares, scalars cast, and the same row cap applied to filtered rows as to derived ones. That keeps a third-party callback to the same contract Search Console's own is held to.

**Rendered report data.** Page titles and search-query strings originate from site content and from visitors' searches. Every one of them is rendered as a React child rather than as HTML, and no string in the response reaches `dangerouslySetInnerHTML`.

**Authorization.** The datapoint implements `Permission_Aware_Datapoint` and declares the dashboard-viewing capability, so the existing `REST_Modules_Controller` permission dispatch applies and a view-only user reaches it. Left to the route it would inherit the `READABLE` branch's broader default; declaring the check is what makes it correct rather than merely permissive.

**A view-only user's request runs under the owner's identity**, which is the same delegation every shared GA4 report already performs, under the same conditions and widened by nothing here beyond the one dimension added to the shareable list.

## **Reliability**

The tab is one request, and it either resolves or it does not. A GA4 failure puts the panel in `WidgetReportError`, which is what that component exists for; a Search Console failure costs one factor section and nothing else, because the filter's contribution is optional by construction.

**The request is reports and arithmetic, and nothing in it waits on a third party the plugin does not already depend on.** Two batched GA4 calls and one Search Console call complete well inside `max_execution_time` on the hosting the plugin runs on, and there is no outbound call whose duration the plugin cannot predict.

Local data loss is not a concern: nothing about the feature is persisted anywhere in the plugin. A browser cache that is cleared, a session store that is evicted, or a storage backend that is unavailable altogether costs report round trips, not correctness — every request treats a miss as the normal case, and none of them reads state it cannot rebuild.

**The Overview tab is unaffected by anything here.** It resolves its own reports through its own hooks, so a failure of `GET:benchmarking-data` leaves the card's first tab exactly as it was.

## **Privacy**

The response carries the site's own analytics data to the browser: aggregate visitor counts, top URLs with their titles and publication ages, channel and category names, referrer hostnames, and search queries with their clicks and positions. All of it is data the requesting user can already read in the dashboard.

No new OAuth scope is requested. No new custom dimension is created, so no additional data is collected from site visitors. Search queries are Search Console's already aggregated and anonymized queries.

**Nothing this feature reads is stored on the site.** The response is assembled and discarded inside the PHP request that produced it. Where it is held is browser storage, under a key prefix hashing the plugin version, the WordPress user's login, their auth session token and the blog ID — so an entry does not outlive a logout and does not reach another user of the same browser. The preferred backend is `sessionStorage`, so in practice it does not outlive the tab.

## **Scalability**

**The unit that scales is the number of distinct date ranges opened per reader per hour.** A full miss costs two batched GA4 calls and one Search Console call. A repeat over the same dates in the same tab is answered from browser storage without reaching the server.

Report count does not grow with the size of the site: every query is aggregated, each dimension report carries its current and comparison window as two date ranges in one request, and the [row caps](#how-many-rows-does-each-dimension-carry?) bound what comes back. Batching is what keeps the seven reports to two calls, which matters here more than it does elsewhere because they are serial inside one PHP request rather than parallel across the browser's connection pool.

The largest of them is the daily series: 395 rows, well inside the GA4 Data API's default row limit, and linear to zero-fill and sum. The [wire format](#wire-format) is what keeps those rows to a kilobyte or so in the response rather than several.

Nothing in the feature iterates posts, users or terms, so a site with 100k posts behaves the same as a small one.

## **Accessibility (a11y)**

The tab panel needs correct `role="tabpanel"` and `aria-labelledby` wiring, and the tab bar's own keyboard behavior is `TabBar`'s and already correct.

The chart needs a non-visual equivalent, as the existing dashboard charts do. Two things on it carry information that must be reachable without sight of the plot: the shaded region marking the selected date range, whose meaning is otherwise carried by a background tint alone, and the property-creation marker.

The factor sections are text in reading order, which is the easy case — each is a labelled region, and each row pairs its label with its value and change. The change badges need a non-visual equivalent so that direction is not carried by color and an arrow glyph alone, and the `SEARCH_QUERIES` rows need one for position as well, where a numerically lower value is an improvement and no color convention conveys that.

## **Internationalization (i18n)**

Every string in the tab is a plugin string translated as usual, and every number and percentage is formatted through `numFmt`, including inside the factor copy. The factor sections are `sprintf` over translated patterns rather than concatenated fragments, so a language that orders a sentence differently can.

Three constraints worth naming:

1. **The chart's monthly tick labels** are the shortest form of a month name in the reader's locale and there are thirteen of them across the plot width. A locale whose abbreviated month names are long is the case the tick density has to survive.  
2. **GA4 returns channel, device and country names in the property's own language**, not the plugin's, so a factor section can carry API-supplied labels beside translated chrome. The two must not be concatenated into one translatable string.  
3. **Page titles and search queries are the site's and its visitors' own**, in any script and any direction, and the row component has to truncate them without assuming a writing direction.

# **Project management**

## **Work estimates**

| \# | Title | Design Doc Points | GH Points |
| :---- | :---- | :---- | :---- |
| 1 | Typical Traffic feature flag | 3 |  |
| 2 | Add the benchmarking wire format: the PHP encoder, the JS decoder and the fixture they share | 11 |  |
| 3 | Add the `GET:benchmarking-data` datapoint | 11 |  |
| 4 | Gather the GA4 reports and derive the benchmarking response in PHP | 19 |  |
| 5 | Add the `googlesitekit_benchmarking_contextual_data` filter and Search Console's callback | 11 |  |
| 6 | Make `GET:benchmarking-data` shareable and widen the two allow-lists | 11 |  |
| 7 | Add the `benchmarking` datastore slice | 11 |  |
| 8 | Add the Typical Traffic tab to the widget shell with its history gate | 11 |  |
| 9 | Typical Traffic: the thirteen-month traffic chart | 15 |  |
| 10 | Typical Traffic: key factors section | 15 |  |
| 11 | Loading and error states for the Typical Traffic tab | 11 |  |

**TOTAL: 129 STORY POINTS across 11 issues**

**The wire format is the first thing to land after the flag and the contract everything else is built against.** The encoder, the decoder and the [shared fixture](#wire-format) are a small, self-contained issue with no dependency on a report, a datapoint or a component, and once it exists the server-side half writes against the encoder while the panel and its sections read a decoded fixture. Agreeing the layout early is what lets the two halves proceed in parallel, and the [panel data flow](#panel-data-flow) table is the version to agree.

Report gathering and response assembly is the largest server-side issue and the one most likely to need splitting when its brief is written: it owns the report options for every dimension, the batching, the zero-fill, the value pairing, the ranking, the row caps and the dimension order. Splitting it by report group — the daily series and period totals first, the dimension reports second — is the obvious line if it is needed.

Sharing is critical path rather than a follow-up: without it the view-only dashboard shows an error where the tab should be. It is separate from the datapoint because it is verifiable on its own — a dispatch as a view-only user — and because the two allow-list additions need reviewing as what they are.

**The chart is sized for its window rather than for its series.** Two columns and a line is the easy part; the monthly tick selection, the axis fitted to thirteen months, and the selected-range overlay positioned from the chart layout interface are the work — and the stacking-context rule that makes the overlay visible is the kind of thing that is invisible in review and obvious in VRT.

The key factors section carries the catalog, seven renderers and the `SEARCH_QUERIES` row shape that is unlike the other six. It renders whatever order the response gives it, so its brief has to name the cases that are awkward to reach naturally: a dimension whose key is absent, and an order whose first entry is one of the two custom-dimension codes.

The states issue lands last because it needs both sections present to be worth reviewing, and it owns the decision to render a chart of zeros rather than a zero-data CTA.

## **Documentation in-product** {#documentation-in-product}

The tab needs support links in two places, resolved through `getDocumentationLinkURL()` on `core/site`:

1. **Beside the chart**, explaining the thirteen-month window: that it does not follow the date-range selector, that the shaded region is the selected period, and that the earliest months of a recently created property are the property's own first weeks rather than a quiet season.  
2. **An explanation of why the tab does not appear for properties with insufficient history**, reachable from support rather than from the dashboard, since the tab is absent in that case. This is where the exact eligibility rule belongs — thirteen months from property creation — for the reader who wonders why their site has one tab and a colleague's has two.

The support team drafts these before rollout; the slugs are added with the links.

## **Testing plan considerations**

The hard part is data. The tab needs a property with 13+ months of history and a real seasonal shape for the chart to show anything worth looking at, and the two custom-dimension sections need `googlesitekit_post_date` and `googlesitekit_post_categories` to have been collecting long enough to return rows. QA therefore depends on tester-plugin support for forcing the response, listed under [Tester plugin](#tester-plugin), plus access to an Analytics property with genuine history.

**The derivation is PHPUnit's and the rendering is Jest's**, and the response is the seam between them. PHPUnit covers the assembly on hand-built report fixtures: the zero-fill over days GA4 omitted, a dimension value present in one window and absent from the other, the ranking and the caps, the dimension order, and the filter contract — including a callback that errors and one that returns the wrong shape. Jest covers the panel's states and the sections, driven from decoded fixtures rather than from report responses. Storybook stories cover the tab in loading, error and ready states, which also gives VRT coverage.

**The [wire format](#wire-format) is the one thing both suites test, and they test it against the same file.** The PHP encoder's test asserts that a fixed set of derived values encodes to the checked-in fixture, and the JS decoder's test asserts that the same fixture decodes to the objects the sections expect. A field added on one side without the other fails one of the two rather than producing a silent misread in the dashboard. One case beyond the happy path belongs here: an unknown version integer, which must be rejected rather than guessed at.

**The view-only path belongs in PHPUnit rather than only in manual QA**: a shared request must resolve the owner's client for the reports, which is assertable by dispatching the datapoint as a view-only user. The Search-Console-not-shared case belongs beside it — a response with one key fewer, and a tab that renders one section fewer rather than erroring.

Three cases are worth naming because they are easy to miss and awkward to reach naturally:

1. **A property between 13 and 14 months old**, where the chart's window starts before the property did and the earliest weeks are genuinely empty.  
2. **A dimension whose rows all moved by the same amount**, which is what the dimension ordering has to break deterministically rather than by report order.  
3. **Selecting the tab twice**, which must issue one request rather than two — the property that the API layer's hour-long entry is what makes cheap, and the one that silently regresses if the resolver is keyed on anything but the two dates.

## **Launch plans**

The epic follows Site Kit's usual staged rollout. The `typicalTraffic` flag is enabled for 20% of users through the Site Kit Service, and — absent critical issues — for the remaining 80% two weeks later.

There is no external dependency, so the flag can be enabled as soon as the epic is complete. What gates it in practice is the eligible population: only properties with 13+ months of history see anything at all, so the 20% cohort's usable size is smaller than the percentage suggests and the first two weeks' feedback will be correspondingly thinner.

An issue to remove the `typicalTraffic` flag and its conditional logic should be raised once the feature is stable at 100%.

# **Open questions**

## **Is the thirteen-month series plotted daily or smoothed?** {#is-the-thirteen-month-series-plotted-daily-or-smoothed?}

395 daily points across the plot width puts roughly two pixels between days. On a site with steady traffic that reads as a band rather than a line, and the weekday-to-weekend cycle — which is real and uninteresting at this zoom — is most of what a reader sees.

Three treatments are available and they answer different questions. Plotting raw daily counts is honest and matches the Overview chart's units. A trailing 7-day average removes the weekday cycle entirely and makes the shape of the year legible, at the cost of a line whose values are not any day's actual traffic. Aggregating to weekly totals does the same with a different unit and 56 points instead of 395, which also cuts the response's largest array by a factor of seven.

Undecided: which of the three; whether the choice depends on the site's traffic volume, which is what the PRD's low-traffic guidance asks for and would mean two behaviors to design and test rather than one; and, if the series is smoothed, whether the raw daily values still travel in the response for the tooltip to show.

Blocked on this: the chart's table builder, the daily array's shape in the wire format, and the copy of the support link beside the chart, which has to say what the line is.

## **How many rows does each dimension carry?** {#how-many-rows-does-each-dimension-carry?}

Rows are ranked by absolute change and capped per dimension, so the ones that survive are the ones carrying the movement. The cap decides both what a reader sees and what browser storage holds, since the response carries exactly the rows the tab renders.

Two pressures pull in different directions and both are about the product: what each factor section needs to render — three to five rows a section, from the Figma frames — and what a reader can take in across seven sections without the tab becoming a report. Nothing about the transport constrains it: a `GET` response has no size ceiling the design has to work around.

Undecided: the cap for each of the seven dimensions; the truncation length for the labels, URLs and titles inside them, which is what bounds the worst case rather than the row count; and whether a section that is capped says so, or simply ends.

Blocked on this: the caps in the response builder, and the fixtures every front-end issue is built against.

## **What is the minimum history and volume for the Typical Traffic tab?** {#what-is-the-minimum-history-and-volume-for-the-typical-traffic-tab?}

The tab gates on property age alone: thirteen months from `getPropertyCreateTime()`. Two things that gate does not look at are both capable of making the tab meaningless.

**Volume.** A site averaging two visitors a day has thirteen months of history and nothing typical about any of it: the chart is noise, and every factor section reports a large percentage change over a difference of three visitors. Nothing currently declines to render for such a site.

**Actual collected history, as opposed to property age.** A property created fourteen months ago and tagged last month passes the gate with one month of data behind a year of zeros, which is a worse chart than a young property's because the zeros look like a collapse.

Undecided: whether either has a floor; if so, what it is measured over and what the tab shows beneath it; and whether the check belongs beside the age gate in the browser — where it would need a report to answer — or in the datapoint, which has the series in hand and could say so in the response.

Blocked on this: the tab's gating condition, and whether the panel needs a state it does not currently have.

# **Appendices**

The following are implementation-level details that can be settled at the Implementation Brief stage of the individual issues.

### **Datapoint response shape**

What `GET:benchmarking-data` returns once decoded, and therefore the fixtures every front-end issue is built against. These are the plugin's own shapes: camelCase, flat, and unrelated to what the reports return.

| Field | Type | Present |
| :---- | :---- | :---: |
| `visitors` | `{ current: int, previous: int }` for the selected period | Always |
| `dailyTraffic` | `Array<{ date, visitors }>`, one row per day across the thirteen-month window | Always |
| `dimensions` | `Array<DimensionCode>`, ordered by absolute movement, highest first | Always |
| `contextualData.channels` | `Array<{ label, current, previous }>` | Always |
| `contextualData.devices` | `Array<{ label, current, previous }>` | Always |
| `contextualData.visitorMix` | `Array<{ label, current, previous }>` | Always |
| `contextualData.referrers` | `Array<{ label, current, previous }>` | Always |
| `contextualData.searchQueries` | `Array<{ label, current, previous, positionCurrent, positionPrevious }>` | With Search Console connected and readable |
| `contextualData.content` | `Array<{ url, title, visitors, publishedDaysAgo }>` | With the post-date custom dimension |
| `contextualData.categories` | `Array<{ label, current, previous }>` | With the post-categories custom dimension |

`DimensionCode` is one of `CHANNELS`, `DEVICES`, `VISITOR_MIX`, `REFERRERS`, `SEARCH_QUERIES`, `CONTENT` or `CATEGORIES`, and `dimensions` names only codes whose `contextualData` key is present.

### **Wire format layout** {#wire-format-layout}

The positional layout the [wire format](#wire-format) fixes, at the level the encoder and decoder have to agree on. The index names live in `constants.ts` on the JS side and in class constants on the PHP side; the table is what those two sets of names describe.

| Envelope member | Holds |
| :---- | :---- |
| `0` | format version, an integer |
| `1` | the string table: every label, URL and post title, once each |
| `2` | the first plotted date, as `YYYY-MM-DD` — every later row's date is its offset from this |
| `3` | the daily series, one visitor count per day |
| `4` | `[ visitorsCurrent, visitorsPrevious ]` for the selected period |
| `5` | the contextual dimensions, keyed by dimension index, each an array of rows whose own layout the dimension declares |
| `6` | the dimension order: dimension indices, ranked |

Four conventions the table does not show, and the encoder and decoder both depend on:

* An enum value travels as its index in a fixed list, not as its string. A decoder that does not recognize an index drops the entry the way an unrecognized catalog code is dropped.  
* A missing value is `null`, never `0` or an empty string. Zero is a real visitor count.  
* A string is always a reference into the string table, never an inline literal.  
* Every non-integer arrives already rounded. The decoder does no arithmetic at all.

### **Chart options**

The options on the thirteen-month chart that carry a decision rather than a preference:

| Option | Value | Why |
| :---- | :---- | :---- |
| `curveType` | `'function'` | Smooths a line whose points are two pixels apart. |
| `hAxis.ticks` | one per month, `format: 'MMM'` | Weekly ticks are unreadable across thirteen months. |
| `vAxis.viewWindow` | fitted to the whole window | The year's peak is what the current period is read against. |
| `backgroundColor` | `'transparent'` | Lets the selected-range region, which paints behind the SVG, show through. |
| `legend` | `position: 'none'` | One series needs no legend. |
| `gatheringData` | never passed | `getChartOptions()` would clamp `hAxis.viewWindow` to the selected range and crop the window to 28 days. |

[image1]: <data:image/png;base64,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>