**Reviewed at:** [`d325a67e6d`](https://github.com/google/site-kit-wp/commit/d325a67e6decf70c1dd048240ad1718f56ce7391) (Nov 19\)

**Sources**

- **Service spec (source of truth):** [`benchmarking_feature_design.md` @ `2f22a63d`](./benchmarking_feature_design.md). "§" references below point to its sections. *Update (Nov 26): the linked copy is now the service's spec at `9d3e7d69`, its v17, which the plugin follows since the ports in the Key factors updates. The section numbers are unchanged.*  
- **Designs:** [Figma, Performance benchmarking → Iteration 3](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2905-60416)  
- **Product decisions:** [Typical traffic: data scenarios](./typical-traffic-data-scenarios.md) (decision IDs like D13) and [Change drivers](./typical-traffic-change-drivers.md)

**Terms used below**

- **Band:** the typical range drawn on the chart.  
- **`baseline`:** the expected range for the range's total, sent in the insight request. The AI's verdict ("higher / lower / within your typical range") is judged against it.  
- **`decomposition`:** the plugin's key factor cards, sent in the insight request so the AI's "Biggest traffic shifts" text describes them.

Since this is a POC, this review is about behaviour against the spec, the designs and the agreed decisions, not code style. Items are ordered by priority.

## **What works well**

- **The band matches the reference model.**  
  - `Period_Baseline` ports the service's `fitDailyRange()`: each day gets a 28-day fit on the ≤365 days up to `t − 28`, and the daily half-widths are scaled so the days add up to the total's margin.  
  - The band and the request `baseline` share one instance with per-day fit caching, so the chart and the verdict always agree.  
  - All 33 baseline conformance fixtures are byte-identical to the service's. *Update (Nov 26): the service now has 40, with new ones at its v16's shorter history minimums, and all 40 still are.*  
- **The availability rules match.** `Typical_Traffic_Availability` is a faithful port of `TypicalTrafficAvailabilityFor()` (§8 "When each part shows"), and its fixture is byte-identical to the service's. On the server:  
  - key factors are built only for ranges of 7+ days with a covered previous period  
  - `insightRequest` is built only when key factors exist  
  - the analysis shows only with a band on every day  
- **The data window is right.** The daily report window equals `max(d + 392, 364 + 2d)` (§5.2), and the chart ends on the end date.  
- **It follows the agreed product shape:**  
  - no separate tab; the band enhances the Overview tab  
  - the band covers the whole range or not at all  
  - insights follow the selected range against the previous period of the same length  
- **The insights wire contract matches the service** for submitting the request and polling the long-running operation, including error shapes.

## **Highest priority**

### **1\. Ranges over 90 days break the whole panel** ✅ Done

> **Status: done.**
>
> - **No range ceiling.** `benchmarking-data` accepts a range of any length; `MAXIMUM_PERIOD_DAYS` and its 400 are gone. Ranges of 7–364 days get the band, the key factors and the insight once there's enough history. Longer ranges, which the date picker allows (up to about 426 days), get the band and the key factors but no insight, since the service accepts `days_in_period` of 7–364 only (`Insight_Request_Builder::MAX_PERIOD_DAYS`).
> - **A benchmarking failure no longer takes down the panel.** The totals, the chart line and the breakdown stay. The chart line and the total visits come from a GA4 daily visits report, which is requested only after the failure. The benchmarking error, with "Retry", takes the place of the key factors, and the band, the published posts, the insight and the key factors are left out. The whole-panel error remains for a failed GA4 report only.
> - **Fit caching across requests: not done.** Measured at about 0.7 ms per fit on PHP 8.5: 0.25 s at 364 days and 0.29 s at 426, small next to the GA4 reports. A cache key would also need more than the date, since a day's fit depends on where the site's history starts and on the connected property. Revisit with item 15.

`Report_Options::MAXIMUM_PERIOD_DAYS = 90` ([Report\_Options.php\#L35](https://github.com/google/site-kit-wp/blob/d325a67e6decf70c1dd048240ad1718f56ce7391/includes/Modules/Analytics_4/Benchmarking/Report_Options.php#L35)), so `benchmarking-data` returns a 400 for longer custom ranges, which the date picker allows. `useTrafficOverviewReports` puts that error into `errors` ([\#L133](https://github.com/google/site-kit-wp/blob/d325a67e6decf70c1dd048240ad1718f56ce7391/assets/js/modules/analytics-4/components/traffic-overview/hooks/useTrafficOverviewReports.ts#L133)), and the panel then replaces the totals, chart and breakdown with `ReportError`.

- The spec has **no range ceiling** (§5.4): 7–364 days get a band and an insight once there's enough history. It also says to **never fail the view** for history or range reasons (§9).  
- At 364 days that's up to 364 fits per request. They're cached only within one request, so consider caching them by day across requests (§9 suggests this).  
- Separately, a benchmarking failure of any kind shouldn't take down the totals and the breakdown, which don't depend on it.

### **2\. Placeholder data shows when `typicalTraffic` is off**

The Traffic overview widget is registered without a flag, so it's live for everyone. With `typicalTraffic` off, the panel plots `getPlaceholderDailyTraffic()` and shows `PLACEHOLDER_TOTAL_VISITS` ("1.2K, \+12.1%") ([TrafficOverviewPanel.tsx\#L130-L137](https://github.com/google/site-kit-wp/blob/d325a67e6decf70c1dd048240ad1718f56ce7391/assets/js/modules/analytics-4/components/traffic-overview/tabs/TrafficOverviewPanel.tsx#L130-L137)). The panel needs its own real chart and totals data when the feature is off.

> **Note:** item 1 added the source this needs. When the benchmarking request fails, the panel reads its chart line and total visits from a GA4 daily visits report (`getTrafficOverviewVisits()`). Using it when the feature is off too would fix this.

### **3\. `decomposition` isn't sent, so the AI driver text can contradict the cards** ✅ Done

> **Status: done.**
>
> - **The cards go out as `decomposition`.** `Decomposition_Builder` writes the cards the panel shows, in the panel's order, in the §5.10 wire format. It adds the period's shape, each card's role (`OFFSET` when it moves against the period), its share and share basis (§5.10 step 8d), and each row's share of its card's change. It reproduces the §5.10 wire-format example exactly. With channel rows but no card, it sends an empty `key_factors`, so the text names no driver the panel doesn't show. The panel shows only visit changes, so none of these shares can disagree with a card.
> - **What the wire format can't carry is left out.** Keyword cards (clicks, item 7), a homepage `[Content]` card (item 5), and the traffic-channel rows of a page or campaign card (only a `CHANNEL_GROUP` card has channel rows). The service doesn't narrate these, so a shown keyword card can still go unmentioned until items 5 and 7 are done. On a steady period the shape is `STEADY` but the cards are still the plugin's moving cards, not §5.10's volume-share cards (item 4).
> - *Update (items 5–9): `Key_Factors` now builds the cards and the `decomposition` in one pass, by §5.10, so every card the panel shows is in the `decomposition` and nothing is left out. `Decomposition_Builder` is gone.*
> - **Contextual fields added.**
>   - `channel_breakdowns`: every row.
>   - `channel_pages`: each channel's 30 largest movers in each direction.
>   - `channel_campaigns`: each channel's 5 largest movers, placeholders left out.
>   - `search_clicks`: from a new no-dimension Search Console report per period. Left out when either report fails or both periods have 0 clicks.
>   - `top_pages` / `previous_top_pages`: 20 per period, with the post's category names when it was published by the period's last day.
> - **Limits.**
>   - The top pages are summed from the channel × landing page report rather than a report of their own, so there's no extra GA4 request. That report is capped at 500 rows, so a top page's smallest channels can be cut off.
>   - Pages are `landingPage`, not `landingPagePlusQueryString`.
>   - §5.9's screen for opaque or personal campaign names isn't ported; the service screens these itself.
>   - `Insight_Payload::MAX_LENGTH` went from 256 KiB to 1 MiB for the longer lists.
> - *Update (service port, Nov 26): the request also sends `in_period_spike` when one to three days in a row rose above their band and carried most of the period's gain, so the analysis can say the period had a brief spike. The service's other new fields, `range_transition`, `direct_surge_pattern` and `omit_lead_channel_delta`, are worked out on the endpoint from what the plugin already sends, including the `(not set)` rows of `channel_pages`.*

`Insight_Request_Builder` sends contextual rows but no `decomposition` ([\#L102-L144](https://github.com/google/site-kit-wp/blob/d325a67e6decf70c1dd048240ad1718f56ce7391/includes/Modules/Analytics_4/Benchmarking/Insight_Request_Builder.php#L102-L144)). Nor does it send `search_clicks`, `top_pages`, `channel_pages`, `channel_breakdowns` or `channel_campaigns` (§5.2, §5.7).

Without `decomposition`, the service ranks the raw rows itself to write "Biggest traffic shifts". The text can then name a channel or page that none of the cards below it show, or describe a change when no card is shown. §5.10 and §8 require the plugin to send its cards as `decomposition` so the text and the cards always match.

### **4\. The steady-traffic rule hides most cards on small sites** ✅ Done

> **Status: done.**
>
> - **The service's rule decides when traffic is steady.** The 5-visits-a-day rule is gone (`isSteadyTraffic()`, `KEY_FACTORS_DAILY_CHANGE_THRESHOLD`). `benchmarking-data` returns `steadyTraffic`: the visits changed by no more than ±5%, and no channel moved by 1% of the site's visits or more beyond the site's own rate (§5.10 steps 1 and 4, `Decomposition_Builder::is_steady()`). The request's `decomposition` takes its `STEADY` shape from the same rule and figures, so the notice and the text describe the same period.
> - **A steady period shows the service's steady cards.**
>   - The cards are the 3 channels with the most visits (§5.10 step 5, `Key_Factors::build_steady()`). Each shows its own change and "X% of all visits".
>   - A card's rows are only its landing pages, devices and visitor types that moved with it.
>   - The cards go out in `decomposition` as `VOLUME_SHARE` cards with `share_basis` `VOLUME`.
>   - The "No channel changed notably…" notice now sits above the insight and the cards instead of replacing them.
> - **The insight is no longer thrown away.** On a steady period it's requested and shown, and it describes the channels the cards show.
> - **Outside a steady period, every card shows**, however small its change. The notice shows only when there are no cards and no insight, as before.
> - **Not done.**
>   - The Low traffic state (D12) still needs its threshold from product.
>   - The designs don't show the steady cards' share line ("X% of all visits" under the title). The steady frame shows the notice alone, while D11 B describes share-of-traffic cards. Confirm with Sigal. The `Steady Traffic` story has no VRT scenario yet.
> - **Wire format.** The encoded response gained member 10 (`steadyTraffic`), so the insight members moved to 11 and 12. The layout is unreleased, so `FORMAT_VERSION` stays 1.
> - *Update (items 5–9): the steady rule and cards now live in `Key_Factors::is_steady()` and its steady cards, by the same rules. A steady card's rows are its landing page, device and visitor type (§5.10 step 5).*

The steady state itself is in the designs ([Traffic overview – steady traffic](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2902-55309)): an info notice, "No channel changed notably…", replaces the cards. What decides when it shows is the issue.

`isSteadyTraffic()` hides every card, and the AI driver text, when each card's change averages under `KEY_FACTORS_DAILY_CHANGE_THRESHOLD = 5` visits/day ([constants.ts\#L89](https://github.com/google/site-kit-wp/blob/d325a67e6decf70c1dd048240ad1718f56ce7391/assets/js/modules/analytics-4/components/traffic-overview/constants.ts#L89), [KeyFactors.tsx\#L93](https://github.com/google/site-kit-wp/blob/d325a67e6decf70c1dd048240ad1718f56ce7391/assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactors.tsx#L93)).

- **It's much stricter than the service.** Over 28 days, a card needs a change of **≥140 visits**. The service's card floor is `round(10 × d / 28)`, which is **10** at 28 days (§7.8). The Change drivers doc's "noise floor: 5 to 10 visitors" is movement over the whole period, not per day.  
- **Quota is wasted.** The insight is still requested when traffic is steady, because `insight_request_allowed` doesn't consider steadiness. Its driver text is generated and then discarded.  
- **The service already handles flat traffic.** When no card qualifies, it returns `STEADY` volume-share cards (§5.10 step 5), and the driver text describes the flat period. Hiding cards on the client makes the text and the cards disagree again.  
- **A low-traffic cutoff is a separate state.** If the goal is to hide noise on very low-traffic sites, the designs have a [Low traffic state](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=3003-103856). It removes the band, the insight and the drivers, and shows "There aren't enough visits in the selected date range…". Its threshold is still to be decided with real GA data (D12).

Unless the 5/day rule was agreed with product, please drive the steady notice from the service's outcome instead. If it stays, skip the insight request when traffic is steady.

## **Key factors**

The card logic in `Key_Factors.php` / `Row_Scorer.php` follows parts of the Change drivers "Proposed driver hierarchy" tab. It isn't a port of service §5.10. The service is the most up-to-date spec here, and it's what the AI driver text is written against, so the plugin should follow it. Where the docs disagree, it's noted so it can be confirmed with Mariya.

> **Update: items 5–9 are done, by porting §5.10.** `Key_Factors` now runs the service's card algorithm: the period's direction and shape, the paid group, eligibility and ranking, selection with offsets, elevation of a channel's part, the rows with their floors and the consistency walk (K1/K2), and the shares. It builds the panel's cards and the request's `decomposition` in one pass from the same figures. `Row_Scorer`, `Decomposition_Builder` and the reports filtered on each driver are gone. Two new classes port the rules the cards read: `Page_Classifier` (§5.8) and `Source_Classifier` (§5.9 sources and campaigns).
>
> - **Where the plugin differs from the Go client, by its reports:** a channel's sources come from the channel × source report, so a source's figure is its own in that channel, rather than routed to a channel by its name. Landing pages have no click IDs (`landingPage`, not `landingPagePlusQueryString`). The multilingual sensitive-content screen isn't ported; the service screens the cards it receives.
> - **Where the plugin departs from §5.10 on purpose: device and visitor type rows.** §5.9 keeps a device or visitor type that carried up to 110% of its channel's change, but §5.10 step 8c then drops any larger than its card. On a real site, this left both cards with no rows at all: Direct rose by 1,280 visits with desktop +1,643 and mobile −362, and Organic Search fell by 174 with desktop −176. A device or visitor type now follows the rules of a channel's parts (step 8b, `Key_Factors::get_breakdown_split()`):
>   - **A net channel lists both sides.** When the largest value moved further than its channel and one moving the other way clears the row floors, or it moved more than 110% of the channel, both are `CONTEXT` rows with their own changes and no share. Direct above lists desktop +1,643 and mobile −362.
>   - **Within the 10% slack, a row carries all of the change.** With nothing that counts moving the other way, it reads 100%, as `DECOMPOSITION`. Organic Search above lists desktop −176.
>   - **A visitor type also gets the device's 10-point margin.** One whose share of the change is within 10 points of its share of the channel's visits is left out, so a site whose visitors are 98% new doesn't show "New, all of the change".
>
>   The service never rejects a `decomposition` and never cites these rows in the driver, so the insight text is unaffected. Mariya should confirm, so the service's spec can follow (question 3).
> - **Checked against** the §5.10 wire-format example, which the port reproduces exactly, and hand-worked cases for each rule. It isn't checked against the 242 checkpoint fixtures (§5.10 *Parity*), which aren't in this repo. Exporting them from Go as JSON fixtures would make that check possible.
> - **Screenshot references need updating.** The `KeyFactors` `Long Labels` story now shows cards the algorithm can produce (no keyword card), and a keyword row now reads "+N clicks", which changes the `TrafficOverviewWidget` typical traffic stories too.
>
> **Update (Nov 26): the plugin follows the service again, up to its v16.** Between Nov 20 and 25, the service changed its card rules and the baseline (up to `7fa118fa`, spec at `f06ab9e9`), and the plugin now ports those changes. Items 3, 5–9, 13 and 16 below say what changed for each. Three points above no longer hold:
>
> - **The device and visitor type departure is gone.** The service now lists a device or visitor type that moved further than its card as the card's only row, when the card has no other. That covers the empty cards above, so the plugin follows the service's rule (round 2, item 2), and `get_breakdown_split()` is gone. Direct +1,280 can list desktop +1,643 that way, with "While other devices fell", but never mobile −362. Only a device keeps the 10-point margin, as in the service.
> - **The sensitive-content screen is ported** (round 2, item 4).
> - **The port is checked against the Go client** with a scratch harness: 90 of 90 targeted cases and 6,999 of 7,000 random ones gave the same cards (round 2, item 3). A test on the 242 checkpoints still needs their export from Go.
>
> The other differences by the plugin's reports stand, and one more belongs with them: a landing page's addresses that differ only in case or in a trailing slash are one page, where the Go client tells them apart. **Screenshot references need updating** for the `KeyFactors` stories (round 2, item 1).
>
> **Update (Nov 26, later): the plugin follows the service's v17 too** (`9d3e7d69`, which the linked spec now matches). v17 changed two card rules: a part no longer takes the period's only card when its card would have no rows (items 5 and 6), and a keyword that is the site's own name or domain is named like any other (item 7). The panel and the PDF also leave out a lone card with nothing under its title, as the spec now asks of clients (round 2, item 6). v17's changes to the prompt and its output checks are the service's own. The harness agrees with v17's Go client on 97 of 97 targeted cases, 7 of them new cases of the only card, and on 6,999 of 7,000 random ones, with the same tie as before. v17 changed Go's cards in 10 of the 90 earlier targeted cases and in 113 of the random ones, so the run tested the new rules.

### **5\. Page and homepage cards** ✅ Done

> **Status: done, by the service's rule. Whether page cards stay is still open.**
>
> - **A page takes its channel's card only by the service's rule.** A channel's page is the post published in the period at the channel's top landing page (§5.10 step 8a.1). The channel rose, its top page moved by 10–110% of its change, and the page is among the 10 most visited posts published in the period. The post takes the card when it carried at least half of the channel's rise, with its visits in the period as its change and its share of the channel's change (`PARENT_CHANNEL`). Otherwise the page is a "Target page" row of the channel's card. A site whose property has no post date dimension has no page cards.
> - **The homepage is never a card or a Target page.** `Page_Classifier` ports the §5.8 rules. The root, `/home`, `/index.php` and the like, the folder the site lives under, and feed, admin, login, test, sample and paginated pages are never named. Direct lists its homepage as a "Homepage" row without an address when it carried at least 40% of Direct's change, and 10 points more than its share of Direct's visits. The plugin reads the single-segment paths the service puts to its model as content, as the spec says.
> - **Still open:** whether page cards stay at all, for Mariya and Sigal (question 2). The designs show channel cards only.
> - *Update (service port, Nov 26):*
>   - A channel's top page no longer has the 110% limit, only the 10% floor. A page that moved further than its channel is a "Target page" row larger than the card, which says "While other pages fell".
>   - Direct lists its homepage from 10% of its change, with no rule about its share of Direct's visits. Its landing page comes first when it moved further than the homepage.
>   - A page row shows the page's title when the page is a published post or page of the site, and still links to it by its path.
>   - Under a referring site or campaign that took its channel's card, the channel's landing page can be a row (item 6).
>   - A page that brought visits through several channels can take the first card. It needs `round(20 × d / 28)` visits and 40% of the movement in the period's direction, through at least two channels that each brought 10% of its change. Its rows are those channels, and their own cards are for their other pages: "Direct (other pages)", for example. This is a second kind of page card for question 2.
> - *Update (service v17, Nov 26): a post takes its channel's card only beside another card.* A post's card has no rows, and the period's only card is no longer a part's card without rows (item 6). The channel then keeps the card and lists the post as a "Target page" row.

The designs show **channel cards only**. Pages, referring sites, platforms and keywords appear as rows inside a card, under "Top changes within *channel*" ([Traffic overview](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2905-60416)).

- **Page cards.** The POC makes a page its own `[Content]` card with ≥10 visits and ≥15% of the *site's* movement ([Key\_Factors.php\#L55-L63](https://github.com/google/site-kit-wp/blob/d325a67e6decf70c1dd048240ad1718f56ce7391/includes/Modules/Analytics_4/Benchmarking/Key_Factors.php#L55-L63)). The service allows page cards, but only when the page carried **≥50% of its channel's change with no other page in that channel ≥25%**.  
- **Homepage cards.** The POC can show the homepage as a card labelled "Homepage". The service never makes the root page a card, and it drops root `[Content]` cards it receives in `decomposition`. So a homepage card would never be mentioned in the driver text. In the service, "Homepage" only appears as a row inside a channel card, mainly Direct.

Please confirm with Mariya and Sigal whether page cards stay at all. If they do, use the service's elevation rule.

### **6\. Ranking and gates** ✅ Done

> **Status: done.**
>
> - **A part is measured against its channel.** A landing page, referring site or campaign takes its channel's card only when it carried at least 50% of the channel's change, and no sibling from the same breakdown carried 25% (§5.10 step 8b). Otherwise up to two parts of one breakdown that each carried 25% are rows of the channel's card, with their share of its change. A channel that is the net of parts moving both ways keeps its card and lists both sides with their own changes.
> - **Offsets are surfaced.** `Row_Scorer` and its same-direction boost are gone. Nodes are ranked by the size of their change, then by their excess change (§5.10 step 6). A rise or a drop shows at most one card moving against it, as `OFFSET` with its share of the net change. A flat period whose channels moved against each other shows both sides (step 7).
> - **Floors scale with the range.** A card needs `round(10 × d / 28)` visits (at least 1), 0.5% of the larger total and 5% of the gross movement. A row needs the same count and 10% of its card's change.
> - **The paid channels are grouped** as "Paid traffic" when two or more moved materially, with a row for each (§5.10 step 2). The panel names the group in the site's language.
> - *Update (service port, Nov 26):*
>   - A part needs 10% of its channel's change to be a row, rather than 25%. Two parts that together carried more than the channel's change are both rows only when each carried from 30% to all of it, and neither then shows a share, so a card's shares never add up past 100%.
>   - A part that carried up to 10% more than its channel still takes the card, and now names the channel: "More than Referral’s net change of +300 visits". When its share would then be of the site's traffic, the channel keeps its card, with the part as a row larger than it.
>   - Under a referring site or campaign that took its channel's card, the channel's landing page is a row when at least half of the page's change must have come through that part. It shows its own change, without a share.
>   - On a flat period whose channels moved against each other, the cards have no share, since a flat site has no change for a share to be of. A card that took its channel's place keeps its share of the channel, and a steady period's cards keep their share of all visits. On a rise or a drop, the movement a share is of counts the paid group by its net change, as the service now does.
> - *Update (service v17, Nov 26): a part no longer takes the period's only card when its card would have no rows.* The channel keeps the card, with its rows, among them the part. A referring site or campaign still takes the only card when the channel's landing page is a row under it (above). Beside another card, a part takes its channel's card as before, and so it does after a page took the first card. A post's card never has rows, so a post now takes its channel's card only beside another card (item 5).

- **No renormalizing.** A child (a page or site inside a channel) is measured against the site's overall change, not its own channel's. A page in a channel that dropped 30% therefore looks unusual even if it dropped with its channel. The Change drivers doc calls this "renormalize when drilling".  
- **No concentration rule.** The Change drivers doc only names a child when it accounts for a meaningful share of its parent's change. Otherwise the channel is described as a whole.  
- **Offsets are demoted.** An offset is a card that moves against the site's overall direction, e.g. Social up while total traffic is down. `SAME_DIRECTION_BOOST = 1.25` ranks cards that move *with* the site higher ([Row\_Scorer.php\#L48](https://github.com/google/site-kit-wp/blob/d325a67e6decf70c1dd048240ad1718f56ce7391/includes/Modules/Analytics_4/Benchmarking/Row_Scorer.php#L48)). Both docs want offsets surfaced, and the service has an `OFFSET` card role for them.  
- **Floors don't scale with the range.** The minimum change is fixed. The service scales it as `round(n × d / 28)` (§7.8), so a 7-day range doesn't need the same absolute change as a 90-day one.

### **7\. Search keyword cards** ✅ Done

> **Status: done, by the service. The conflict with the Change drivers hierarchy is still for Mariya.**
>
> - **Keywords are never cards.** Organic Search's card lists the keyword behind its change as a "Search keyword" row (§5.10 step 8c.1). It shows only when the site's search clicks moved with the channel. The keyword must also carry 25–110% of that change, and clear the row floors in clicks against the channel's visits. A smaller keyword is never named in its place.
> - **Clicks are shown as clicks.** The panel shows the row's change as "+N clicks". The request sends it as context, with its change as a share of all of the site's search clicks.
> - **Search Console asks for 4 reports instead of 8.** Each keyword's pages and devices fed only the keyword cards, so the plugin no longer asks for them.
> - *Update (service port, Nov 26): the keyword row follows the service's new rule.*
>   - It names the keyword whose clicks moved most the way the channel moved, whatever the site's search clicks did. It needs `round(10 × d / 28)` clicks, and a change of at least 0.5% of the site's search clicks in the larger of the two periods. Without the site's search clicks, it needs 10% of the channel's change in visits instead.
>   - A keyword that moved against the site's search clicks, further than them, or while they didn't move says what the other queries did: "A change equal to 3.6% of the site’s search clicks, while other queries fell". Without the site's search clicks, the row shows its change alone.
>   - ~~A keyword that is the site's own name or domain is never named, since it says how much the site was searched for, not what it was found for.~~ *Update (service v17, Nov 26): such a keyword is now named like any other, as the service names it. The service dropped the filter from the row and from its `SEARCH_QUERY` subject, so the plugin no longer needs the site's URL to build the cards.*
>   - A smaller keyword is still never named in place of the largest.

The POC makes keywords their own cards. Their Search Console **clicks** are ranked and gated against GA4 session totals, and the card labels them "visits" ([KeyFactorChangeBadge.tsx\#L53](https://github.com/google/site-kit-wp/blob/d325a67e6decf70c1dd048240ad1718f56ce7391/assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactorChangeBadge.tsx#L53)).

- In the service and in the [designs](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2905-60416), keywords are never cards. They're a "Search keyword" row inside the Organic search card.  
- The Change drivers doc's earlier sections agree that queries belong "in the sentence as a descriptor, never in the arithmetic", because clicks and sessions come from different systems.  
- Its later "Proposed driver hierarchy" tab lists keyword cards, so flag the conflict to Mariya.

### **8\. Suppression edge cases** ✅ Done

> **Status: done.**
>
> - **A part replaces its channel only by taking its card.** The suppression step is gone. A part that carried most of its channel's change takes the channel's own card after the top-3 cut, so a part never removes a channel without being shown. A part with 15% of the change never replaces a channel with 85%. What the channel moved beyond the part falls in the residual.
> - **The same visits are never on two cards.** Every card is rooted in one channel, and a part that carried the change of two channels takes the card of the first only. A card's rows come from one cut of its visits and add up to no more than its change (§5.10 step 8c.4).
> - *Update (service port, Nov 26): a page that brought visits through several channels can take the first card (item 5). Its visits are then taken out of each channel that brought at least 10% of the page's change or of the channel's own, and those channels' cards are for their other pages. A channel below both keeps its few visits to the page, which then count on both cards, as in the service.*

When a child (page, site, campaign) qualifies as a card, the POC removes its parent channel's card to avoid counting the same visits twice.

- This happens before the top-3 cut ([Key\_Factors.php\#L316-L362](https://github.com/google/site-kit-wp/blob/d325a67e6decf70c1dd048240ad1718f56ce7391/includes/Modules/Analytics_4/Benchmarking/Key_Factors.php#L316-L362)). A child ranked 4th can therefore remove its channel without being shown itself, and that movement disappears.  
- A child carrying 15% of the movement replaces a channel carrying 85%.  
- Children of different kinds aren't de-duplicated (a page and its keyword, a site and its campaign), so the same visits can appear on two cards.

### **9\. Smaller gaps** ✅ Done

> **Status: done, except click ID markers.**
>
> - **Sources are named as the service names them.** `Source_Classifier` ports §5.9.
>   - Each platform's sources collapse into one name: Facebook, Instagram, LinkedIn (`lnkd.in`), X (`t.co`, `twitter`), Reddit, YouTube (`youtu.be`), Pinterest (`pin.it`), the AI assistants and Microsoft Teams.
>   - Search engines, placeholders, and internal, staging, hosting, CDN, mail scanner and audit tool hosts are left out.
>   - A source shaped like a campaign name is a campaign, named for readers.
>   - Campaign IDs and personal labels are left out of the cards and of the request's `channel_campaigns`.
> - **AI assistant.** An `AI Assistant` channel's sources are "AI assistant" rows, which never take the card (§5.10 step 8a.3). GA4 reports such a channel only on properties that have one. Elsewhere, an assistant's visits stay under Referral as a referring site.
> - **Direct traffic.** Direct lists its homepage as a row (item 5).
> - **Not done: fbclid and other click ID markers.** They need `landingPagePlusQueryString`, which the plugin doesn't report.
> - *Update (service port, Nov 26): channels and sources are named as the service now names them. Analytics' `Cross-network` and `Unassigned` channels are "Cross-network ads" and "Uncategorized traffic" on the cards and in their `decomposition`. `search.naver.com`, `m.search.naver.com` and `search.seznam.cz` are search engines, so they're left out like the others. A newsletter campaign reads "October 2025 newsletter", without "the", so the insight's text can give it the article its language needs.*

- **Social sources.** Only Facebook variants collapse into one source. The service also collapses Instagram, t.co, lnkd.in etc., so the cards and the text can name the same platform differently.  
- **AI assistant.** The AI channel has no "assistant" attribute; the Change drivers doc lists one.  
- **Direct traffic.** Direct-traffic context, like a homepage landing suggesting brand recall, or fbclid markers suggesting shared links, isn't handled. fbclid would need `landingPagePlusQueryString`. This one is in the Change drivers doc but not the service, so it's lower priority.

## **UX states and copy**

### **10\. Short ranges** ✅ Done

> **Status: done.**
>
> - **The key factors section stays for a short range.** When the response's `availability.rangeTooShort` is set (a range under 7 days), the section keeps its heading and shows "Select a date range of at least 7 days to see which channels changed the most" in place of the cards. It doesn't show "No channel changed notably…", which would describe a comparison that wasn't made.
> - **The rule stays on the server.** The panel reads `rangeTooShort` rather than counting the range's days; while the response loads, the section shows its placeholder cards, and the notice appears once the panel's figures do.
> - **The insights are unchanged.** A short range still asks for no insight, so neither the analysis nor the driver shows; the notice speaks for the section only.
> - **Copy and design still need sign-off.** There's no Iteration 3 frame for this notice, so it uses the same info notice as "No channel changed notably…". The copy is a placeholder until Sigal confirms it. The `Range Too Short` story shows it; it has no visual check, since it only changes the text of `No Notable Change`.

For ranges under 7 days, the key factors section just disappears. The spec (§8) shows a short-range notice instead (`RangeTooShort`), and the scenarios doc agreed insights and key factors need at least 7 days (D7). I couldn't find a frame for this notice in Iteration 3\. The notices in the [Low traffic state](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=3003-103856) are the closest pattern; worth checking the copy with Sigal. *Update: the response now says when a range is too short, as `availability.rangeTooShort` (item 12).*

### **11\. Partial states** ✅ Done

> **Status: done. The copy and placement still need checking against the Figma frames.**
>
> - **A part that waits for history now says when it will show** (D13 A). The panel reads `availability.bandAvailableFrom` and `availability.keyFactorsAvailableFrom` (item 12): the last day of the first range of this length that has each part.
>   - **The band.** While the range's days have no typical range, the summary shows "We’re still learning what’s usual for your site. Check back on {date} to see your typical traffic range." in the analysis's place, above the visitor figures. The analysis needs the band, so the two never show together. The notice is `TypicalTrafficRangeNotice`.
>   - **The key factors.** While the site's recorded traffic doesn't cover the previous period, their section stays, with its heading. In place of the cards it says "There’s no previous period to compare to yet. Check back on {date} to see which channels changed the most.". Before, the whole section disappeared. No insight is requested, as before.
> - **A range that ends in the past asks for a later range.** If the date has already passed, the selected range (a custom range or a past month) ends before it, and checking back wouldn't change it. The notices then say "Select a date range that ends on or after {date}…". The dates are for a range of the selected length. A shorter range may get its parts sooner, and the notices don't suggest one.
> - **Without a date, the notices say less.** No date means the site has no recorded traffic up to the end of the range. The notices then say only that there isn't enough traffic history for a typical traffic range, or that there's no previous period to compare to.
> - **Gathering data state 1 is the existing gathering state.** While the property has no data at all, the panel keeps the Overview tab's own gathering state ("Gathering data…" and "We’re still collecting data"). There's no first day to count a date from.
> - **Placement and copy need Sigal's sign-off.** They follow the spec (§8: "the date from `BandAvailableFrom`… `KeyFactorsAvailableFrom`") and the panel's existing notices: both notices use the gray info notice of "No channel changed notably…", and "no previous period to compare to" is the Low traffic state's wording. They weren't checked against the Gathering data frames.
> - **Screenshot references need adding.** The new `Typical Traffic, Short History` story of `TrafficOverviewWidget` shows both notices, and its visual check has no reference images yet. Add them with `npm run test:visualapprove` or the "VRT: Update reference images" label. The `No Previous Period` story of `KeyFactors` has no visual check, since it only changes the notice text of `No Notable Change`.

When a part is still waiting for history, nothing tells the user.

- `Typical_Traffic_Availability` computes `band_available_from` and `key_factors_available_from` ([\#L90](https://github.com/google/site-kit-wp/blob/d325a67e6decf70c1dd048240ad1718f56ce7391/includes/Modules/Analytics_4/Benchmarking/Typical_Traffic_Availability.php#L90)), but they aren't returned to the client. *Update: they now are, as `availability.bandAvailableFrom` and `availability.keyFactorsAvailableFrom` (item 12).*  
- The designs cover these states:  
  - [Gathering data state 1](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2690-98630) (no data yet)  
  - [Gathering data state 2](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2690-97859) (no band yet)  
  - the "no previous period to compare to" notice in the [Low traffic state](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=3003-103856)  
- The scenarios doc also agreed to say *when* the waiting part will be ready (D13 A), which these dates make possible.

### **12\. Duplicate availability logic** ✅ Done

> **Status: done.**
>
> - **The panel reads the server's availability.** `benchmarking-data` returns `availability`, the whole object `Typical_Traffic_Availability::get()` builds: `rangeTooShort`, `bandAvailable`, `bandAvailableFrom`, `keyFactorsAvailable`, `keyFactorsAvailableFrom`, `insightRequestAllowed`, `performanceInsightAvailable` and `lastYearAvailable`. `getTypicalTrafficAvailability()` now only reads it, and keeps every part's placeholder while the response loads. Nothing on the client works out availability from dates or bands any more.
> - **`firstTrafficDate` is gone from the response.** Only the duplicate rules read it.
> - **Items 10, 11 and 13 are unblocked, not done.** `rangeTooShort`, the `*From` dates and `lastYearAvailable` reach the client, but nothing shows them yet. *Update: item 10 now shows `rangeTooShort`, item 11 the `*From` dates, and item 13 `lastYearAvailable`.*
> - **Wire format.** The availability replaces member 8, the first traffic day, as a list of its 8 fields, with each date as an offset from the first plotted day. A response cached in the old layout can't be decoded: it shows the reload message once and is fetched again. The layout is unreleased, so `FORMAT_VERSION` stays 1.

`getTypicalTrafficAvailability.ts` recomputes availability from `firstTrafficDate` and `dailyTraffic` instead of reading the server's result. It matches today, but returning the server's availability object would remove the duplicate and also cover item 11\.

### **13\. Band tooltip** ✅ Done

> **Status: done, except the "Learn more" links.**
>
> - **The tooltip says how much traffic the band is based on.** It now reads "Site Kit estimates a typical range from your traffic history, so you can see when visits are higher or lower than expected. Based on N weeks of your traffic." in place of "the last 12 months". N is the fit's `reference_days` in whole weeks, rounded down so it never claims more history than the band read: 11 weeks at the minimum for a 28-day range, 52 at most.
> - **`reference_days` reaches the client.** `benchmarking-data` returns `bandReferenceDays`, the days the fit of the range's last day reads (the longest of any day), or null without a band. It travels as a new wire member 11, so the insight's locale and payload move to members 12 and 13. As with item 12, a response cached in the old layout can't be decoded: it shows the reload message once and is fetched again. The layout is unreleased, so `FORMAT_VERSION` stays 1.
> - **Last year is mentioned only when it's covered.** With `availability.lastYearAvailable`, the sentence becomes "Based on N weeks of your traffic, including the same time last year." It makes no claim about seasonal patterns, since the model doesn't fit one (the same rule the spec sets for the analysis's last-year clause).
> - **Without `bandReferenceDays`, the band has no tooltip** rather than a wrong one. The server always sends it with a band.
> - **Still open:**
>   - **The "Learn more" links** in this tooltip and in the key factors heading still go to `#`. They need a support page, or a documentation slug for `getDocumentationLinkURL()`.
>   - **Copy and Figma need Sigal's sign-off.** The wording is a placeholder that keeps the spec's "Based on N weeks of your traffic", and the tooltip in Figma still says "last 18 months… accounting for seasonal patterns".
> - *Update (service port, Nov 26): a band now needs `d + 55` days of history (83 at 28) rather than `d + 83`, since each day's fit needs one 28-day block of reference rather than two. So the tooltip says 7 weeks at the minimum for a 28-day range. While the first day's fit has under two blocks, the service calls the band early (`EarlyBand`). `Period_Baseline` works that out too, but nothing shows it yet.*

The POC says "Site Kit analyzes the last 12 months of your traffic history…" ([TrafficChart.tsx\#L163](https://github.com/google/site-kit-wp/blob/d325a67e6decf70c1dd048240ad1718f56ce7391/assets/js/modules/analytics-4/components/traffic-overview/charts/TrafficChart.tsx#L163)). The [design's tooltip](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2904-58734) says "last 18 months… accounting for seasonal patterns". Neither matches the model.

- The spec (§8) and the scenarios doc want "Based on N weeks of your traffic", with N from the fit's `reference_days`. That value is already computed but not returned.  
- Seasonality should be mentioned only when last year is covered (`last_year_available`). *Update: it now reaches the client as `availability.lastYearAvailable` (item 12).*  
- The tooltip copy in Figma needs updating too, and the "Learn more" links currently go to `#`.

### **14\. Section heading** ✅ Done

> **Status: done.**
>
> - **The heading follows the design.** It now reads "Biggest traffic shifts vs. the previous N days" in place of "Biggest channel shifts…", with N still the number of days in the selected range ("day" for a 1-day range). "Traffic" also fits what the cards show: a card can name a landing page, keyword, referring site or campaign as well as a channel.
> - **The notices keep "channel".** "No channel changed notably…" already matches the design, and the short-range notice from item 10 follows it.
> - **Screenshot references need updating.** The heading shows in the `KeyFactors` stories (`Default`, `No Notable Change`, `Long Labels`, `Loading`) and in the `TrafficOverviewWidget` typical traffic stories, so their reference images are out of date until `npm run test:visualapprove` or the "VRT: Update reference images" label regenerates them.

The POC says "Biggest **channel** shifts vs. the previous N days"; the [design](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2905-60416) says "Biggest **traffic** shifts vs. the previous 28 days". The steady notice, "No channel changed notably…", matches the design.

## **Performance and robustness**

### **15\. Request volume** ✅ Done

> **Status: done in the browser. Caching once per site would mean storing report data on the server, which the design rules out.**
>
> - **Every tab now shares the response.** The API cache kept `benchmarking-data` in `sessionStorage`. That meant each new tab, or the same tab after a browser restart, rebuilt the response from the reports.
>   - It's now a *shared* item of the API cache, kept in `localStorage` under the same key prefix: the Site Kit version and a hash of the user's login and session.
>   - Every tab of a login session reads the same copy. Another user or a new login never does.
>   - `API.get()` has a new `shared` option for this.
> - **Settled ranges are kept for a day.** These are ranges that end before the last three days (today included), whose figures GA4 and Search Console no longer update. A range that reaches into those days is kept for an hour, like any other report.
> - **The insight is shared too** (item 16). A new tab with the same figures neither submits nor polls; a tab that opens while a generation runs reads its operation.
> - **Clearing still works.**
>   - `clearCache()`, `invalidateCache()` and `deleteItem()` now clear shared items too. A reset, a disconnect or a change to the Analytics settings never leaves an old response behind.
>   - `localStorage` never empties itself, so writing a shared item also deletes any expired ones.
>   - `invalidateCache()` now waits for its deletions to finish, which it didn't before.
> - **Not done: a cache across users or devices.** The [typical traffic design](./typical-traffic-design-doc.md) says "This feature caches nothing on the server… the datapoint cannot use a transient as a cache".
>   - Each user still builds the response once an hour (or once a day) per range, and each view-only viewer builds their own.
>   - A server cache would make that once per site, but only if that decision is reversed.
> - **The four client reports are unchanged.** They're the widget's own totals and its channel, location and device breakdowns, cached per tab like every other Site Kit report.

Every main-dashboard load runs:

- 4 client GA4 reports  
- `benchmarking-data`: 5–6 GA4 reports, then up to 6 driver reports, a Search Console batch, and up to `d` model fits  
- the insight submit, then polling every 2 s

Nothing is cached across requests. The Change drivers doc warns that firing on every admin page load is what burns quota.

*Update (items 5–9): the driver reports are gone, so `benchmarking-data` makes one or two GA4 batch calls. Its Search Console batch asks for 4 reports instead of 8.*

### **16\. Insight cache** ✅ Done

> **Status: done. How often a recent range gets a new generation needs a product decision (question 5).**
>
> - **The insight is now keyed by its request.**
>   - The browser keeps the insight under the signed request it's written from (`insightPayload`), not under the date range and locale.
>   - The request holds the figures, the locale and the user. New figures, another language or another user therefore ask for a new insight.
>   - The analysis always describes the band and totals on screen. The entry is shared across tabs (item 15).
> - **The cost is more generations.**
>   - A range that reaches the last three days can get new figures, and so a new generation, at most once an hour while someone opens the dashboard. A settled range gets one a day. Before, it was one a day per end date and locale.
>   - The service's 24-hour cache still answers any request it has already seen, from any tab or viewer, without generating again.
> - **Failures are kept per request:**
>   - **400 (refused):** kept for a day, like an insight, because the same request would be refused again.
>   - **500 (failed generation):** kept for an hour. The datapoints also report any other failure of the service, or of the site's connection to it, as 500. A retry can succeed, but each one can cost a generation, and once an hour stays under the rate limit's refill.
>   - **429 and 403:** kept as before.
>   - **Not kept:** 503 (busy), 409 (already generating), 404 (lost operation) and network errors. None of them costs a generation.
>   - Conversion insights keep their old rules: per tab, with only 429 and 403 kept.
> - **`Retry-After` was already done** in d81eb3ffbf. Each wait follows the service's `Retry-After` (2 s while generating, 5 s on a 409 or 503), and the fixed 2 s and 5 s apply only when an answer has none.
> - *Update (Nov 26): a quota refusal now holds back every insight request for its `Retry-After` (round 2, item 5): a minute for `RATE_LIMITED`, which since the service's fix no longer spends one of the site's daily generations, and until the next UTC day for `DAILY_CAP`.*

- The browser keeps the insight for 24 h, keyed by date range \+ locale rather than by the payload. When `benchmarking-data` refreshes within that time, the cached analysis can contradict the new band and totals.  
- 400 and 500 errors aren't cached, so every page load submits again.  
- Polling uses fixed 2 s / 5 s waits and ignores the service's `Retry-After` header.

### **17\. Metric change** ✅ Done

> **Status: done in the PDF. The "Visits" label still needs PM sign-off (service §9), and the PDF's new sections have no design.**
>
> - **The PDF now counts visits, like the widget.**
>   - The headline is "Total visits" (sessions), with its change and "Vs. prev. N days", in place of "All visitors" (`totalUsers`).
>   - Unique visitors print below it as "N unique visitors". The line was already sessions.
> - **It prints the dashboard's figures.**
>   - On the main dashboard with `typicalTraffic` on, the totals and the line come from the benchmarking response, as in the panel.
>   - Otherwise, or when that request fails, they come from the daily visits report, which now asks for the comparison range so it can show the change.
> - **The band, key factors and insight now print:**
>   - **Band:** drawn behind the line when every day has a typical range. Without one, the band's waiting notice from item 11 prints where the analysis would go.
>   - **Key factors:** a section after the chart with:
>     - the heading;
>     - the panel's notice (range too short, no previous period, or no notable change);
>     - the driver;
>     - up to three cards, each with its name and change, or its share of visits on a steady period. Sub-rows are left out.
>   - **Insight:** the analysis and driver print only when the dashboard already has the insight. The export never requests one or waits for one. An AI disclosure line follows them.
> - **The panel and the PDF now share helpers:** `getKeyFactorsNoticeText`, `getKeyFactorName` and `formatVisitsShare`. The panel's output is unchanged.
> - **Still open:**
>   - **No PDF design exists for the new sections.** They follow the existing PDF cards and the panel's gray notices.
>   - **New copy needs Sigal's check:** "N unique visitors" and "Some insights in this report are created using AI and may contain mistakes.".
>   - **The "Visits" label** still needs PM sign-off.
>   - **Entity dashboards:** the PDF shows a change in visits that the entity panel doesn't. Before, it showed a change in visitors.

The existing widget moves from users to sessions ("Visits by…", "Total visits"). Service §9 notes that the "Visits" label still needs PM sign-off. The PDF export still mixes "All visitors" (totalUsers) with a sessions line, and has no band, key factors or insights.

## **Minor**

- **18\. Partial last day.** ⏸️ Deferred to the date picker epic. A range ending today includes today's partial visits in the chart line and in the total the verdict judges. The fixed lag only changes which days train the band, not what it's compared with. The date picker epic is expected to drop today from the presets again, which takes care of most of this. A custom range ending today would still show a low last point and a slightly low verdict.  
  > **Status: deferred, no code change.** The presets and custom ranges on this branch still end today, so every default view is affected until the date picker epic lands. Two fixes were considered:
  >
  > - Ending the whole tab on the last complete day when the range ends today. This follows service §5.4 ("`T` is the last complete day"), but the tab would then end a day before the other widgets, and it needs new copy.
  > - Marking today's point as partial on the chart. This fixes only the chart: the verdict and the key factors would still count today's visits.
  >
  > Revisit if the date picker epic keeps ranges that end today.
- **19\. Pluralization.** ✅ Done. "Vs. prev. %d days" uses `__` instead of `_n` ([TotalVisitors.tsx\#L140](https://github.com/google/site-kit-wp/blob/d325a67e6decf70c1dd048240ad1718f56ce7391/assets/js/modules/analytics-4/components/traffic-overview/components/TotalVisitors.tsx#L140)).  
  > **Status: done.** The panel's label now uses `_n` ("Vs. prev. 1 day" / "Vs. prev. %d days"), like the PDF since item 17. A one-day custom range, which the date picker allows, now reads correctly. The other modules' PDFs (Search Funnel, AdSense, Site Goals) still use `__` for the same string. They're outside this epic.
- **20\. Recent-content window off by one.** ✅ Done. It uses `<=` in [Insight\_Request\_Builder.php\#L344](https://github.com/google/site-kit-wp/blob/d325a67e6decf70c1dd048240ad1718f56ce7391/includes/Modules/Analytics_4/Benchmarking/Insight_Request_Builder.php#L344) but `<` in `Content_Markers.php#L75`. A post published the day before the range starts is described to the AI as published during the range, but has no marker on the chart.  
  > **Status: done.** The request's `recent_content_momentum` and the post card (`Key_Factors::get_recent_post()`) now use `<`, like the chart's markers. All three now count only posts published from the range's first day, `publishedDaysAgo` `d − 1`, through its last.
  >
  > - Service §5.7 says "published `0 … d` days before `T`", which reads as `d + 1` days. The plugin follows the chart instead, for two reasons:
  >   - A post card's change is its visits with `prev = 0` (§5.10), which is only true for a post published during the range.
  >   - "drew N visits since publication" counts only the range's visits.
  > - The spec's wording should be corrected to `0 … d − 1`.
- **21\. Links.** ✅ Done. On a `[Content]` card the title isn't linked, but its landing-page rows link to entity dashboards. Neither records a click event, unlike other dashboard navigation links.  
  > **Status: done.**
  >
  > - **A post card's title now links to the post's entity dashboard**, in the same tab, as the landing-page rows do.
  >   - The card now carries the post's path. `Key_Factors` adds it as `url`, and the wire format sends it as a sixth position on a `CONTENT` card. Other cards and the attributes keep five positions. *Update: since round 2's item 1 and the service port, a card and an attribute can carry more trailing positions, such as `otherPages` and a page's `title`, each left out when it has no value (`Wire_Format::KEY_FACTOR_ROW_FIELD_COUNT`).*
  >   - The layout is unreleased, so `FORMAT_VERSION` stays 1.
  > - **Both kinds of link now record a click.**
  >   - The event is `<viewContext>_typical-traffic` / `click_page_link`, labelled with the card's kind, like the vote events: `CONTENT` for a post's title, the parent card's kind for a landing-page row.
  >   - The page waits for the event before it opens the dashboard. A Command or Control click records it and leaves the click to the browser, as the Recent activity post links do.
  > - **Not done:** the event is new. It should be added to the design doc's GA4 events table and confirmed with whoever owns the analytics plan. The design doc's wire-format table (member `5`) should also mention the path.

## **Questions needing product alignment**

1. **Steady and low-traffic rules.** The steady notice now follows the service's rule and shows the service's steady cards (item 4); confirm that with product. What should trigger the Low traffic state?  
2. **Page cards.** The designs show channel cards only. Keep `[Content]` cards (with the service's elevation rule and no homepage card), or drop them? *The plugin now follows the service's rule (item 5). Since the service port, a page that brought visits through several channels can also take the first card, and those channels' cards then read "Direct (other pages)", for example.*  
3. **Key factors spec.** This review treats service §5.10 as the source of truth, since it's the most recent and it's what the driver text is written against. Mariya should confirm that it supersedes the Change drivers hierarchy where they disagree: keyword cards, elevation rules and offsets. *The plugin now follows §5.10 (items 5–9), except for a card's device and visitor type rows, which follow the rules of a channel's parts (see the Key factors update). Since the service port, those rows follow §5.10 too.*  
4. **Tooltip copy.** The design ("18 months, seasonal"), the POC ("12 months") and the spec ("Based on N weeks") all differ. Sigal should update the design copy.  
5. **Insight freshness vs. generations.** The analysis now always matches the figures (item 16), so a range whose figures still change gets a new generation each time its response refreshes: at most hourly. The rate limit is 2 an hour per user and 20 a day per site, shared with conversion insights. If that's too many, keep a recent range's response longer (item 15). The trade-off is figures that are up to that much older than the rest of the dashboard.