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
***Last Major Revision:** Oct 22, 2026* 

# **Context**

## **Objective**

This epic adds a second tab, **Typical Traffic**, to the `analyticsTrafficOverview` widget on the main dashboard, for every site whatever its history: the site's daily traffic across the selected period in one chart, drawn against the range the site's own history says to expect on each day, and a section naming the factors that moved traffic in the selected period — together with the server-side datapoint that gathers and derives everything the tab draws.

## **Background**

The Traffic Overview tab answers "how many visitors did I get, and where did they come from?" over the selected date range. What it cannot answer is whether the number is normal.

Most site owners have neither the analytics background nor the historical context to judge a 12% dip. Without a sense of what their own traffic normally does, a quiet weekend reads as a drop, a dip inside the site's ordinary day-to-day spread reads as a crisis, and the day after a viral spike reads as a collapse. Answering that needs three things the Overview tab does not have. The first is the site's own history well beyond the 90-day maximum of the header date-range selector: up to a year of it behind every day of the period. The second is an expectation for every day of the period, derived from that history — a range centered on the site's current level, shaped by the weekday pattern of the year behind the day, and steady against a single viral day or outage — so that a dip reads against what this site normally does rather than against the reader's memory of it. The third is a comparison across every driver of traffic at once — channels, the pages visits land on, referring sites, campaigns and search keywords, each qualified by the devices and the kind of visitor behind it — so that a movement can be attributed to the few things that carried it rather than only observed.

None of the three is something the browser should be computing. Up to fifteen months of daily rows, a model fitted on a year of them for each day the chart plots, and a dozen comparison reports across two modules is a dozen requests and up to ninety fits to compose one view, and some of those requests belong to Search Console and would be issued from inside an Analytics widget. This epic puts that gathering on the server, in one datapoint whose only parameters are the two dates the dashboard already has.

# **Design**

## **Overview**

We will add a second tab to the existing `analyticsTrafficOverview` widget, behind a new `typicalTraffic` feature flag. The tab renders two sections:

1. **Typical traffic chart** — daily visits across the selected date range, the same days the Overview chart plots, with the expected range under the line as a band fitted on up to a year of the site's own history, so every day reads against what that history expected of it.
2. **Key factors** — what moved traffic in the selected period: up to three cards, each naming one driver — a channel, a landing page, a search keyword, a referring site or a campaign — with its share of the site's movement and the two attributes that best explain it, shown once the period before the selected one has recorded traffic on every day.

Behind it, five new pieces:

1. **A datapoint that gathers and derives.** `GET:benchmarking-data` on `Analytics_4` runs the GA4 reports, collects Search Console rows through a filter, derives the daily series, its expected range, the first day with recorded traffic and the key factor cards, and returns everything the tab draws.  
2. **An expected-range model.** `Expected_Baseline`, a PHP class, fits each plotted day on the history up to and including it and returns that day's band — see [Expected range](#expected-range).  
3. **A filter Search Console answers.** `googlesitekit_benchmarking_contextual_data` is where the search-keyword rows come from, so no module holds a reference to another.  
4. **A flat wire format.** One positional encoding, written in PHP and read in JS, which is what keeps a response of up to ninety daily rows, their bounds and the key factor cards compact in browser storage.  
5. **A datastore slice.** `modules/analytics-4` gains a `benchmarking` slice that resolves the response and decodes it.

**Nothing about this feature is cached on the server.** Search Console and Analytics report data is not stored server-side, which rules out a transient in front of the datapoint. The response is cached by the API layer in browser storage under the two dates it depends on, like any other `GET`.

**The expected range is derived in PHP, from the daily series the datapoint already gathers.** It arrives in the same response as the line it is drawn beside and costs no request of its own, and the browser draws bounds it is handed rather than computing any — see [Expected range](#expected-range). **Nothing about it is generated**: every bound is arithmetic over the site's own history, not a model call. **The chart stops at `endDate`**: it draws nothing for a day that has not happened.

**The expected range says what is normal for the site's current level, not for the time of year.** Each day's band is centered on the site's level over the four weeks ending on it and shaped by the weekday pattern of the year behind it, so a seasonal swing moves the band with it rather than being anticipated by it, and a January decline the site has every year reads against the band the same way as one it has never had. Telling the two apart takes a comparison with the same weeks a year earlier, which only the [generated insight](./traffic-insights-design-doc.md#what-the-service-is-told) makes, in words rather than on the chart — see [Expected range](#expected-range).

**Every count in the tab is a visit — a GA4 session — except a search keyword's clicks.** The line, the period totals, the expected range and the key factor cards are all in sessions, because sessions add up across the channels, pages, sources and campaigns the cards name, and a line in the same unit is a line the cards are parts of. The Traffic Overview tab beside it counts visitors, so the two tabs plot different numbers for the same day — see [Report gathering](#report-gathering).

**The tab shows for every site, whatever its history.** What it draws follows from how much traffic the site has recorded: the band needs four weeks of it up to a day, and the key factor cards need recorded traffic on every day of the period before the selected one. Until then a notice says what is still to come, and a site with too little for either gets a message in place of the chart — see [Gating and visibility](#gating-and-visibility) and [Panel states](#panel-states).

**The tab is main-dashboard only.** The analysis is a whole-site one, and a year of one URL's traffic is not the question the entity dashboard asks; `GET:benchmarking-data` has no URL parameter at all.

**The whole tab works in the view-only dashboard.** The datapoint is shareable, so the reports run under the module owner's credentials on a shared request exactly as every other shared report does — see [Dashboard sharing](#dashboard-sharing).

**Every part of the tab asks whether it helped.** The chart and each key factor card carry a thumbs up and a thumbs down, and a thumbs down asks the reader what seems off — see [Feedback](#feedback).

![][image1]

## **Infrastructure**

Almost nothing on the front end is new. The tab is one more descriptor in the widget shell that already holds its tabs as a list; the chart, the loading placeholders, the change badges and the error state are the ones the rest of the dashboard uses. The server-side half has a working precedent in Email Reporting, which already runs GA4 and Search Console reports to compose a payload rather than to answer a single report request.

Six reuses carry weight in the design, because it depends on a particular property of each:

* **`Module::get_data()` and `Module::set_data()` dispatch a datapoint in-process.** That is how the data datapoint runs its reports: no HTTP hop and no REST round trip, using the module's own service client — see [Report gathering](#report-gathering).  
* **`Module::get_oauth_client_for_datapoint()` resolves the client per datapoint**, including for a nested in-process dispatch, which is what carries the datapoint into the view-only dashboard — see [Dashboard sharing](#dashboard-sharing).  
* **`GET:batch-report` on `Analytics_4` runs up to five report requests per GA4 call.** The five reports every response needs therefore cost one round trip, and the reports behind the selected cards' attributes at most two more, chunked the way `Email_Reporting_Data_Requests::collect_batch_reports()` chunks them.  
* **`POST:searchanalytics-batch` on `Search_Console`** answers the search-keyword rows and their page and device breakdowns in one call, which is what the [contextual-data filter](#cross-module-contextual-data) hands back, and it answers them on a shared request too.  
* **The API layer caches `GET` responses in browser storage, keyed on the datapoint and an MD5 of its query parameters.** That is what holds the response, under the two dates it depends on, with no cache of the slice's own.  
* **`GoogleChart` passes Google Charts interval roles through untouched.** `getFilteredChartData()` returns the table as given when no `selectedStats` is passed, and `getChartOptions()` does not touch `intervals`, so the expected range is two interval columns and an option rather than a change to the component — see [Typical traffic chart](#typical-traffic-chart).

The new infrastructure is the gathering, the model and the transport in front of them: one `Analytics_4` datapoint, the [expected-range model](#expected-range), the filter Search Console answers, the [wire format](#wire-format) both languages read, and the `benchmarking` datastore slice behind them. The external dependencies are the GA4 Data API and the Search Console API, reached the way they always are.

## **Detailed design**

### **Feature flag**

The epic is built behind a new `typicalTraffic` feature flag.

The tab descriptor is added to the widget shell's tab list under the flag check, so with the flag off the widget carries the tabs it carries today and nothing about the Traffic section changes. The datapoint is added to `Analytics_4::get_datapoint_definitions()` only when the flag is enabled, and Search Console adds its [contextual-data callback](#cross-module-contextual-data) under the same check — with the flag off neither module carries any benchmarking code into a request.

Two additions sit outside the flag: `sessionSource`, `landingPage` and `sessionCampaignName` among the [shareable dimensions](#report-gathering), and `propertyCreateTime` among the [view-only settings keys](#typical-traffic-chart). Both are entries in allow-lists the rest of the plugin reads on every request, and making what a shared report may query depend on a feature flag is a worse property than the widening itself. Neither is reachable by the tab with the flag off.

### **Gating and visibility** {#gating-and-visibility}

The tab is present when all of:

1. The `typicalTraffic` flag is enabled — implicit, since the descriptor is added under the check.  
2. The view context is the main dashboard, authenticated or view-only. The entity dashboard renders the widget with the Traffic Overview tab alone.  
3. The Analytics module is connected, since everything the tab draws comes from its reports.

**Nothing about the site's history hides the tab.** A property connected yesterday gets the tab beside its Traffic Overview tab, and how much recorded traffic the site has decides what the panel draws rather than whether the tab is there: a notice where a part is still waiting, and a message in place of the chart where nothing can be drawn yet — see [Panel states](#panel-states).

**History is counted from the first day the site recorded traffic, not from the property's creation.** The band and the cards both read the recorded daily series, and a property created long before its site was tagged has months of zeros that say nothing about the site. The datapoint finds that day in the daily report it already runs and returns it as `firstTrafficDate`, so every state is decided from the one response — see [Response assembly](#response-assembly).

The band under each plotted day reads up to the 365 days ending on it, so the [daily report](#report-gathering) reaches 364 days before the selected range's `startDate` — 392 days in all on a 28-day range, and 454 on a 90-day range. **The band is fitted on whatever recorded traffic the site has rather than waiting for a full year.** A day needs 28 days of it, up to and including the day, to have a band at all, so a day less than a year into the site's recorded traffic is fitted on less than a year, and a day less than four weeks into it has no band. **That gap does not hide the line**: a day without a band is a day the model has nothing to say about, not a day the chart leaves out.

**The key factor cards need recorded traffic on every day of the previous period.** A card compares the selected period with the one before it, so the cards wait until the site's first recorded day is no later than that period's first day — see [Key factor scoring](#key-factor-scoring).

Where the traffic is thin, the tab still renders. Whether it should say something different — and what "too thin to call anything typical" means — is an [open question](#is-there-a-minimum-traffic-volume-for-the-typical-traffic-tab?).

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
| `visits` | `{ current, previous }`: the sessions of the selected period and of the period before it | no section; the period totals the [generated insight's payload](./traffic-insights-design-doc.md#payload-assembly) sends |
| `dailyTraffic` | one row per day of the selected range: `{ date, visits, expectedMin, expectedMax }`, `visits` the day's sessions and the bounds `null` on a day the [expected range](#expected-range) cannot fit | `TypicalTrafficChart` |
| `firstTrafficDate` | `YYYY-MM-DD`: the first day of the daily report with recorded traffic, or `null` when the report records none | no section; the panel's [states](#panel-states) and their notice |
| `keyFactors` | up to three cards, ranked: `{ kind, label, current, previous, sharePct, attributes }`, each attribute `{ kind, label, current, previous, sharePct }`, at most two; empty when no candidate survives, and when the previous period starts before `firstTrafficDate` | `KeyFactors` |

Both the response's shape and its field names are the plugin's own: camelCase, flat, and unrelated to anything the reports return. What crosses the wire is the positional [wire format](#wire-format); the table above is what the slice's decoder produces from it, and it is the shape every section component is written against.

Every section component takes rows and numbers as props and touches no store, which is what makes each of them renderable from a fixture in Storybook and testable without a registry. The fixture is one decoded object per state rather than a set of report responses per section.

### **Typical traffic chart** {#typical-traffic-chart}

`TypicalTrafficChart` renders `GoogleChart` with `chartType="LineChart"` over a four-column table — date, daily visits, and the expected range's lower and upper bounds — built by a pure function in `traffic-overview/charts/`, with a header above the plot and a legend below it, as the [chart's design](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-32704&m=dev) draws them.

**The line plots the site's sessions, and its hover names them as visits.** Its column is labelled `Visits`, where the Overview chart's is labelled `Users`: the two charts plot different metrics over the same days, so their values differ — see [Report gathering](#report-gathering). The label is what the chart's tooltip prints beside a day's value.

**The window is the selected date range, as on the Overview chart.** The chart plots every day from the selected range's `startDate` to its `endDate`, one point per day — 28 days on a 28-day range and 90 on a 90-day range — and nothing after `endDate`, so it never draws a day that has not happened. The history the tab's question needs is in the band rather than in the line: each day's [expected range](#expected-range) is fitted on up to the 365 days ending on it, centered on the site's current level and shaped by the weekday pattern of the year behind it, so each day reads against what the site's recent traffic makes normal for it without that history being plotted. What the band does not carry is the season: no fit compares a day with the same weeks a year earlier, so the chart says whether a day is normal for the site's current level, not whether the period is normal for the time of year. The unit is the one thing about the line a reader has to be told, because it differs from the Overview chart beside it, and the support page behind the chart's info tooltip covers it alongside the band — see [Documentation in-product](#documentation-in-product).

Two consequences follow from sharing the Overview chart's window:

* **The x axis is the Overview chart's.** One tick per plotted day from the second on, formatted `MMM d` over transparent gridlines, which Google Charts thins to the labels that fit, as it does on the Overview chart, and the axis ends on `endDate`.  
* **The value axis is fitted to the line and the band.** Its maximum clears the higher of the largest daily value and the largest upper bound, since on a day the site underperforms the band sits well above the line; an axis fitted to the line alone clips it.  

**The expected range runs under the line wherever a day has one.** The two bound columns are declared with `role: 'interval'` and follow the visits column they annotate, and the `intervals` option draws them as a filled area — `style: 'area'`, with `lineWidth: 0` and `pointSize: 0` so the band has no edge lines or points of its own — the way the [chart's design](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-32704&m=dev) draws it. A day the [model](#expected-range) cannot fit carries `null` in both columns, and `interpolateNulls: false` is what keeps the band from being drawn straight across such days, so on a site with only weeks of recorded traffic the band starts partway into the range rather than at its left edge. The band is a tint of the line's violet. Every bound comes from the response; the chart computes none of its own.

**The chart marks the property's creation date, as the Overview chart does.** Where the day the property was created falls inside the selected range, the chart passes it to `GoogleChart` in `dateMarkers`, labelled `Google Analytics property created`, with the screen-reader sentence `TrafficChart` renders beside its own marker, so the days before the property existed read as such on both tabs. For a view-only reader that needs `propertyCreateTime` among `Analytics_4\Settings::get_view_only_keys()`, which this epic adds, and which lets the Overview chart draw its marker for a view-only reader too, where before it drew nothing.

`gatheringData` is not passed: a site with too little recorded traffic gets one of the panel's [zero states](#panel-states) in place of the chart, so the chart never renders in the state the flag describes.

**The chart's support link lives inside its info tooltip.** `TypicalTrafficChartHeader`, a new component in `traffic-overview/charts/`, renders the chart's [title](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-32707&m=dev), `Your traffic compared to your expected range`, with an `InfoTooltip` beside it. The [tooltip](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-35810&m=dev) reads `Site Kit analyzes the last 12 months of your traffic history to estimate a typical range, so you can see when visits are higher or lower than expected. Learn more`, and its `Learn more` link opens the support page described in [Documentation in-product](#documentation-in-product). Until that page exists, the link points at `#`.

**The legend is the Overview chart's, with one item more.** `ChartLegend` renders two items below the plot. The first names the line, in the line's color, with the Overview chart's label for the selected range's length — `Last 28 days traffic` on a 28-day range — so both tabs name their line with the same strings, which name traffic rather than a unit and so fit a line of visitors on one tab and a line of visits on the other. The second is `Expected range`, beside a swatch in the band's tint. `ChartLegend` draws every swatch as a short bar today, which is right for a line and wrong for an area, so an item gains a swatch shape and the band's is a filled block. That is the one change this epic makes to a component the Overview chart renders, and it leaves the Overview chart's legend exactly as it is. Google Charts' own legend stays off; it cannot show a band in any case, since an interval column is not a series. The legend row also carries the chart's [feedback control](#feedback) at its right end. The chart's design also shows published-post markers with a legend item of their own; they are built separately — see [Future Work](#published-posts-on-the-chart).

### **Key factors** {#key-factors}

`KeyFactors` ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2096-14304&m=dev)) renders up to three cards under the heading `Key factors behind your traffic`, in the order the response gives them. Each card names one **driver** — the thing that moved traffic in the selected period — and qualifies it with at most two **attributes**: the values inside the driver that carried its movement. Every value comes from `keyFactors`; the section derives nothing.

**Drivers and attributes are two strict classes, and only a driver becomes a card.** Five kinds can be a driver:

| Kind | A card names | Counted in |
| :---- | :---- | :---- |
| `CHANNEL` | a channel of the default channel grouping | sessions |
| `CONTENT` | a landing page, by its path | sessions |
| `SEARCH_KEYWORD` | a Search Console query | clicks |
| `REFERRING_SITE` | an external site whose visits arrive through `Referral` or `Organic Social` | sessions |
| `CAMPAIGN` | a marketing campaign or newsletter, by its campaign name | sessions |

**Device and visitor type are never drivers.** A device or a new-versus-returning split describes visits that some driver already accounts for, so a card of its own would only mirror the channel behind it — and compete with that channel for one of three places. Both appear only as attributes, beside the driver they qualify. **A post category is not a driver either.** The page that moved is the specific thing, and a category card would count the same visits a second time; the categories report is not run.

**Which attributes a card can carry depends on its driver**, and for a channel on which channel:

| Driver | Attribute candidates, in order |
| :---- | :---- |
| `Organic Search` | search keyword, landing page, user type, device |
| `Direct` | landing page, user type, device |
| `Referral` | referring site, landing page, user type, device |
| `Organic Social` | referring site, campaign, landing page, user type, device |
| a paid channel: `Paid Search`, `Paid Social`, `Paid Shopping`, `Paid Video`, `Paid Other`, `Display` or `Cross-network` | campaign, platform, user type, landing page, device |
| `Email` | campaign, landing page, user type, device |
| `Organic Video` | platform, landing page, device |
| `Unassigned` | landing page |
| any other channel | landing page, user type, device |
| a landing page | traffic channel, search keyword, user type, device, referring site |
| a campaign | traffic channel, landing page, user type, device |
| a referring site | landing page, user type, device |
| a search keyword | landing page, device |

A card shows at most two of its candidates: the two whose leading value moved most in the card's own direction, with the order above breaking a tie — see [Attribute selection](#attribute-selection). A candidate with no qualifying value is skipped, so a card can carry one attribute or none, and the list is what a card *may* say rather than what it must.

**Direct traffic leads with its landing page.** A direct visit carries no referrer to name, and the page it lands on is the clue that is left: the homepage reads as brand recall, a bookmark or a typed address, and a deep post or product as a link shared somewhere that drops the referrer — a messaging app, a workplace chat, an email client. Device is the other clue, since sharing in a mobile messaging app and in a desktop workplace chat leave different shapes, which is why it stays on the Direct card's list. Whether a Direct card also reads click identifiers off its landing URLs is an [open question](#should-a-direct-card-read-click-identifiers-off-its-landing-urls?).

**A referring site and a platform are the same dimension under two titles.** Both are the session's source: a `Referral` or `Organic Social` card titles it `Referring site`, a paid or `Organic Video` card `Platform`. They are separate attribute kinds in the response so that a row is titled from its kind alone, without the renderer knowing which channel it sits under. **Facebook's source variants collapse into one value** — `facebook.com`, `m.facebook.com`, `l.facebook.com`, `lm.facebook.com` and `fb` become `Facebook` before anything is summed or ranked — so a surge split across them is one referring site rather than five small ones. Where an AI assistant's visits come from, and therefore whether a channel card for them carries an `Assistant` attribute, is an [open question](#where-does-ai-assistant-traffic-come-from?).

New components live in `traffic-overview/factors/`, each taking its values as props:

* `KeyFactors` — the heading and one `KeyFactorCard` per entry of `keyFactors`. With no entries it renders nothing, heading included; cards withheld for want of history are the [panel's notice](#panel-states) to explain, not the section's.  
* `KeyFactorCard` — the driver kind's title, the driver's label, its change in its own unit, a `KeyFactorShareBadge`, and one `KeyFactorAttribute` per attribute, with the card's [feedback control](#feedback) in its top-right corner.  
* `KeyFactorAttribute` — the attribute kind's title, its value, its change and a small `KeyFactorShareBadge`.  
* `KeyFactorShareBadge` — `9.8% of traffic growth` or `71.4% of traffic drop` on a card, `4.3% of growth` on an attribute, its direction taken from the sign of the row's own change. `ChangeBadge` prints a percentage change between two values, which is a different number with different copy.  
* `KeyFactorLabel` and `KeyFactorChange` — a label, linked when it is a path, and a signed change in its unit, which the card and the attribute row both render.

The panel passes the site's reference URL down with `keyFactors`, so a path can be linked without any of these components reading a store.

**Every card has one shape, so there is one renderer.** A channel, a page, a query, a site and a campaign each carry a label, a change and a share, and so does every attribute. What differs by kind is copy and unit, and `traffic-overview/factors/registry.ts` holds both: each driver kind's title and unit — `visits`, or `clicks` for a search keyword — and each attribute kind's title. An attribute counts in clicks when it is a search keyword or sits on a search keyword's card, since Search Console is the only source of either. **A kind with no catalog entry is dropped**: an unknown driver kind renders no card and an unknown attribute kind renders no row, so a kind the response adds later costs one card or one row rather than the panel.

A landing page — as a `CONTENT` card's label or as a `Landing page` attribute — renders as a link to that path on the site, opening in a new tab, as `DetailsPermaLinks` links a page's path. Device and visitor-type values are translated by the plugin: GA4 reports them as fixed tokens, so `mobile` renders as `Mobile` and `new` as `New visitors`, and a token the plugin does not know renders as GA4 gave it. Channel names, paths, hostnames, campaign names and queries render exactly as the response gives them.

**The selection, the order and every share are derived server-side, not in the browser.** The datapoint scores every candidate driver, keeps three, and picks each card's attributes — or withholds every card while the previous period predates the site's recorded traffic — see [Key factor scoring](#key-factor-scoring). Ranking in the browser would mean every consumer of these rows re-deriving the same arithmetic over the same numbers, and it would put the decision about what counts as movement on the side of the wire with the weakest guarantees about how a number is printed.

Each card's copy is the plugin's own: translated patterns filled with `sprintf` over values formatted through `numFmt` — `%s visits`, `%s of traffic growth` — with the plural form chosen by `_n()` on the change's absolute value.

### **Feedback** {#feedback}

Every part of the widget asks the reader whether it helped: the chart, each key factor card, and each insight block the Traffic Insights epic adds to the tab. A part carries a thumbs up and a thumbs down, and a thumbs down opens a popup asking what seems off, with three reasons written for that part. **The vote is per part, not per tab**, because a reader who trusts the chart and doubts one factor has nothing to say with a single vote for both.

The control takes two forms:

* **On the chart it is always visible.** It sits at the right end of the legend row, after a `Help us improve` label ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1755-25930&m=dev)), so the legend and the control are laid out as one row under the plot.  
* **On a key factor card and on an insight block it appears on hover.** The two buttons carry no label and sit in the part's top-right corner ([key factor cards](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2096-14304&m=dev), [insight block](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-13136&m=dev)). They show while the pointer is over the part, so three cards side by side do not carry six permanent buttons. They also show while focus is on them and while the part's popup or thank-you message is open, and they are always shown on a device without hover, where nothing else would reveal them.

**The control is the shared `FeedbackPrompt` from \#13679, not a second set of thumbs.** That issue generalizes the Site Goals prompt to take a vote ID and a tracking context. This epic adds three things to it: an optional label, the hover placement, and a list of reasons that a thumbs down opens in place of the thank-you popper. The reasons render in `FeedbackMenu`, the menu a feature card's dismiss action already opens, whose fixed `Help us improve` heading becomes a prop so that each part asks its own question. Choosing a reason closes the menu and shows the thank-you popper; closing it without a choice keeps the thumbs down.

**The control renders nothing on the view-only dashboard, and that rule lives in `FeedbackPrompt`, not in each widget.** `triggerSurvey()` sends nothing for a user who is not authenticated, so a view-only reader's vote is never recorded, and a control that thanks a reader for a vote nobody receives is worse than no control. Because the rule belongs to the component, it holds wherever `FeedbackPrompt` renders — including the Site Goals widgets, which show their prompt to view-only readers today.

| Part | Popup heading | Reasons |
| :---- | :---- | :---- |
| The chart ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-13886&m=dev)) | `What seems off about this chart?` | `The expected range feels too high or too low`; `Doesn’t reflect a seasonal change or recent event`; `Not sure how to read this` |
| A key factor card ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-12871&m=dev)) | `What seems off about this?` | `This didn’t really drive my recent traffic change`; `An important page or traffic source is missing`; `The numbers or percentages are confusing` |

The insight blocks' reasons are listed with [Traffic Insights' feedback](./traffic-insights-design-doc.md#insight-feedback), since they travel as the AI feedback endpoint's reason tokens.

**On the chart and the key factor cards, a vote and a reason are sent the way existing feedback is.** A vote is the survey trigger `ThumbsSurveyTrigger` already sends, `vote:<voteID>:<direction>`, plus the GA4 event `FeedbackPrompt` already sends — see [Internal Measurement: GA4 Events](#internal-measurement-ga4-events). A reason is one more survey trigger, `feedback:<voteID>:<reason>`, the shape a feature card's dismiss menu sends its reasons in. The chart has a vote ID of its own and the key factor cards share one, with the card's driver kind as the GA4 event's label: the survey a downvoter is shown follows the kind of part they voted on, and GA4 records which kind of driver it was.

The insight blocks are rendered by the Traffic Insights epic, and they carry the control from the day they render, with one difference that is that epic's to build: **a vote on generated text goes to the service's AI feedback endpoint, against the generation that produced the text, and not to `triggerSurvey()`**. Traffic Insights gives `FeedbackPrompt` the option that hands a vote and a reason to callbacks in place of the survey triggers — see [Insight feedback](./traffic-insights-design-doc.md#insight-feedback). This epic builds the control and puts it on the chart and the key factor cards.

### **Data datapoint** {#data-datapoint}

`GET:benchmarking-data` is a `Shareable_Datapoint` implementing `Executable_Datapoint` under `includes/Modules/Analytics_4/Datapoints/`, taking the module instance, `Credentials` and `Context` through its `$definition` array.

**Its only request parameters are `startDate` and `endDate`**, the two every report datapoint already takes. The plotted days, the year of history behind them, the comparison window, the reports, the expected range, and the key factor cards are all derived from them. **A range longer than 90 days is refused with a `400`**: 90 days is the longest range the date-range selector offers, and a range's length sets how many days are plotted and fitted.

Unlike the module's other datapoints it is not a wrapper over one service call, so it does not use `create_request()`/`parse_response()` to shape a single Google API call. It returns a closure over three steps:

1. **Gather.** One batched GA4 report call and one Search Console call through the filter, then at most two more GA4 calls for the selected cards' attributes — see [Report gathering](#report-gathering). A GA4 failure ends the request with the module's own `WP_Error`, which is what puts the tab in its error state. A Search Console failure costs the search-keyword candidates and attributes and nothing else.  
2. **Derive.** The zero-filled daily series, its [expected range](#expected-range), the first day with recorded traffic, the period totals, and the key factor cards with their attributes, withheld while the previous period starts before that day — see [Response assembly](#response-assembly).  
3. **Encode.** The [wire format](#wire-format): the positional arrays the tab decodes.

The datapoint implements `Permission_Aware_Datapoint`, and the check it declares is the dashboard-viewing capability rather than the authenticated-dashboard one, so a view-only user reaches it.

It lives on the Analytics module rather than in a new core controller because every input is GA4 and Search Console data and every consumer is an Analytics widget.

**Everything the tab draws is in this one response.** One request means one loading state and one error state, and it means the sections fill in together rather than one at a time.

### **Report gathering** {#report-gathering}

The datapoint runs reports through `Module::get_data()` and `Module::set_data()`, which dispatch a datapoint in-process against the module's own service client — the same path Email Reporting uses to compose its payload, with no HTTP hop and no REST permission round trip.

GA4 reports go through `GET:batch-report`, which takes up to five report requests per call. **Every response needs five reports, and they are one call:**

| Report | Feeds |
| :---- | :---- |
| `sessions` by `date`, ascending, from 364 days before `startDate` to `endDate` | `dailyTraffic` from the selected range's days, the [expected range](#expected-range) from all of it, and the `visits` totals for both windows |
| `sessions` by `sessionDefaultChannelGrouping`, `deviceCategory` and `newVsReturning`, both windows | the `CHANNEL` candidates, the site's session totals, and a channel card's device and user-type attributes |
| `sessions` by `sessionDefaultChannelGrouping` and `sessionSource`, both windows | the `REFERRING_SITE` candidates, and a channel card's referring-site and platform attributes |
| `sessions` by `sessionDefaultChannelGrouping` and `landingPage`, both windows | the `CONTENT` candidates, a channel card's landing-page attribute, and a landing page's traffic-channel attribute |
| `sessions` by `sessionDefaultChannelGrouping` and `sessionCampaignName`, both windows | the `CAMPAIGN` candidates, a channel card's campaign attribute, and a campaign's traffic-channel attribute |

Each breakdown carries its current and comparison window as two date ranges in one request rather than as two requests, and asks for 250 rows ordered by sessions.

**Every GA4 report counts sessions, because sessions add up.** A session has exactly one channel, one landing page, one source, one campaign, one device and one visitor type, so the rows of any of these reports sum to the channel, page, source or campaign they break down. That is what makes a landing page's total the sum of its rows across channels, a card's attributes parts of the card, and a share of the site's movement a share of something that adds up to the site's movement. `totalUsers` has none of these properties — one visitor can arrive through two channels and land on two pages — and a session is what the card calls a visit. **The daily series counts sessions too**, so the line, the period totals, the expected range and the cards are one unit: the line is the site's sessions day by day, the period totals are its sums, and the movement a card names is part of the movement the line shows. The Traffic Overview chart plots `totalUsers`, so the two tabs draw different numbers for the same day, and the Typical Traffic line [names its values as visits](#typical-traffic-chart).

**Every breakdown is keyed on the channel as well.** That is what assigns each page, source and campaign to the channels its visits came through — the parent a [suppression](#key-factor-scoring) needs — and what lets a channel card read every one of its attributes out of the same four reports, with no report of its own.

**A second pass fills the attributes the first cannot**, and it runs only for the cards the [selection](#key-factor-scoring) has kept. A landing page's device, visitor type and referring site, and a campaign's or a referring site's landing page, device and visitor type, come from reports filtered to the card's own driver:

| Card | Reports, filtered on the card's driver, both windows |
| :---- | :---- |
| A landing page | `sessions` by `deviceCategory` and `newVsReturning`, filtered on `landingPage`; `sessions` by `sessionDefaultChannelGrouping` and `sessionSource`, filtered the same way, so that its referring sites are the `Referral` and `Organic Social` sources only |
| A campaign | `sessions` by `deviceCategory` and `newVsReturning`, filtered on `sessionCampaignName`; `sessions` by `landingPage`, filtered the same way |
| A referring site | `sessions` by `deviceCategory` and `newVsReturning`, filtered on every source value the site collapses from; `sessions` by `landingPage`, filtered the same way |

That is at most six reports for three cards, in at most two more calls, and none at all for a response whose cards are channels and search keywords. Running them for three kept cards rather than for every candidate is what keeps the response from paying for breakdowns of drivers it will not show. The search keyword's attributes come from Search Console in the [first pass](#cross-module-contextual-data), so it needs no second.

**Both `visits` totals come out of the daily series rather than out of a totals report.** The selected period and the one before it are at most 180 days together, and the series reaches 364 days back from the selected one, past the start of the one before it on every range, so summing is free and — more usefully — guarantees the selected period's total is the sum of the line the chart draws.

**`sessionSource`, `landingPage` and `sessionCampaignName` are added to the shareable dimension list in `RequestHelpers::validate_shared_dimensions()`.** Every other dimension above is already in it, and so is `sessions` among the shareable metrics; without these three a shared request fails as a whole batch rather than losing the cards that need them, and the tab's error state is what a view-only user sees. Widening the list is the deliberate choice over dropping those drivers on a shared request, which would make the response depend on which kind of user loaded the dashboard first. A traffic-source name, a landing path and a campaign name are the same class of data as the channel grouping and the page path already on the list.

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

`$contextual_data` is every row a candidate driver or an attribute is read from, keyed by what it breaks down — the four GA4 breakdowns of the [first pass](#report-gathering) under `channelBreakdowns`, `channelSources`, `channelPages` and `channelCampaigns` — and the filter runs before anything is scored, so a contributed row is a candidate like any other. The keys and their row shapes are in the [appendix](#contextual-data-keys).

`Search_Console::register()` adds the callback that answers with three more keys: `searchKeywords`, each query's clicks in both windows; `searchKeywordPages`, the same clicks broken down by page; and `searchKeywordDevices`, broken down by device. It derives all three through one call to its own `POST:searchanalytics-batch` datapoint, with its own settings, in a `Benchmarking\Report_Data_Builder` alongside the `Email_Reporting` one. **Search Console's rows are written in GA4's vocabulary.** A page becomes the path GA4's `landingPage` reports, so a landing-page card finds its keywords and a keyword card names a page the site serves; a device becomes GA4's lowercase token, so one translation in the browser serves both modules.

The callback returns the array untouched unless the module has a property, so a site without a verified property has no search-keyword candidates and no search-keyword attributes, and an `Organic Search` card draws its attributes from the rest of its list. Search Console is force-active, so its `register()` always runs and the property check is the only gate that matters.

Sharing is the second gate, and it is Search Console's own rather than Analytics'. The callback's report runs under the Search Console owner's credentials for a view-only caller, but only where `search-console` is shared with that caller's role; where it is not, the report fails and the three keys are omitted for that request. **No cache pools that difference across callers**: every stored copy of a response lives in the requesting user's own browser, so two callers who assemble different responses are never served each other's.

**No module holds a reference to another.** Analytics owns the extension point and the response shape; Search Console owns its own reports, credentials and connection state; a later module with something to contribute adds a callback rather than an edit to the Analytics datapoint. The cost is that the response's contents are not readable from one file alone, which is why the keys and their row shapes are specified in the [appendix](#contextual-data-keys) rather than left to the callbacks.

The datapoint validates the returned array against those keys and shapes before it scores anything — unknown keys dropped, scalars cast, each key held to the 250 rows a report asks for — because the filter is public and what comes back reaches the dashboard. A callback that errors or returns something unusable costs its keys, not the request.

### **Response assembly** {#response-assembly}

Every field is derived in PHP by [the data datapoint](#data-datapoint), from the reports it has just run:

| Response field | Derived from |
| :---- | :---- |
| `dailyTraffic` | the daily series' days from `startDate` to `endDate`, zero-filled, each with the bounds the [expected range](#expected-range) fits for it |
| `firstTrafficDate` | the daily series' first day with recorded traffic — the day the [expected range's](#expected-range) history starts on |
| `visits` | the same series, summed over the selected window and the one before it |
| `keyFactors` | the [contextual data](#cross-module-contextual-data): every candidate driver scored, gated and ranked, the first three kept, and each given its attributes, or none while the previous period starts before `firstTrafficDate` — see [Key factor scoring](#key-factor-scoring) |

Seven rules the assembly holds to:

* **GA4 returns no row for a day with no traffic**, so the series is keyed by date and the gaps are filled with zeros before anything is computed. A missing day must not shorten the window or shift every later row's position, which in a format whose [date axis is implicit](#wire-format) it otherwise would.  
* **Each plotted day's bounds are fitted on the series as it stood on that day.** A fit reads the rows up to and including its own day, from the first day with recorded traffic, so no bound is computed from a day after the one it describes — see [Expected range](#expected-range).  
* **The cards wait for a previous period with recorded traffic on every day.** The comparison window's first day is checked against `firstTrafficDate` before anything is scored, and every card is withheld while the window starts earlier — see [Key factor scoring](#key-factor-scoring). The panel tells withheld cards from an empty selection by the same comparison, so the response carries no flag for it.  
* **A breakdown's two windows are paired by value, not by row index.** A value present in one window and absent from the other has no counterpart row, so the pairing is a lookup keyed on the row's dimension values and a missing counterpart is a count of zero.  
* **A placeholder value is never a driver or an attribute.** GA4 reports an empty value, or a value in parentheses — `(not set)`, `(direct)`, `(organic)`, `(referral)` and the like — for a session that has no such value. Its sessions still count toward its channel and the site's totals; it is never a card and never a row.  
* **The response carries at most three cards and two attributes on each**, so what a reader sees and what browser storage holds are bounded by the design rather than by a cap to tune.  
* **Facebook's source variants are collapsed before anything is summed** — see [Key factors](#key-factors) — and a referring site keeps the raw values it was collapsed from, which is what its [second-pass](#report-gathering) reports filter on.

The comparison window is the preceding window of the same length, computed off the two request parameters. The tab sends dates rather than the date-range slug, so the cache key changes when the reference date rolls over instead of holding yesterday's answer under today's range.

The assembly has to be deterministic — stable ordering, stable rounding, stable row caps — because that is what makes it testable against fixtures, and because two runs over unchanged figures that serialize differently are two cache entries.

Assembly lives in `includes/Modules/Analytics_4/Benchmarking/` — `Report_Options` for the windows and dimensions, `Expected_Baseline` for the expected range, a response builder over the report rows, and the [wire format](#wire-format)'s encoder — as classes with no dependency on the REST layer, so PHPUnit can drive them from fixed report fixtures.

### **Key factor scoring** {#key-factor-scoring}

**No card is scored before the previous period has recorded traffic on every day.** Every card compares the selected period with the one before it, and a comparison window that starts before `firstTrafficDate` holds days the site was not yet measured: against them every driver reads as growth, and the largest channels become the cards. So when the comparison window's first day is earlier than `firstTrafficDate`, `keyFactors` is empty, nothing is scored and the [second pass](#report-gathering) does not run. A day on or after `firstTrafficDate` counts even without traffic, as it does for the [expected range](#expected-range). The cards therefore need at least twice the range's length in recorded traffic up to `endDate`: 14 days on a 7-day range, 28 on 14 days, 56 on 28 days and 180 on 90 days.

The cards come out of one pass over every candidate driver in the [contextual data](#cross-module-contextual-data): each channel, summed across its devices and visitor types; each landing page, campaign and referring site, summed across the channels its visits came through; and each search keyword. Five steps, in order, decide which three become cards.

**1. Score.** One formula scores every candidate, so a channel, a page and a query are ranked on the same scale. For a candidate with `current` and `previous` counts — sessions, or clicks for a search keyword — against the site's session totals `sessions.current` and `sessions.previous`, the sums of every `channelBreakdowns` row in each window:

1. **`delta`** `= current - previous`.  
2. **`trafficImpactPct`** `= delta / MAX( sessions.previous, sessions.current ) * 100` — the candidate's own change as a percentage of the larger of the two site-wide totals, so a rapidly growing site doesn't inflate a candidate that only kept pace with it.  
3. **`selfChangePct`** `= delta / previous * 100`, or `100` when `previous` is `0` and `current` is greater than `0` — how much the candidate itself moved, independent of the site.  
4. **`siteGrowthRate`** `= ( sessions.current - sessions.previous ) / sessions.previous` for the period as a whole.  
5. **`excessImpactPct`** `= ( delta - previous * siteGrowthRate ) / MAX( sessions.previous, sessions.current ) * 100` — how far the candidate's own movement departs from what the site's overall growth rate alone would have predicted for it, as a percentage of the site-wide total.  
6. **`score`** `= ( 0.6 * ABS( trafficImpactPct ) + 0.4 * ABS( excessImpactPct ) ) * weight * boost`.

`weight` is fixed per kind — `CONTENT` 1.5, `SEARCH_KEYWORD` 1.4, `REFERRING_SITE` 1.3, `CAMPAIGN` 1.2, `CHANNEL` 1.1 — so a specific driver outweighs a broad one of equal raw impact. `boost` is `1.25` when the candidate's own direction agrees with the site's overall direction and `1.0` otherwise; the site's direction is `UP` when its period-over-period change in sessions is at least `3%`, `DOWN` at `-3%` or below, and `STABLE` between them, and a candidate's own direction follows the same sign convention on its `delta`.

**2. Drop.** A candidate is dropped when either of these holds:

* **The significance floor.** `ABS( delta ) < 5` or `ABS( trafficImpactPct ) < 0.40`. Below this a candidate is noise on any site's traffic.  
* **The counter-trend filter.** The candidate's direction opposes the site's overall direction, and it clears neither `ABS( trafficImpactPct ) >= 1.0` nor ( `ABS( selfChangePct ) >= 10` and `ABS( delta ) >= 25` ). A site growing overall can still have drivers that fell; this is what keeps a handful of visits moving the wrong way out of a selection built to explain the site's own trend.

**3. Gate the specific drivers.** A landing page, a search keyword, a referring site or a campaign stays a candidate only when it clears both elevation thresholds: `ABS( delta ) >= 10`, and a `sharePct` of at least `15`. Below either, its movement is a scattered part of its channel's, and the channel is the honest thing to name. A channel has no gate beyond step 2.

`sharePct` is the share the badges print, and it is measured against the site's movement **in the candidate's own direction**: `ABS( delta )` over `gain` for a candidate that rose and over `loss` for one that fell, `* 100`, held at `100` and rounded to one decimal. `gain` is the sum of every channel's `delta` above zero, and `loss` the sum of every channel's `delta` below zero, as a positive number. Because sessions partition across channels, `gain - loss` is the site's own change in sessions, and a channel that fell on a growing site reads as a share of everything the site lost — `71.4% of traffic drop` — rather than as a negative share of a net gain. A search keyword's clicks are measured against the same basis. The hold at `100` is for a page that gained more than its channel did in net, which happens when the channel's other pages fell.

**4. Suppress the parent.** A specific driver that clears the gate suppresses its parent channel: the channel stops being a candidate, so the same visits are never shown as two cards. A search keyword's parent is `Organic Search`. A landing page's, a campaign's or a referring site's is the channel whose row in its breakdown moved most in the driver's own direction, ties by channel name. Where no specific driver clears the gate, the channel stands: its movement was spread across too many pages or sources for any one of them to be named.

**5. Rank and keep three.** The candidates left are ordered by `score`, descending, and the first three are `keyFactors`. Two candidates with the same score are ordered by kind, in the order the [wire format](#wire-format-layout) lists the kinds, and then by label with `strcmp()`. An empty selection is a valid answer, and the [section](#key-factors) renders nothing for it.

#### *Attribute selection* {#attribute-selection}

Each kept card then takes its attributes from its candidate list in [Key factors](#key-factors). For each candidate attribute kind, the card's own visits are broken down by that kind's dimension — from the first-pass breakdowns, the [second-pass](#report-gathering) reports or Search Console's rows — and a value qualifies when all of these hold:

* It moved in the card's own direction by at least the significance floor of `5`.  
* It is not a placeholder value.  
* For a device or a visitor type, its own `selfChangePct` differs from the card's by at least `5` points. A device that grew at the same rate as its channel only says where the channel's visitors already were, and explains nothing beyond the card.

Each candidate kind is represented by its qualifying value with the largest `ABS( delta )`, ties by label. The card's attributes are the two kinds whose representatives have the largest `ABS( delta )`, ties by the kind's position in the candidate list, and each carries a `sharePct` on the same basis as the card's. **The selection is by movement rather than by the list's order** because the list is what a card may say, and the two things that moved most are what it should.

### **Expected range** {#expected-range}

The expected range is the band of daily visits that the site's own recent history makes normal for a given day, fitted on the daily sessions series the line plots. `Expected_Baseline`, in `includes/Modules/Analytics_4/Benchmarking/`, evaluates it in PHP for each plotted day. It is a stateless, closed-form fit: it stores nothing and trains nothing.

**Each day is fitted on the history up to and including that day, and on nothing after it.** A spike on any day moves the band under that day and under the later days whose fits include it, never the band under an earlier day, so a band drawn under last March is what last March's history expected. A fit reads at most the 365 days ending on the day it describes and needs at least 28 of them; a day with fewer has no band. That is why the [daily report](#report-gathering) starts 364 days before `startDate`: the earliest plotted day needs the 364 days before it, so the report is 392 days long on a 28-day range and 454 on a 90-day range, and only the selected range's days cross the wire.

**The history starts on the first day the series records any traffic.** The series is zero-filled, which is right for the line and wrong for a fit. On a property tagged long after it was created, most of the year behind a plotted day can be zeros for days the site was not yet measured, and a fit over them puts the upper quartile at zero and clamps every real day to 25 visits for months. Dropping the leading zeros before fitting removes that, and the same rule keeps out of the fits the days before a young property existed, which the report reaches on any range for a property younger than the report. Zeros after the first recorded day stay: they are days without traffic. That first recorded day is the one the response carries as `firstTrafficDate`, and the one the [panel's states](#panel-states) and the cards' [previous-period rule](#key-factor-scoring) count from, so the band, the states and the cards measure one history.

Each fit derives three quantities from its window, and the band is built from them:

1. **A center, `B`** — the site's current operating level, as a 28-day total. Extreme days are clamped first, to two and a half interquartile ranges beyond the quartiles on either side, so a viral day or a tracking outage cannot drag the fit. The center is where the straight-line trend through the last 28 clamped days ends, held between 0.6 and 1.2 times their mean, so the band follows a site that is genuinely moving without leaping after one that had a strange week.  
2. **A margin, `M`** — how far a normal 28 days strays from that center: two and a half times the last 28 days' root-mean-square error around the weekday-shaped center, scaled to a 28-day total. It is held between a floor of `5 * SQRT( B ) + 0.13 * B` and a ceiling of `0.24 * B` — or the floor, where the floor is higher — and never falls below 15 visits across the 28 days. The floor is what keeps a small site's band honestly wide; the ceiling is what stops a volatile month from making every day look normal.  
3. **A weekday shape, `S`** — each weekday's mean across the window against the mean of all seven, pulled a tenth of the way toward 1, so that no weekday's factor falls below 0.10.

**The last four weeks set the band, and the rest of the window shapes it.** `B` and `M` are read off the window's last 28 days, and the rest of the window reaches the band only through the quartiles the clamp is measured against and through `S`. A year of history is what keeps the weekday shape steady and an outlier recognizable as one; it is also why a genuine step up in traffic is clamped like an outlier until enough of the window sits at the new level, so a site whose traffic doubles can stay above its band for weeks. **Nothing in the fit compares a day with the same weeks a year earlier**, so a seasonal swing moves the band only as it moves the last 28 days. The one comparison with a year earlier is [Traffic Insights'](./traffic-insights-design-doc.md#what-the-service-is-told) `is_seasonal_period`, which the generated insight reads and the chart does not.

The band on a day `t` spreads the 28-day corridor onto that day with its weekday's factor, from `MAX( 0, B - M ) / 28 * S( weekday( t ) )` to `( B + M ) / 28 * S( weekday( t ) )`, rounded to one decimal. Because the margin's floor grows with the square root of the center and its ceiling with the center itself, the band's width relative to the expectation narrows as a site grows, and then stops narrowing:

| Typical day | Band either side of the expectation |
| :---- | :---- |
| `10` visits | about 43% |
| `25` visits | about 32% |
| `400` visits | 18% to 24%, by how steady the last 28 days were |
| `10,000` visits | 14% to 24%, by how steady the last 28 days were |

The fit also measures a trend — a recency-weighted line through the window's 28-day totals, sampled every 14 days — which the band does not read. [Traffic Insights](./traffic-insights-design-doc.md#expected-baseline) reads it from the fit at `endDate`, to summarize the period; keeping the fit whole in one class is what lets it do so without a second model. Where a window holds too few 28-day totals for a trend at all, the fit falls back to the raw total of its last 28 days as the center and a wider margin.

**The model is deterministic to one decimal, and its tests hold it there.** Every step is fixed arithmetic — the quartile positions, the clamps, the order of the sums, the guard on each division — so a daily series has exactly one set of bounds. The PHPUnit fixtures pair daily series with those bounds, and the arithmetic order is part of the specification: a sum taken in a different order can move a bound across a rounding boundary. Every step and constant is in the [appendix](#expected-range-model).

The cost is a sort and a handful of linear passes over at most 365 values for each of the at most 90 plotted days, in the request that already holds the rows. It is small beside the report calls that precede it.

### **Wire format** {#wire-format}

The response is positional rather than keyed: a row is an array whose index `n` means the same field on both sides of the wire, rather than an object repeating its keys once per row.

Volume is what argues for it. A response carries a daily row for every day of the selected range, up to ninety of them, each carrying two bounds beside its count, and beside them up to three cards and six attributes whose labels are page paths, search queries, hostnames and campaign names. As objects with per-row date strings and repeated keys that is several times the bytes in browser storage, held for an hour, per date range a reader opens.

Six rules define the format:

1. **Positions, not keys.** A `constants.ts` on the JS side and a matching set of class constants on the PHP side name every index. Neither a component nor a builder ever writes a literal index.  
2. **The date axis is implicit.** One start date, then one row per day. The derivation already zero-fills the days GA4 omits, so the row count is the day count and up to ninety date strings become one.  
3. **A string table at the head.** Labels and paths are hoisted into one array and referenced by index, so a path that is both a card and another card's attribute is stored once.  
4. **PHP rounds once.** Every non-integer is rounded server-side before encoding — the expected range's bounds and every `sharePct` to one decimal — and the browser never re-rounds or re-serializes a number.  
5. **An enum travels as its index in a fixed list**, not as its string. A driver kind and an attribute kind are each a number; a decoder that does not recognize one drops the card or the attribute, the way an unrecognized catalog entry is dropped.  
6. **A version integer leads the encoded structure**, and a decoder that does not recognize it treats the response as unusable rather than guessing. The browser cache prefix already carries `GOOGLESITEKIT_VERSION`, so a cached response cannot outlive a plugin update; the version is insurance for a request already in flight across one.

**The contract is a decoder in JS against an encoder in PHP, not a codec on each side.** The browser never encodes anything, so half of the ways two implementations of one format can disagree do not exist. What is left is checked in as one JSON fixture that **both** the PHP encoder's PHPUnit test and the JS decoder's Jest test read. That shared file is the mechanism that keeps the two sides honest; a description of the layout in prose is not.

The layout is in the [appendix](#wire-format-layout).

### **Datastore slice** {#datastore-slice}

A new `assets/js/modules/analytics-4/datastore/benchmarking.ts` slice, combined into the module store, over one `createFetchStore`:

| Fetch store | Params | Request |
| :---- | :---- | :---- |
| `getBenchmarkingData` | `{ startDate, endDate }`, both required and `YYYY-MM-DD` | `API.get`, `cacheTTL: HOUR_IN_SECONDS` |

* `getBenchmarkingData( startDate, endDate )` — the decoded response the [panel reads](#panel-data-flow). Its resolver fetches, then decodes; the decoded object is what is stored, so a re-render does not decode the response again.  
* `isLoadingBenchmarkingData( startDate, endDate )` — resolution state and the fetch store's in-flight flag.  
* The failure is the error store's: `getErrorForSelector( 'getBenchmarkingData', [ startDate, endDate ] )` carries the status the datapoint returned, and the panel maps it to its error state.

One action, `clearBenchmarkingData( startDate, endDate )`, drops the stored value and the API layer's cache entry through `invalidateCache()`. It runs on the error state's retry. **There is nothing else to invalidate**: no server-side entry exists, so a cleared browser cache means the next mount goes all the way to the reports.

The hour the API layer holds the response for is its default and is the right one here: the figures move as the day accumulates, and a tab that is one hour stale on the current day while the Overview tab beside it is not would be visible to a reader comparing the two.

### **Panel states** {#panel-states}

Six states the panel distinguishes, all decided by the one request:

* **Loading** — `PreviewBlock` placeholders sized per section, held until the response resolves. This is the state the tab is in the first time a reader selects it.  
* **Error** — the request failed: the GA4 reports behind it errored, or the datapoint itself did. Renders `WidgetReportError` with the module slug, so the existing retry and request-access affordances apply.  
* **Ready** — the chart with the band under every plotted day, and the key factor cards the selection kept.  
* **Partial** — the chart, with the band missing from some or all of the plotted days, or the cards withheld, for want of recorded traffic. A `Notice` above the chart names each part that is waiting and what it waits for: 28 days of recorded traffic up to and including a day, for that day's band, and recorded traffic on every day of the previous period, for the cards.  
* **Not enough data for this range** — a zero state: no plotted day has a band and the cards are withheld, but a shorter range would show the cards. A message titled `Not enough data to show typical traffic`, as the [design iteration](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2381-53216) draws it, replaces the chart and the cards, and suggests the longest range the date-range selector offers that would show them.  
* **Collecting** — a zero state: no range the selector offers would show either part, because the site has fewer than 14 days of recorded traffic — too few for a band on any day, and too few for the previous period of even the selector's shortest range. The message is titled `We're still collecting data for your typical traffic` and suggests no range.

**A zero state replaces everything the panel draws**, the [Traffic Insights](./traffic-insights-design-doc.md) blocks included, so a message about missing history never sits beside a reading of that history.

**Every state comes from the response.** A pure function in `traffic-overview/utils/` takes `firstTrafficDate`, the bounds on `dailyTraffic`, the selected range's dates and the ranges `getAvailableDateRanges()` offers, and returns the state and what its notice or message names. No state costs a request, and each is reachable from a decoded fixture. **The history that decides the state is the history the band and the cards use** — counted from the first day with recorded traffic, not from the property's creation — so the notice can never say a part is waiting that the response already carries, or the reverse.

The thresholds above are open: the band is drawn at any share of the range, the cards show before any band can, and a notice says what a part waits for but not when it arrives — see the [open question](#what-does-the-tab-show-while-a-site-history-is-short?).

There is no separate gathering-data state: the panel decides from the response rather than from the module's gathering-data check, so a property that has not yet recorded 14 days of traffic is in the Collecting state whatever that check says. A site with recorded traffic and none in the selected period gets a chart showing exactly that, against the band its own history expected, which is a more honest answer than a CTA. Whether it also gets key factor cards depends on what moved: a period with no traffic after one that had some is a drop every channel accounts for, and a period with none on either side has no candidate that clears the significance floor, so the [section](#key-factors) renders nothing.

### **Architecture requirements**

New front-end code joins the existing widget directory: `assets/js/modules/analytics-4/components/traffic-overview/` gains a panel under `tabs/` with its notice and its two zero states beside it, its chart under `charts/`, the key factor catalog and its card components under `factors/`, one hook, the [state function](#panel-states) under `utils/`, and the format's field indices in `constants.ts` — where nothing outside that file holds a literal index. Components are TypeScript function components, one component per file, with co-located tests and Storybook stories.

New PHP lives in two places: `includes/Modules/Analytics_4/Datapoints/` for the datapoint, and `includes/Modules/Analytics_4/Benchmarking/` for the report options, `Expected_Baseline`, the response builder and the wire format's encoder — with `includes/Modules/Search_Console/Benchmarking/` for the callback that answers the [contextual-data filter](#cross-module-contextual-data), the same per-module layout `Email_Reporting/` already uses on both modules.

Three existing files change outside this feature, and they are the ones to call out at review: `Analytics_4\Settings::get_view_only_keys()` gains `propertyCreateTime`, `Analytics_4\Report\RequestHelpers::validate_shared_dimensions()` gains `sessionSource`, `landingPage` and `sessionCampaignName`, and `Analytics_4::get_datapoint_definitions()` gains the datapoint under the flag check. On the front end, the [feedback control](#feedback) changes two shared components, `FeedbackPrompt` and `FeedbackMenu`, which Site Goals and Feature Discovery already render, and the [chart's legend](#typical-traffic-chart) changes a third, `ChartLegend`, which the Overview chart renders, by giving an item a swatch shape.

### **REST infrastructure**

One new datapoint, no new route. `GET:benchmarking-data` is dispatched by the `READABLE` branch of the module datapoint route like any other read, and implements `Permission_Aware_Datapoint` for its own permission check. The GA4 and Search Console reports behind it are dispatched in-process rather than over REST, so the report routes are involved only in the dashboard's other widgets.

**Opening the tab is one request.** Everything after it, for the hour the response is held, is answered from browser storage without reaching the server.

## **Common considerations**

### **Dashboard sharing** {#dashboard-sharing}

The tab follows the existing Dashboard Sharing rules for the `analytics-4` module. It renders wherever the widget does, and **`GET:benchmarking-data` is shareable**, so a view-only user gets the whole tab.

It needs no branch for it: the reports run under the module owner's credentials through `get_oauth_client_for_datapoint()`, exactly as every other shared report does. Two changes are what make that work, specified where each belongs — `sessionSource`, `landingPage` and `sessionCampaignName` in the [shareable dimension list](#report-gathering), and `propertyCreateTime` among the [view-only settings keys](#typical-traffic-chart).

**Nothing is pooled across users, so no sharing boundary runs through a cache.** Every stored copy of every response lives in the requesting user's own browser, behind a key prefix that hashes their login and session. A view-only user with Analytics but not Search Console shared gets a response built without the search-keyword rows and a tab built on that response and no other — which follows from where the cache lives rather than from anything the datapoint does.

The consequence to state plainly is that **two view-only users of the same dashboard can see different key factor cards**, where one's role has Search Console shared and the other's does not. That is the correct outcome — a reader should not be shown rows they have no access to: one reader can get a search keyword card where the other gets the `Organic Search` card behind it, and an `Organic Search` card that names a keyword for one names a landing page for the other.

The [feedback controls](#feedback) are the one part of the tab a view-only reader does not get. `FeedbackPrompt` renders nothing on the view-only dashboard, because `triggerSurvey()` on `core/user` sends nothing for a user who is not authenticated.

### **Tester plugin** {#tester-plugin}

The states that matter for QA are hard to produce on a real site: a property with a year of recorded traffic and a genuine weekly shape, a site on either side of each boundary the panel's states switch on, and each combination of drivers that produces a different set of key factor cards.

One filter over the response covers almost all of it, and it is the single point where the states behind it are reachable: no cards at all, one card, three cards of three different kinds, a card with no attributes and one with two, a falling card on a growing site, a card whose label is a long path or query, a daily series with gaps GA4 would have omitted, a band the line leaves both above and below, a band that starts partway into the range because the site's first recorded traffic is recent, a range with no band on any day, cards withheld because the previous period starts before the first recorded traffic, and a response with no recorded traffic at all.

The first day with recorded traffic should be forceable on its own, applied before anything is derived, so that the band, the cards and `firstTrafficDate` all follow from it and each of the panel's states — the notice for a missing band, the notice for withheld cards, and both zero states — is reachable on a mature property.

Reaching any forced state needs the browser cache out of the way, which `setUsingCache( false )` covers. **There is nothing to clear on the server**: a forced response takes effect on the next request rather than after a stored one expires.

The view-only path needs its own coverage, since it is the same path rather than a reduced one: a shared request under the owner's token, and a shared request whose caller cannot read Search Console data, against the same date range.

### **Site Health**

The epic adds no debug fields. Nothing about the tab is persisted or scheduled, and the datapoint composes its answer inside the request that asks for it, so there is no stored outcome or timing for a debug field to expose.

### **Feature Discovery**

The tab is introduced by nothing — no notification, tour step or badge. It appears in a card the reader already uses, beside a tab they already read, and a tab bar is its own affordance.

Nothing announces a part arriving either. A site whose recorded traffic grows into the band or the cards finds them in a tab it already has, and the notice that named what was missing stops naming it. Whether the tab offers to tell a reader when a part is ready is an [open question](#what-does-the-tab-show-while-a-site-history-is-short?).

### **Internal Measurement: GA4 Events** {#internal-measurement-ga4-events}

The [feedback controls](#feedback) emit the vote events `FeedbackPrompt` emits for every consumer, under a category of this tab's own:

| Category | Action | Label | When |
| :---- | :---- | :---- | :---- |
| `<viewContext>_typical-traffic-survey` | `vote_up`, `vote_down` | `chart`, or the key factor card's driver kind: `CHANNEL`, `CONTENT`, `SEARCH_KEYWORD`, `REFERRING_SITE` or `CAMPAIGN` | A thumbs up or a thumbs down on the chart or on a key factor card |

A reason chosen in a feedback popup is sent as a survey trigger and not as a GA4 event, as a feature card's dismissal reason is. The insight blocks' votes are the Traffic Insights epic's to name.

### **Internal Measurement: Feature Metrics**

None. Nothing in the tab records an outcome.

## **Alternatives considered**

### **Gathering the reports in the browser rather than in PHP**

The alternative was to derive everything client-side: the panel fetches the GA4 and Search Console reports through `getReport`, pairs and ranks the rows in `utils/`, and needs no datapoint at all. That reuses the plugin's reporting stack as it stands — caching and de-duplication, `areReportsLoading`, `getFirstReportError`, gathering-data and partial-data state, the `reportID` conventions.

We derive in PHP. Three properties of this particular data decide it:

* **The derived data has exactly one consumer.** Shared report caching pays off when several widgets read the same report, and nothing else on the dashboard reads a daily series reaching a year behind the selected range, or four channel breakdowns with comparison windows. One derived response cached under the date range serves this tab better than a dozen reports the rest of the dashboard never asks for.  
* **The cross-module dependency leaves the front end.** Client-side, the tab issues a Search Console request from inside an Analytics widget, wiring one module's reporting into another's component tree. Server-side it is a filter Search Console answers on its own terms, and neither module holds a reference to the other — see [Cross-module contextual data](#cross-module-contextual-data).  
* **One language owns the ranking.** The pairing, the ranking, the row caps and the rounding happen once, in PHP, and the browser renders the result. Deriving them in JS would put the same arithmetic on the side of the wire that has the weakest guarantees about number formatting, and would put the card selection — which decides what a reader sees at all — in the component that renders it.

The costs are real. The daily series is fetched twice on the Traffic section — once client-side for the Overview chart, once inside the benchmarking request — because the two paths do not share a cache. Loading is all-or-nothing across the tab rather than per section. And a reader who opens the tab pays for seven reports where the Overview tab's five are already warm.

### **Keyed JSON on the wire instead of a positional format**

The response could be the flat camelCase shape the components read, with no encoding step: readable in devtools, no version integer, no shared fixture, and no format implemented twice.

We encode. Up to ninety daily rows with a date string and a key per field, beside the key factor cards, is several times the bytes in browser storage — held for an hour, per date range a reader opens, in a store the plugin shares with every other cached response. **A format is the cheapest thing in this design to get right and the most expensive to change later**, which is the argument for fixing it now rather than after the response has more in it.

What it costs is named under [Technical debt](#technical-debt): one format, two languages, and a field added to one without the other is a silent misread rather than a type error. The shared fixture both test suites read is the mitigation, and it is a convention this epic introduces rather than one the repo already enforces.

### **Calling Search Console directly instead of filtering for its rows**

`Analytics_4` could resolve the Search Console module from `Modules` and call its datapoint, which is what `Email_Reporting_Data_Requests` does — an `if`/`elseif` over module slugs in one place that knows both modules. It is less indirection, and the whole response is then readable from one file.

The filter wins on which module owns what. Search Console's connection state, its property setting, its report shape and its failure modes stay behind its own callback instead of being conditions inside an Analytics datapoint; the extension point is declared once and any later contributor adds a callback rather than an edit. The Email Reporting precedent is a Core class composing two modules it is allowed to know about, which is not the position `Analytics_4` is in here.

The cost is that the response's contents are not enumerable from the datapoint alone, and a badly behaved callback holds up the one request the tab is waiting on. The first is answered by specifying the keys and row shapes under [Response assembly](#response-assembly); the second is the same exposure any `apply_filters()` in a request path carries.

### **Hiding the tab until the property is thirteen months old**

The tab could stay out of the widget until `getPropertyCreateTime()` is thirteen months back, so that every plotted day has most of a year of history behind it and the panel never reasons about too little of it. The same condition could sit on the widget's `isActive` instead, which is one check in one place.

We show the tab for every site, as agreed on the [Oct 20 sync](https://docs.google.com/document/d/1gv96CQnDowY6l_joXOZ7f5xethIHucJaz5f4STf8r94/edit). A missing tab tells a young site nothing for up to a year — neither that the analysis exists nor what it is waiting for — where a tab that names what it is waiting for says both. Property age is also the wrong measure: a property created long before its site was tagged passes the gate with a few weeks of recorded traffic, while the band and the cards both depend on recorded traffic rather than on the property. Putting the condition on the widget would be worse again, taking the traffic card away from the sites least able to spare it. The cost is the panel's notice and its two zero states, and a tab a young site can open to find a message in place of the chart.

### **Plotting thirteen months on the Typical Traffic chart**

The chart could plot the 395 days up to and including the selected range's `endDate` whatever the range, with the selected range marked inside them as a shaded region, so that the period is read against the year around it on the plot itself — the seasons leading up to it and the same time a year earlier.

We plot the selected range. Whether a day is normal for the site is the band's to say rather than a longer line's: every plotted day's expected range is fitted on up to the 365 days ending on it, centered on the site's current level and shaped by the weekday pattern of the year behind it, so a day reads against what the site's recent traffic makes normal for it without the year being drawn. Drawing the year as well costs the period its legibility: 395 points put about two pixels between days, so the weekday cycle becomes most of what a reader sees; a seasonal peak months back sets the scale and flattens the period being asked about; and the chart becomes the one in the dashboard that does not follow the selector, labelled `Last 28 days traffic` over thirteen months of line, with a shaded region and a support page to explain it. It would also carry 395 daily rows in every response rather than the selected range's. The costs of following the selector are two. The first is the season: the same time a year earlier is no longer on the plot, and the band does not stand in for it, because its fit has no term for the time of year — a seasonal swing moves the band with the site's recent level rather than being explained by it — so the one comparison with a year earlier left in the tab is the [generated insight's](./traffic-insights-design-doc.md#what-the-service-is-told), in words rather than on the chart. The second is the unit: the Overview chart counts visitors and this chart visits, so the two tabs plot different numbers for the same days, which the `Visits` label on the line and the support page behind the chart's info tooltip are what make legible.

### **Carrying the band seven days past `endDate`**

The band could continue a week past `endDate`, beyond a divider: the fit at `endDate` moved along its own monthly trend and spread onto each day with its weekday's factor, so the days just ahead have a shape rather than being blank. Everything it reads is already in the fit, so it costs no report.

We stop at `endDate`: the tab never shows a day that has not happened, as [decided after the Oct 20 sync](./typical-traffic-data-scenarios.md#settled). A band over the coming week reads as a forecast whatever the copy calls it — a reader sees what next Tuesday should bring — from a model that carries the site's current course and nothing about the season it is heading into. Stopping also takes a response member, three chart columns, the divider overlay and the stacking context it paints in out of the design. What it costs is the look ahead itself: the chart says what was normal, and nothing about what comes next.

### **One section per dimension instead of driver cards**

The key factors could be one section per dimension — channels, devices, visitor mix, referrers, search queries, content and categories — each listing its values that moved, ranked within the section, with the sections ordered by how much movement each explains. That needs one report per dimension and no cross reports, and every row is the same arithmetic.

We build driver cards. Seven parallel lists put the same visits in front of a reader several times over: a referral surge from one site is a `Referral` row, a referrer row, a `desktop` row, a `returning` row and a row for the page it landed on, each competing with the others for attention and none saying they are one event. A device or a visitor type, standing alone, also crowds out the specific drivers it only mirrors. Cards answer a different question — which few things moved traffic — and put device and visitor type where they explain something, under the driver they qualify. The cost is the cross reports, the parent-child suppression and a second pass for the kept cards' attributes, all of it in PHP.

### **Scoring the cards against a partly recorded previous period**

The cards could compare the selected period with whatever part of the previous one has recorded traffic — scaled up to the period's length, or matched day for day against the same number of days at the end of the selected period — so that a young site gets cards from a couple of weeks of history whatever the range.

We withhold the cards until the previous period has recorded traffic on every day, as agreed on the [Oct 20 sync](https://docs.google.com/document/d/1gv96CQnDowY6l_joXOZ7f5xethIHucJaz5f4STf8r94/edit). A scaled comparison invents traffic for days the site was not yet measured, and a shortened one compares a different period from the one selected; either way a card's change and its share would describe a movement the site did not have. The cost is the wait: on the default 28-day range, a site has no card until it has 56 days of recorded traffic.

### **Counting visitors instead of sessions**

The tab could count `totalUsers`, the metric the Traffic Overview chart plots, so that the two tabs draw the same line over the same days. Or it could split the two: `totalUsers` for the daily series, so the line matches the Overview tab's, and sessions for the breakdowns alone.

We count sessions everywhere. A visitor who arrives through two channels, or lands on two pages, is one visitor in the site's total and one in each breakdown row, so no breakdown of visitors adds up: a channel's referring sites can exceed the channel, a card's attributes are not parts of it, and a share of the site's movement is a share of a number nothing sums to. Sessions partition across every dimension the cards read, and a session is what the card calls a visit. Splitting the two would put two units in one tab: a card's change would not be part of the change the line shows, and the period totals the [generated insight](./traffic-insights-design-doc.md#payload-assembly) quotes would not be the totals its cards reconcile to. The cost is that the two tabs plot different numbers for the same day, which is why the Typical Traffic chart labels its values `Visits` where the Overview chart says `Users`, and why the legend label both tabs share names traffic rather than a unit.

## **Future Work**

### **The Typical Traffic tab on the entity dashboard**

The tab is main-dashboard only. A per-URL version is a different analysis rather than the same one filtered: a single page's year of traffic, which every band is fitted on, is dominated by its own publication date, and the breakdowns behind the key factor cards are thin for most URLs. If it is wanted, it needs its own design for what "typical" means for one page.

### **Low-traffic handling**

Low-traffic sites need rolling averages, more cautious language and de-emphasized short-term change. The chart already does part of that: the [expected range](#expected-range)'s margin floor keeps a small site's band wide enough that ordinary noise stays inside it. The line is still raw daily counts, and the key factor cards' floors are absolute — ten sessions to name a specific driver, five to keep any candidate — so on a small site a card can still name a change of a dozen visits. Whether the line is smoothed and the floors scale with the site, or the cards say something different, is a follow-up. A smoothed line needs a band smoothed the same way, since the band carries each weekday's shape and would otherwise still wave with the weekday cycle the smoothing removed from the line.

### **Published posts on the chart** {#published-posts-on-the-chart}

The chart's design carries one element beyond the line, the band and the [feedback control](#feedback): a marker for each published post, with a legend item of its own beside the line's and the band's. It is built separately from this epic.

## **Dependencies**

No new external dependency. The GA4 Data API and the Search Console API are both already depended on, and no other team's work or Google-side approval gates this epic.

The main internal dependency is the widget this tab is added to: the shell that holds its tabs as a list, and the directory the panel lands in. Everything in this epic is additive to it — no existing tab or report changes.

The [feedback controls](#feedback) depend on \#13679, which turns the Site Goals feedback prompt into the shared `FeedbackPrompt`. They are the one part of the epic that changes components other features render: `FeedbackPrompt` itself, and `FeedbackMenu`, which a feature card's dismiss action opens.

Search Console is a soft dependency rather than a hard one. Where it is disconnected, or shared with a role that a view-only reader does not have, no card names a search keyword and no card carries one as an attribute, and the rest of the tab is unaffected.

## **Migrations**

No migrations are required. Nothing the tab reads or draws is persisted: the response is composed and discarded inside the PHP request that produced it, and its only copy lives in browser storage.

## **Technical debt** {#technical-debt}

Two items:

1. **One format is implemented twice, in two languages.** The [wire format](#wire-format)'s encoder is PHP and its decoder is JS, and a field added to one without the other is a silent misread rather than a type error. The shared fixture both test suites run against is the mitigation, and it is a convention this epic introduces rather than one the repo already enforces. The debt is real and the alternative — keyed objects on the wire — costs several times the bytes in browser storage.  
2. **The plugin derives analytical inputs on behalf of one tab.** `Benchmarking/` exists because the browser is the wrong place to pair, score and select drivers across a dozen reports. If those rows ever gain a second consumer, the derivation is in the right place already; if the tab is removed, it is dead weight and should be deleted rather than maintained. Keeping it in classes with no REST or widget dependencies is what makes that removal a deletion rather than an unpicking.

# **Quality attributes**

## **Security**

The new surface is one read datapoint and one public filter. Two risks:

**A public filter feeding the dashboard.** `googlesitekit_benchmarking_contextual_data` lets any plugin on the site contribute rows, and any string it returns is rendered in the dashboard. **The data datapoint validates what the filter hands back rather than forwarding it**: known keys only, the row shape each key declares, scalars cast, and the same row cap applied to filtered rows as to derived ones. That keeps a third-party callback to the same contract Search Console's own is held to.

**Rendered report data.** Landing paths, campaign names, source hostnames and search-query strings originate from visitors' URLs, from whoever tagged a link, and from visitors' searches. Every one of them is rendered as a React child rather than as HTML, and no string in the response reaches `dangerouslySetInnerHTML`.

**Authorization.** The datapoint implements `Permission_Aware_Datapoint` and declares the dashboard-viewing capability, so the existing `REST_Modules_Controller` permission dispatch applies and a view-only user reaches it. Left to the route it would inherit the `READABLE` branch's broader default; declaring the check is what makes it correct rather than merely permissive.

**A view-only user's request runs under the owner's identity**, which is the same delegation every shared GA4 report already performs, under the same conditions and widened by nothing here beyond the three dimensions added to the shareable list.

## **Reliability**

The tab is one request, and it either resolves or it does not. A GA4 failure puts the panel in `WidgetReportError`, which is what that component exists for; a Search Console failure costs the search-keyword candidates and attributes and nothing else, because the filter's contribution is optional by construction. A failure in the second pass is a GA4 failure like any other and puts the panel in the same state.

**The request is reports and arithmetic, and nothing in it waits on a third party the plugin does not already depend on.** Two batched GA4 calls and one Search Console call complete well inside `max_execution_time` on the hosting the plugin runs on, and there is no outbound call whose duration the plugin cannot predict.

**The expected range cannot fail the request.** It is arithmetic over rows the request already holds, every division in it is guarded, and a day it cannot fit is a day without a band rather than an error.

Local data loss is not a concern: nothing about the feature is persisted anywhere in the plugin. A browser cache that is cleared, a session store that is evicted, or a storage backend that is unavailable altogether costs report round trips, not correctness — every request treats a miss as the normal case, and none of them reads state it cannot rebuild.

**The Overview tab is unaffected by anything here.** It resolves its own reports through its own hooks, so a failure of `GET:benchmarking-data` leaves the card's first tab exactly as it was.

## **Privacy**

The response carries the site's own analytics data to the browser: aggregate session counts, channel names, landing paths, referrer hostnames, campaign names, and search queries with their clicks. All of it is data the requesting user can already read in the dashboard.

No new OAuth scope is requested. No new custom dimension is created, so no additional data is collected from site visitors. Search queries are Search Console's already aggregated and anonymized queries.

**Nothing this feature reads is stored on the site.** The response is assembled and discarded inside the PHP request that produced it. Where it is held is browser storage, under a key prefix hashing the plugin version, the WordPress user's login, their auth session token and the blog ID — so an entry does not outlive a logout and does not reach another user of the same browser. The preferred backend is `sessionStorage`, so in practice it does not outlive the tab.

## **Scalability**

**The unit that scales is the number of distinct date ranges opened per reader per hour.** A full miss costs two batched GA4 calls and one Search Console call. A repeat over the same dates in the same tab is answered from browser storage without reaching the server.

Report count does not grow with the size of the site: every query is aggregated, each breakdown carries its current and comparison window as two date ranges in one request and asks for at most 250 rows, and the second pass runs for at most three cards whatever the number of candidates. Batching is what keeps the five first-pass reports to one call and the second pass to at most two, which matters here more than it does elsewhere because they are serial inside one PHP request rather than parallel across the browser's connection pool.

The largest of them is the daily series: at most 454 rows — the longest range's 90 days and the 364 before them — well inside the GA4 Data API's default row limit, and linear to zero-fill and sum. The [expected range](#expected-range) fits each of the at most 90 plotted days on at most 365 of them — a sort and a few linear passes per day, small beside the report calls. Only the plotted days cross the wire, as one count and two one-decimal bounds each, beside one offset for the first day with recorded traffic, and the [wire format](#wire-format) is what keeps those to a few kilobytes in the response rather than several times that.

Nothing in the feature iterates posts, users or terms, so a site with 100k posts behaves the same as a small one.

## **Accessibility (a11y)**

The tab panel needs correct `role="tabpanel"` and `aria-labelledby` wiring, and the tab bar's own keyboard behavior is `TabBar`'s and already correct.

The chart's title is a heading inside the tab panel. Its info tooltip opens on keyboard focus as well as on hover and touch, so its copy does not need a pointer, and it stays open while the pointer is over it, so the `Learn more` link can be clicked; `InfoTooltip` already behaves both ways. The legend names the line and the band in text, each beside a swatch of its own shape — a bar for the line, a block for the band — so neither is identified by its color alone. The property-creation marker carries the sentence the Overview chart already gives screen readers for the same day.

The notice and the zero states are text in the panel's reading order, ahead of the chart, so a reader who cannot see the plot learns which part is missing, and why, before reaching it.

The key factor cards are text in reading order, which is the easy case — each card is a labelled region named by its driver, and each attribute row pairs its title with its value, its change and its share. A change carries its sign in text, and a share badge says `growth` or `drop` in words, so direction is never carried by color alone. The vertical rule and dot beside each card are decorative.

The [feedback buttons](#feedback) keep the accessible names `ThumbsSurveyTrigger` gives them and announce which of the two is pressed. On a key factor card, keyboard focus reveals the pair as the pointer does, so the buttons are in the tab order rather than reachable only with a mouse. The reasons popup is a menu labelled by its heading: the arrow keys move between reasons, Enter chooses one, and Escape closes the menu and returns focus to the thumbs down. `FeedbackMenu` already behaves this way.

## **Internationalization (i18n)**

Every string in the tab is a plugin string translated as usual, and every number and percentage is formatted through `numFmt`, including inside the key factor copy. The cards' changes and share badges are `sprintf` over translated patterns rather than concatenated fragments, so a language that orders a sentence differently can. The chart's tooltip is one translated string with its `Learn more` link as a tag inside it, for the same reason, and the chart's legend reuses the Overview chart's plural forms for the line and adds one string, `Expected range`, for the band. The line's column adds one more, `Visits`, since the Overview chart's `Users` would misname a session count. The notice and the zero states are translated patterns as well: a count of days in them takes its plural form from `_n()`, and the range a zero state suggests is named by the label `getAvailableDateRanges()` already gives the selector.

Two constraints worth naming:

1. **Channel names, hostnames and campaign names are API-supplied labels**, not the plugin's strings, so a card carries them beside translated chrome. The two must not be concatenated into one translatable string. Device and visitor type are the exception: the plugin translates the tokens it knows — `desktop`, `mobile`, `tablet`, `new`, `returning` — and shows any other value as given.  
2. **Paths, campaign names and search queries are the site's and its visitors' own**, in any script and any direction, and the card has to truncate them without assuming a writing direction.

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
| 9 | Typical Traffic: the traffic chart for the selected date range | 11 |  |
| 10 | Typical Traffic: key factor cards | 15 |  |
| 11 | Loading, error and short-history states for the Typical Traffic tab, in place of its history gate | 15 |  |
| 12 | Typical Traffic: feedback controls on the chart and the key factor cards | 11 |  |
| 13 | Add the expected-range model in PHP | 15 |  |
| 14 | Carry the expected range and the first day with recorded traffic in the benchmarking response and the wire format | 11 |  |
| 15 | Typical Traffic: the expected range on the chart | 11 |  |
| 16 | Add `landingPage` and `sessionCampaignName` to the shareable Analytics dimensions | 3 |  |
| 17 | Carry key factor cards in the benchmarking wire format in place of the dimension arrays, and rename `visitors` to `visits` | 11 |  |
| 18 | Select the key factor cards and their attributes in the benchmarking response | 19 |  |

**TOTAL: 210 STORY POINTS across 18 issues**

**The wire format is the first thing to land after the flag and the contract everything else is built against.** The encoder, the decoder and the [shared fixture](#wire-format) are a small, self-contained issue with no dependency on a report, a datapoint or a component, and once it exists the server-side half writes against the encoder while the panel and its sections read a decoded fixture. Agreeing the layout early is what lets the two halves proceed in parallel, and the [panel data flow](#panel-data-flow) table is the version to agree.

Report gathering and response assembly is the largest server-side issue and the one most likely to need splitting when its brief is written: it owns the report options for every dimension, the batching, the zero-fill, the value pairing, the ranking, the row caps and the dimension order. Splitting it by report group — the daily series and period totals first, the dimension reports second — is the obvious line if it is needed.

Sharing is critical path rather than a follow-up: without it the view-only dashboard shows an error where the tab should be. It is separate from the datapoint because it is verifiable on its own — a dispatch as a view-only user — and because the two allow-list additions need reviewing as what they are.

**The chart follows the selector, and its issue narrows the response to match.** The response assembly shipped with a fixed 395-day `dailyTraffic`, and the datapoint holds a request to half of it; rather than reopening either, the chart issue narrows `dailyTraffic` to the selected range and holds a request to the selector's 90 days, so the chart and the days it draws land together. The chart itself shares the Overview chart's axis, options, legend and property-creation marker, so its work is the table built from `dailyTraffic`, the header with its tooltip, the legend and the marker.

**The driver cards replace the per-dimension sections in work that has already started, and three issues carry them there.** The wire format, the response builder, the contextual-data filter and the datastore slice shipped against seven ranked dimension arrays, and the sharing issue was already in progress with `sessionSource` as its only new shareable dimension. Rather than reopening any of them, the change lands as three. The first adds `landingPage` and `sessionCampaignName` to the shareable dimensions, beside the `sessionSource` the sharing issue adds; it is small and lands first, because without it the server-side change fails every shared request. The other two follow in the order the format went in originally. The first of those replaces wire members `5` and `6` with the cards and their attributes and moves the decoder, the decoded type and the shared fixture with them, so the front end has the contract before the server fills it, and renames the shipped `visitors` fields to `visits` on both sides of the format, so the expected-range work is written against the new names. The second does everything server-side: the session breakdowns in place of the seven dimension reports, the daily series on `sessions` in place of `totalUsers`, the scoring by driver kind, the gate, the suppression, the selection, the second pass, the rule that withholds every card while the previous period starts before the first recorded traffic, and Search Console's keyword breakdowns through the existing filter. It is the larger of the two, and the one to split by pass — candidates and selection first, attributes second — if its brief needs splitting.

The key factors issue carries the catalog and one card renderer for every kind. It renders whatever the response gives it, so its brief has to name the cases that are awkward to reach naturally: no cards at all, a card with no attributes, a falling card on a growing site, and a kind the catalog does not know.

**The states issue lands last, and it is the one that takes the history gate out.** It needs both sections present to be worth reviewing, and `firstTrafficDate` in the response, which lands with the expected range's own response member because it is the day the band's history starts on. The tab and its gate shipped together; the states issue drops the property-age condition from `useHasTypicalTrafficTab()` in the same change that adds the notice and the zero states, so no build shows a young site an empty panel. It also owns the decision to render a chart of zeros, rather than a zero-data CTA, for a site with recorded traffic and none in the selected period.

## **Documentation in-product** {#documentation-in-product}

The tab needs support links in two places, resolved through `getDocumentationLinkURL()` on `core/site`:

1. **Behind the `Learn more` link in the chart's info tooltip**, explaining the line and the band under it: that the line counts visits rather than the visitors the Traffic Overview tab counts, so the two tabs show different numbers for the same day; that the band is the range the site's recent traffic makes normal for each day, centered on its level over the last four weeks and shaped by the weekday pattern of up to its last 12 months — wider on a small site because a small site's traffic genuinely varies more, starting four weeks after the first recorded traffic, and marking a normal day rather than a good one; and that the band follows the site's level and knows nothing of the season, so it moves with a seasonal rise or fall rather than expecting it.  
2. **Behind the notice and the zero states**, explaining how much recorded traffic each part of the tab needs — 28 days up to a day for that day's band, and traffic on every day of the previous period for the key factor cards — counted from the first day the site recorded traffic rather than from the property's creation, for the reader who wonders why their site shows a notice where a colleague's shows the band.

The support team drafts these before rollout; the slugs are added with the links. Until then, both links point at `#`.

## **Testing plan considerations**

The hard part is data. The band says something worth looking at only on a property with a year of recorded traffic and a real weekly shape, the panel's states need sites with days, weeks and a couple of months of it, and the key factor cards need a period in which one channel, page, source, campaign or query genuinely moved. QA therefore depends on tester-plugin support for forcing the response, listed under [Tester plugin](#tester-plugin), plus access to an Analytics property with genuine history.

**The derivation is PHPUnit's and the rendering is Jest's**, and the response is the seam between them. PHPUnit covers the assembly on hand-built report fixtures: the zero-fill over days GA4 omitted, `firstTrafficDate` and the cards withheld while the previous period starts before it, a value present in one window and absent from the other, the score and the floors, the gate at exactly `10` sessions and exactly `15%`, the suppression of a parent channel, the selection of three, the share against `gain` and `loss`, the attribute choice and its device rule, the second pass running only for the kept cards, and the filter contract — including a callback that errors and one that returns the wrong shape. Jest covers the panel's states and the cards, driven from decoded fixtures rather than from report responses, and the state function on its own at every boundary it switches on. Storybook stories cover the tab in loading, error and ready states, each partial view's notice and both zero states, which also gives VRT coverage.

**The [expected range](#expected-range) is asserted to the decimal.** Its arithmetic is fixed, so a daily series has exactly one set of bounds, and PHPUnit asserts every one of them on series that each exercise a rule: flat traffic, which must sit inside its band; a strong weekday pattern, which the band must follow; a viral day and a tracking outage, which the clamp must contain; a spike on the last day, which must leave every earlier day's band unchanged; a series with fewer than 28 days of history, which must have no band; leading zeros, which must be dropped before fitting; and a series that is zero throughout. Jest covers the chart's side: the table builder puts the bounds in two interval columns, leaves `null` where a day has no band, ends on `endDate`, and fits the axis over the band; the legend carries the band's item with a block swatch; and the property-creation marker is drawn only for a creation date inside the range. VRT covers the band itself, at a small, a medium and a large site's traffic, so the band's proportional width is in the reference images, and a band that starts partway into the range, so the edge it starts at is in them too.

**The [wire format](#wire-format) is the one thing both suites test, and they test it against the same file.** The PHP encoder's test asserts that a fixed set of derived values encodes to the checked-in fixture, and the JS decoder's test asserts that the same fixture decodes to the objects the sections expect. A field added on one side without the other fails one of the two rather than producing a silent misread in the dashboard. One case beyond the happy path belongs here: an unknown version integer, which must be rejected rather than guessed at.

**The view-only path belongs in PHPUnit rather than only in manual QA**: a shared request must resolve the owner's client for the reports, which is assertable by dispatching the datapoint as a view-only user. The Search-Console-not-shared case belongs beside it — a response selected without search keywords, and a tab that renders its cards rather than erroring.

Seven cases are worth naming because they are easy to miss and awkward to reach naturally:

1. **A property younger than its daily report**, whose report reaches back before the property was created and whose earliest plotted days are fitted on less than a year — the zeros before its first recorded traffic must stay out of every fit, and `firstTrafficDate` must be the day the fits start on rather than the report's first day.  
2. **Two candidates with the same score, and two attribute kinds whose values moved by the same amount**, which the selection has to break deterministically rather than by report order.  
3. **A referring site that clears the gate under a `Referral` channel that would otherwise lead**, which must take the channel's place rather than sit beside it.  
4. **A channel that fell on a site that grew**, whose badge must read as a share of the site's loss rather than as a negative share of its gain.  
5. **Selecting the tab twice**, which must issue one request rather than two — the property that the API layer's hour-long entry is what makes cheap, and the one that silently regresses if the resolver is keyed on anything but the two dates.  
6. **A property tagged long after it was created**, whose daily report is zero for months before the first recorded traffic, and whose band must start four weeks after that day rather than fitting the zeros before it — and whose cards must stay withheld until its previous period starts on or after that day.  
7. **History on each side of a state's boundary**: 27 and 28 days of recorded traffic up to `endDate`, for the band under the last day; a previous period that starts on `firstTrafficDate`, which shows the cards, and one that starts the day before, which withholds them; and 13 and 14 days on a 28-day range, which separate the Collecting state from the Not enough data state.

## **Launch plans**

The epic follows Site Kit's usual staged rollout. The `typicalTraffic` flag is enabled for 20% of users, and — absent critical issues — for the remaining 80% two weeks later.

There is no external dependency, so the flag can be enabled as soon as the epic is complete. Every site in the 20% cohort sees the tab — a young site with a notice or a zero state where a mature one has the band and the cards — so the first two weeks' feedback covers sites at every length of history rather than only the mature ones.

An issue to remove the `typicalTraffic` flag and its conditional logic should be raised once the feature is stable at 100%.

# **Open questions**

## **How long can a card's label be?** {#how-long-can-a-card-label-be?}

The number of rows is settled — three cards and two attributes on each — so what bounds the worst case is the length of a label. A landing path with a long slug, a campaign name someone typed into a URL builder, and a long-tail search query can each run far past the width of a card, and the [design](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2096-14304&m=dev) truncates a path with an ellipsis after about twenty characters.

Undecided: whether the response truncates labels to a fixed length, which bounds browser storage, or carries them whole and leaves truncation to CSS, which keeps the full value for a tooltip; and whether a truncated label shows its full value on hover or focus.

Blocked on this: the label handling in the response builder and in `KeyFactorCard`.

## **Where does AI-assistant traffic come from?** {#where-does-ai-assistant-traffic-come-from?}

A visit from an AI assistant's answer is a driver a site owner wants named, and its card would carry the assistant, the landing page and the user type as its attributes. What is not settled is how the plugin recognizes such a visit. The default channel grouping the breakdowns read is GA4's, and the plugin either reads an AI channel from it by name or derives one itself — from a list of assistant hostnames among the `Referral` sources, collapsed the way Facebook's variants are.

Undecided: which of the two; if derived, the list of hostnames and who maintains it; and whether a derived AI channel takes its sessions out of `Referral`, so the two never share them.

Blocked on this: the `Assistant` attribute kind, and an AI-assistant row in the [attribute candidates](#key-factors).

## **Should a Direct card read click identifiers off its landing URLs?** {#should-a-direct-card-read-click-identifiers-off-its-landing-urls?}

Some direct visits are not direct at all. A link opened inside the Facebook app often arrives with no referrer but with `fbclid` on its query string, and the same is true of other platforms' click identifiers. Read off `landingPagePlusQueryString`, that remnant names where a share of the Direct card's visits really came from, which is the most actionable thing a Direct card could say.

Undecided: whether a Direct card does this at all; the list of identifiers and the platform each names; how the result renders on the card, for which there is no design; and whether those visits are counted as the platform's rather than Direct's, which would change the Direct card's own figure.

Blocked on this: a third breakdown for the Direct card, `landingPagePlusQueryString` among the shareable dimensions, and the card's design.

## **What does the tab show while a site's history is short?** {#what-does-the-tab-show-while-a-site-history-is-short?}

The mechanism is fixed: the response carries the first day with recorded traffic, and the [panel](#panel-states) derives every state from it. The rules it applies are not: the band is drawn on whichever plotted days have one, at any share of the range; the line and the key factor cards show before any band can; and the tab turns to a zero state only when neither the band nor the cards can show. The cases each alternative changes are worked through in the [data scenarios](./typical-traffic-data-scenarios.md#decisions-needed).

Undecided: whether a day needs more than 28 days of recorded traffic for a band, and whether a band with a few weeks of history behind it is drawn differently from one with a year; how much of the range the band must cover before the chart draws it; whether the line and the cards show before any band does, or the tab shows a zero state until the band can; the shortest range the tab serves; whether the notice and the zero states say when a part will be ready — as a date, roughly, or with an offer to tell the reader — and the notice's copy, for which there is no design; and the chart tooltip's `last 12 months`, which is not true of a site with less history.

Blocked on this: the thresholds in the panel's state function, and the copy of the notice, the zero states and the tooltip. The response is not blocked: it carries `firstTrafficDate` whatever the thresholds become.

## **Is there a minimum traffic volume for the Typical Traffic tab?** {#is-there-a-minimum-traffic-volume-for-the-typical-traffic-tab?}

A site averaging two visits a day can have a year of history and nothing typical about any of it: the chart is noise, and a key factor card can name a driver whose whole change is a dozen visits. Nothing currently declines to render for such a site. The band is the one part that already allows for it — its margin floor puts a two-visit day's band at about 80% either side — but a band that wide holds almost anything, and says correspondingly little. Unlike a short history, a low volume is not something time fixes, so a state for it would say something none of the panel's states says.

Undecided: whether there is a floor; if so, what it is measured over and what the tab shows beneath it; and whether the datapoint, which has the series in hand, reports it in the response the way it reports the first day with recorded traffic.

Blocked on this: whether the panel needs a state about volume.

# **Appendices**

The following are implementation-level details that can be settled at the Implementation Brief stage of the individual issues.

### **Datapoint response shape**

What `GET:benchmarking-data` returns once decoded, and therefore the fixtures every front-end issue is built against. These are the plugin's own shapes: camelCase, flat, and unrelated to what the reports return.

| Field | Type | Present |
| :---- | :---- | :---: |
| `visits` | `{ current: int, previous: int }`, the sessions of the selected period and of the period before it | Always |
| `dailyTraffic` | `Array<{ date, visits, expectedMin, expectedMax }>`, one row per day of the selected range; `visits` is the day's sessions, and `expectedMin` and `expectedMax` are one-decimal floats, or `null` on a day the expected range cannot fit | Always |
| `firstTrafficDate` | `string`, `YYYY-MM-DD`, the first day of the daily report with recorded traffic, or `null` when the report records none | Always |
| `keyFactors` | `Array<KeyFactor>`, at most 3, in rank order; empty when no candidate survives, and when the previous period starts before `firstTrafficDate` | Always |

`KeyFactor` is `{ kind: KeyFactorKind, label: string, current: int, previous: int, sharePct: float, attributes: Array<KeyFactorAttribute> }`, with at most 2 attributes, and `KeyFactorAttribute` is `{ kind: KeyFactorAttributeKind, label: string, current: int, previous: int, sharePct: float }`. `current` and `previous` count sessions, or clicks where the kind is `SEARCH_KEYWORD`; `sharePct` is a one-decimal float between `0` and `100`.

`KeyFactorKind` is one of `CHANNEL`, `CONTENT`, `SEARCH_KEYWORD`, `REFERRING_SITE` or `CAMPAIGN`. `KeyFactorAttributeKind` is one of `TRAFFIC_CHANNEL`, `LANDING_PAGE`, `SEARCH_KEYWORD`, `REFERRING_SITE`, `PLATFORM`, `CAMPAIGN`, `DEVICE` or `USER_TYPE`.

### **Contextual data keys** {#contextual-data-keys}

The rows the response builder selects from, and the contract a [`googlesitekit_benchmarking_contextual_data`](#cross-module-contextual-data) callback is validated against. Every count is a `{ current, previous }` pair over the two windows, as two integer fields, and every key holds at most 250 rows.

| Key | Row | Contributed by |
| :---- | :---- | :---- |
| `channelBreakdowns` | `{ channel, device, userType, current, previous }`, sessions | `Analytics_4` |
| `channelSources` | `{ channel, source, current, previous }`, sessions | `Analytics_4` |
| `channelPages` | `{ channel, page, current, previous }`, sessions | `Analytics_4` |
| `channelCampaigns` | `{ channel, campaign, current, previous }`, sessions | `Analytics_4` |
| `searchKeywords` | `{ keyword, current, previous }`, clicks | `Search_Console` |
| `searchKeywordPages` | `{ keyword, page, current, previous }`, clicks; `page` a path | `Search_Console` |
| `searchKeywordDevices` | `{ keyword, device, current, previous }`, clicks; `device` a GA4 device token | `Search_Console` |

The second-pass reports are not contextual data: they run after the selection, only for the kept cards, and no callback sees them.

### **Wire format layout** {#wire-format-layout}

The positional layout the [wire format](#wire-format) fixes, at the level the encoder and decoder have to agree on. The index names live in `constants.ts` on the JS side and in class constants on the PHP side; the table is what those two sets of names describe.

| Envelope member | Holds |
| :---- | :---- |
| `0` | format version, an integer |
| `1` | the string table: every label and path, once each |
| `2` | the first plotted date, as `YYYY-MM-DD` — every later row's date is its offset from this |
| `3` | the daily series, one session count per day |
| `4` | `[ visitsCurrent, visitsPrevious ]`: the sessions of the selected period and of the period before it |
| `5` | the key factor cards, in rank order: each `[ kind, label, current, previous, sharePct ]` |
| `6` | the cards' attributes: one array per entry of member `5`, in the same order, each attribute `[ kind, label, current, previous, sharePct ]` |
| `7` | the expected range: one `[ expectedMin, expectedMax ]` pair per day of member `3`, in the same order, or `null` for a day without a band |
| `8` | the first day with recorded traffic, as its offset in days from member `2` — negative when it falls before the range — or `null` when the daily report records no traffic |

Four conventions the table does not show, and the encoder and decoder both depend on:

* An enum value travels as its index in a fixed list, not as its string. The driver kinds are listed `CHANNEL`, `CONTENT`, `SEARCH_KEYWORD`, `REFERRING_SITE`, `CAMPAIGN`, and the attribute kinds `TRAFFIC_CHANNEL`, `LANDING_PAGE`, `SEARCH_KEYWORD`, `REFERRING_SITE`, `PLATFORM`, `CAMPAIGN`, `DEVICE`, `USER_TYPE`; a kind is only ever appended. A decoder that does not recognize an index drops the card or the attribute, the way an unrecognized catalog entry is dropped.  
* A missing value is `null`, never `0` or an empty string. Zero is a real count.  
* A string is always a reference into the string table, never an inline literal.  
* Every non-integer arrives already rounded. The decoder does no arithmetic at all.

### **Chart table and options** {#chart-table-and-options}

The table, in column order. Interval columns annotate the series column they follow, so the order is load-bearing rather than cosmetic. `null` in a cell is a gap the chart must not interpolate across.

| \# | Column |
| :---- | :---- |
| 0 | `date` |
| 1 | `visits`, labelled `Visits` |
| 2 | `expectedMin`, `role: 'interval'`; `null` on a day without a band |
| 3 | `expectedMax`, `role: 'interval'`, the same |

The table's last row is `endDate`: nothing is plotted for a day that has not happened.

The chart starts from the Overview chart's `TRAFFIC_CHART_OPTIONS`, so its line color, its date labels, its value axis on the right, its gridlines and its crosshair match the Overview chart, as the [chart's design](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=1747-32704&m=dev) draws them. The options that carry a decision rather than a preference:

| Option | Value | Why |
| :---- | :---- | :---- |
| `hAxis.ticks` | one per plotted day from the second on | The Overview chart's ticks, which Google Charts thins to the labels that fit; the first day's label would sit against the edge of the plot. |
| `hAxis.baseline` | the last plotted day | Draws the gray line along the right edge of the plot, as on the Overview chart. |
| `vAxis.viewWindow` | fitted over the line and the band's upper bounds | An axis fitted to the line alone clips the band wherever it sits above the line. |
| `intervals` | `style: 'area'`, the band's tint and opacity, `lineWidth: 0`, `pointSize: 0` | Draws the expected range as a filled area with no edge lines or points. |
| `interpolateNulls` | `false` | Leaves a day without a band empty rather than bridging the band across it. |
| `legend` | `position: 'none'` | The legend is HTML: `ChartLegend` below the plot, as on the Overview chart. Google Charts cannot show a band in its own legend. |
| `gatheringData` | never passed | A site with too little recorded traffic gets one of the panel's [zero states](#panel-states) in place of the chart, so the chart never renders in the state the flag describes. |

### **Expected range model** {#expected-range-model}

The [expected range](#expected-range) step by step, as `Expected_Baseline` computes it. A fit for day `t` reads `H`, the rows from the first day with recorded traffic up to and including `t`, and keeps the last 365 of them as its window `W`, of length `n`. With fewer than 28 rows in `H` there is no fit, and `t` has no band.

| Step | Computation |
| :---- | :---- |
| Clamp | Sort `W`. `Q1` and `Q3` are the values at zero-based positions `FLOOR( n / 4 )` and `FLOOR( 3 * n / 4 )`, and `IQR = MAX( 10, Q3 - Q1 )`. Every value in `W` is clamped to `[ MAX( 0, Q1 - 2.5 * IQR ), Q3 + 2.5 * IQR ]`. |
| 28-day totals | The clamped sums over positions `[ 0, 28 )`, `[ 14, 42 )`, `[ 28, 56 )` and so on while `W` lasts, then the clamped sum of the last 28 days unless the last of those already equals it. `K` is how many there are. |
| Weekday shape | `S( d ) = 0.10 + 0.90 * mean( d ) / mean_all`, where `mean( d )` is weekday `d`'s mean over the clamped `W` and `mean_all` is the mean of the seven; a `mean_all` of `0` or less is read as `1`. |
| Trend | Weighted least squares over the 28-day totals against `x_k = k * 14 / 30.4375` months, with weights `EXP( -0.18 * ( K - 1 - k ) )`. The monthly slope is the fitted slope over the weighted mean of the totals, as a percentage, and `0` when the fit's denominator is `0` or the weighted mean is not positive. `UP` above `+4%`, `DOWN` below `-4%`, `STABLE` otherwise. The band does not read it; [Traffic Insights](./traffic-insights-design-doc.md#expected-baseline) does. |
| Center | Ordinary least squares through the last 28 clamped days; its value on the last of them, held to `[ 0.6, 1.2 ]` times their mean; `B = MAX( 10, 28 * that )`. |
| Margin | `RMSE = SQRT( SUM( ( v - B / 28 * S( d ) )^2 ) / 21 ) * SQRT( 28 )` over the last 28 clamped days `v`, each with its weekday `d`. `floor = 5 * SQRT( B ) + 0.13 * B`, `ceiling = MAX( floor, 0.24 * B )`, and `M = MAX( 15, floor, MIN( ceiling, 2.5 * RMSE ) )`. |
| Short history | With `K < 2`: `B` is the raw sum of the last 28 days of `H`, `M = MAX( 15, 0.18 * B + 6.5 * SQRT( B ), 0.25 * B )`, and the trend is `STABLE`. |
| Band | `expectedMin = ROUND( MAX( 0, B - M ) / 28 * S( d ), 1 )` and `expectedMax = ROUND( ( B + M ) / 28 * S( d ), 1 )`, with `d` the weekday of `t` and `S` from the fit at `t`. |

Three properties the implementation has to hold, because the fixtures' bounds depend on each: the quartiles are positions in the sorted window rather than interpolated percentiles; `ROUND` rounds half away from zero, as PHP's `round()` does by default; and every sum runs over its days oldest first, since a sum in another order can move a bound across a rounding boundary.

[image1]: <data:image/png;base64,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>