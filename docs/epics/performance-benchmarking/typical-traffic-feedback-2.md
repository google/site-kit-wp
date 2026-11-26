# **Round 2: Typical traffic \+ insights POC (PR \#14123)**

**Reviewed at:** [4798a10dc8](https://github.com/google/site-kit-wp/commit/4798a10dc85e32c272c1112f00b99a9087cc7737) (Nov 23\) **Spec:** [benchmarking\_feature\_design.md @ 2f22a63d](./benchmarking_feature_design.md) ("§" below). **Designs:** [Figma, Iteration 3](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2905-60416).

Thanks for working through round 1\. Everything in it is addressed, apart from the items below and a few you've already noted as known limits. This tab covers what's still open in the current code.

> **Update (Nov 26): the plugin now follows the service up to its v17.** Between Nov 20 and 25, the service changed the baseline and the key factor cards, and stopped `RATE_LIMITED` refusals from spending the site's daily quota. The plugin ports those changes, up to `7fa118fa`. Items 1–3, 5–10, 18 and 19, and questions 2, 4 and 5, note what changed. The plugin then ported the service's v17 (`9d3e7d69`, Nov 26), and the linked spec is now the service's at that commit. Items 3 and 6 here, and round 1's items 5–7, note what v17 changed: a part no longer takes the period's only card without rows, a keyword that is the site's own name or domain is named like any other, and the panel and the PDF leave out a lone card with nothing under its title.

---

## **What works well**

- **The flag isolates the feature.** With typicalTraffic off, the widget, panel and PDF are identical to develop, so no placeholder data can reach users. The new view lives in separate Typical\* components.  
- **Band and availability.** Both match the service, with byte-identical fixtures. The panel reads the server's availability object, including the short-range and "Check back on *date*" notices.  
- **Key factors.** They're a close port of §5.10:  
  - decomposition is sent  
  - children are renormalized against their channel  
  - elevation at ≥50% of the channel with no sibling ≥25%  
  - OFFSET and STEADY cards  
  - scaled floors  
  - keywords appear only as rows  
  - the paid group  
  - the page and source classifiers  
  - the homepage appears only as Direct's row  
- **Insights plumbing.** The cache is keyed by the signed payload. Retry-After is honoured, failures are cached, and the insight is requested only when key factors are available.  
- **Copy and the PDF.** The "Based on N weeks of your traffic" tooltip and the "Biggest traffic shifts" heading are in, and plurals are handled. Links go to entity dashboards with click tracking. The PDF matches the dashboard.

---

## **Highest priority**

### **1\. Row and card shares aren't rendered, so a row can still look bigger than its card** ✅ Done

> **Status: done.**
>
> - **The panel payload carries the missing fields.** Each card has `shareBasis`, the decomposition's `share_basis`. A card on `PARENT_CHANNEL` also has `parentChannel` and `parentChannelChange`. Each row has `oversized`: it moved further than its card in the same direction and isn't capped, so it has no share. `Key_Factors::build_row()` sets it from the same test that already withheld the share. The fields travel after the existing ones in the encoded card and row (`Wire_Format::KEY_FACTOR_SHARE_BASES`, `KEY_FACTOR_ROW_FIELD_COUNT`). Empty trailing fields are left out, so a response cached before this change still decodes. The `decomposition` sent to the service is unchanged.
> - **Rows say what their change is a share of.** The text goes on a line under the value and change, as a second `<dd>`, worded as in §5.10 *Rendering*:
>   - "75% of the change", or "All of the change" from 99.5%. This explains the third case above: a device within 10% of its channel reads "+105 visits / All of the change" under "+100".
>   - "More than the channel’s net change" on an oversized row. That covers a page larger than its channel, a part within the 1.10 slack, and the larger side of a net pair, including the device rows of `get_breakdown_split()`. So Direct +1,280 lists "desktop +1,643 visits / More than the channel’s net change", then "mobile -362 visits". The first two cases above now read the same way.
>   - Search keyword: "A change equal to 3.6% of the site’s search clicks", or "less than 0.1%" when the share rounds to 0.
>   - Paid group member: "65.6% of paid traffic’s movement", since its share is of the group's gross movement, not its net change.
>   - A row without a share, such as the smaller side of a net pair, shows its change alone.
> - **Elevated cards name their channel** under the title: "73.3% of Referral’s +300 visits", or "All of Referral’s +300 visits" from 99.5%. `getKeyFactorShareText()` builds both this line and the steady "X% of all visits" line, so the PDF prints the same text.
> - **Tests.** PHP: the `oversized` flag on page, part and device rows, the parent fields on elevated cards, and the encoding of each new field. JS: the decoder (including fields it can't read), each wording, the card and panel rendering, and the PDF line. There's a new `Shares` story in `KeyFactors.stories.tsx`.
> - **Not done:**
>   - **The other headline shares.** `GROSS_CHANGE` ("64.5% of the growing traffic"), `SITE_TRAFFIC`, `NET_CHANGE` ("offsetting about 20% of the rise") and the `OFFSET` suffix on an elevated card. The Figma cards show only the change badge, so these need a design first. `shareBasis` now reaches the JS for them.
>   - **A paid member's campaign** ("; campaign *name* +N visits"). The panel payload doesn't carry the member's campaign.
>   - **Design check.** Figma has no share line on rows or on elevated cards. Sigal should confirm the placement and copy (question 5 below).
>   - **VRT reference images** for the KeyFactors and Typical traffic widget stories need regenerating, since their rows now show a share line, and the new `Shares` story needs one.
> - **Update (service port, Nov 26): the lines follow the service's new rendering.**
>   - **A row larger than its card says what moved the other way**, by its kind and the card's direction, in place of "More than the channel’s net change": "While other pages fell" under a page that rose further than its card, and the same for campaigns, sources, devices, channels and search queries. A visitor type names the other type's visits: "While returning-visitor visits fell".
>   - **The two sides of a net are one row:** the first side, with "Partly offset by -10 visits from instagram.com" under it. The second side isn't listed on its own.
>   - **An elevated card that moved further than its channel** says "More than Referral’s net change of +300 visits", since `parentChannel` now comes with any basis. Its share is then of the site's movement, or there's none on a flat period. A channel whose name ends in "s" takes a bare apostrophe: "All of Cross-network ads’ +300 visits".
>   - **Search keyword:** ", while other queries fell" (or rose) follows the share when the keyword moved against the site's search clicks, further than them, or while they didn't move. Without the site's search clicks, the keyword shows its change alone.
>   - **Device rows changed with item 2.** Direct +1,280 no longer lists desktop and mobile as a pair. Desktop is a row only when the card has no other, with "While other devices fell", and mobile never is.
>   - **New on the cards:** a channel's card for its other pages reads "Direct (other pages)", for example (round 1, item 5), and a landing page row shows the page's title when it has one. A card gains `otherPages` as its eleventh field, and a row gains `title` and `noSearchClicks` after `oversized`. Empty trailing fields are still left out, so a response cached before the port still decodes, and `FORMAT_VERSION` stays 1.
>   - **The PDF** prints the same card names and lines.
>   - **Tests:** `key-factors.test.ts`, `getKeyFactorRows.test.ts`, `getKeyFactorName.test.ts`, `getKeyFactorAttributeName.test.ts`, `decodeBenchmarkingResponse.test.ts`, `KeyFactors.test.tsx` and the PDF test cover each new line and field.
>   - **Still not done:** the headline shares, a paid member's campaign, and the design check.
>   - **Screenshot references need updating** for the `Shares` story, whose Direct card now shows desktop and mobile as one row, though the server no longer sends that pair. The new `Other Pages`, `Net Pairs`, `Oversized Rows` and `Without Search Clicks` stories need reference images too.

A card's badge is the channel's net change, while a row is the biggest mover inside it. So a row can be larger than its card when other parts of the channel moved the other way.

Listing a device or visitor type together with the side that moved the other way makes most of these cases self-explanatory. For example, Direct \+1,280 lists desktop \+1,643 and mobile −362. But the JS still shows only each row's label and change ([KeyFactorAttribute.tsx\#L102](https://github.com/google/site-kit-wp/blob/403103950b588721e77f1de712b1297ef05ddad2/assets/js/modules/analytics-4/components/traffic-overview/factors/KeyFactorAttribute.tsx#L102)). That leaves these cases unexplained:

- **A lone oversized row** shows a bare bigger number. That happens in three cases:  
    
  - a page row larger than its channel's change  
  - a device or visitor type that moved more than 10% further than its channel when the opposite side is below the row floors, e.g. Direct \+100 showing only "desktop \+115"  
  - a row within 10% that "carries all of the change", e.g. "+105" under "+100"


  §5.10 *Rendering* labels these "(+N visits, more than the channel's net change)" or "all of the change".


- **Shares.** Other rows should read "(+N visits, X% of change)". The keyword row should read "a change equal to X% of the site's search clicks".  
    
- **Elevated cards.** When a referring site or post takes its channel's card, nothing says which channel it came from. §5.10 has a parent-channel share line for this.  
    
- **Missing fields.** The panel payload doesn't carry share\_basis or an oversized flag, so the JS can't render this wording without inferring it. Passing through the fields the decomposition already has would fix that.

### **2\. The device and visitor-type rows need aligning with the service** ✅ Done

> **Status: done, by the service's rule, which now covers the cases `get_breakdown_split()` was written for.**
>
> - **The service changed first.** It now lists a device or visitor type that moved further than its card as the card's only row, when the card has no other. That covers the empty cards that led to `get_breakdown_split()`, so the plugin follows the Go client again, and `get_breakdown_split()` is gone:
>   - The device or visitor type that moved most with its channel is a row when it moved by the row floors, and by no more than the channel's change. It has its share of the card's change.
>   - One that moved further than its card is a row only when the card would otherwise have none. It shows its own change and what moved the other way: "While other devices fell", or "While returning-visitor visits fell".
>   - The side that moved against the card is never a row, so Direct +1,280 can list desktop +1,643 but not mobile −362.
>   - Only a device keeps the 10-point margin, as in the service. A visitor type is listed however much of the channel's visits it already had, so a channel whose visits are 97% new can list new visitors with most of its change.
> - **Parity:** these rows now match the Go client's (item 3).
> - **Tests:** `Key_FactorsTest.php` covers the device margin, a visitor type listed in place of a device that moved further than its card, both fallback rows, and `established` visitors read as returning ones. The tests of the old rule are gone: the visitor type's margin, a device within the 10% slack as all of the change, and the device net pairs.
> - **Copy:** "While returning-visitor visits fell" names visits, since no figure counts visitors (§3), where the service's own rendering says "while returning fell". Sigal can check it with question 5.

get\_breakdown\_split() is a sensible improvement:

- a net of two lists both sides  
- a row within 10% of the channel's change carries all of it  
- visitor types get the same 10-point margin as devices

It departs from §5.10 step 8b ("K1"), which drops any device or visitor type larger than its card. The endpoint accepts these rows, since it doesn't check the client's row rules. But the plugin and the Go reference now produce different cards for the same data, so a parity check (item 3\) would fail on exactly these cases. Please agree the rule with Arkaitz so §5.10 and the Go client change too.

### **3\. No parity check for the key factor port** ✅ Done

> **Status: done in the plugin; the Go export is still to ask for.**
>
> - **The missing tests are in `Key_FactorsTest.php`.** Each uses the case §5.10 or §4.4 gives:
>   - **The §4.4 example.** The full `decomposition` and the panel's cards: news.example takes Referral's card at 73.3% of its +300, Direct is an `OFFSET` card at 20% of the `NET_CHANGE`, and the residual is 80. It matches the example field for field, apart from `attributes` (below).
>   - **Oversized page rows.** Item 1 added a target page larger than its channel. There's now also a homepage larger than Direct (+61 under +57, as on oi.ie 2025-08-01), which fills the card on its own: a page beside it would take the rows past Direct's change.
>   - **The one-cut walk.** A page at 19% is kept and new visitors at 70% are left out, though the two add up to less than the card (the oi.ie 2026-04-03 case). A referring site is kept and a larger page beside it is left out. A net pair from two cuts (a new post +105 and a referring site −20 under +100) is kept together.
>   - **The 100% cap.** The two §5.10 cases: Direct lists Homepage 92.2% but not a page at 49.4%, and Organic Social lists x.com 82.4% but not linkedin.com 34.6%.
> - **Each test guards its rule.** With the cut check, the cap or the net pair removed from `keep_consistent_rows()` in turn, the tests for that rule fail. All 45 tests in the file pass.
> - **Not done: the parity check against Go.** It needs Arkaitz to export each checkpoint's request and `decomposition` as JSON. A plugin test can then map the request's rows onto the report rows `Key_Factors` reads, and require the same decoded JSON. Byte equality won't work: the plugin writes `20.0` where Go writes `20`. The check will also hit these known differences, which it has to allow for until they're settled:
>   - **Empty `attributes`.** The plugin sends `"attributes": []` on a card without rows, and Go leaves the field out (`omitempty`). The endpoint reads both as no rows.
>   - **Sources.** The plugin reads a channel's sources from the channel × source report, while Go routes `referrers` to a channel by name. The request's `referrers` has no channel, so the export would also need the channel × source rows, or the check skips cards decided by a source.
>   - **Landing pages.** The plugin's pages have no click IDs.
>   - **Device and visitor-type rows.** These differ by design until item 2 is agreed.
>   - **Placeholder channels.** The plugin gives a channel such as `(not set)` no card. Since item 18, its change can't make a flat period `OFFSETTING` either. Go counts it for the shape, and the endpoint drops its card.
> - **Update (service port, Nov 26): checked against the Go client with a harness, though not yet on the checkpoints.**
>   - A scratch harness ran Go's `ComputeKeyFactors` and the plugin's `Key_Factors` on the same inputs. 90 of 90 targeted cases gave the same cards, among them every `Key_FactorsTest` case, and so did 6,999 of 7,000 random ones from two seeds. The one that differs has two paid campaigns with the same change, which the plugin orders by name and Go by the order of the request's rows.
>   - The harness used a copy of the service outside both repos and isn't checked in. A test on the 242 checkpoints still needs Arkaitz's export.
>   - The known differences above still apply, apart from the device and visitor-type rows (item 2). Three more belong on the list: a landing page's addresses that differ only in case or in a trailing slash are one page, a page's title is cleaned without Go's Markdown stripping, and the homepage row has no `value`, where Go sends an empty one. `spreadAcrossPages` (item 6) is the plugin's own, and stays out of the `decomposition`.
>   - `Key_FactorsTest.php` now has 70 tests. Seven tests of rules that no longer hold are gone, and every changed expectation was checked against the Go client.
> - **Update (service v17, Nov 26): checked again against v17's Go client.** 97 of 97 targeted cases gave the same cards, 7 of them new cases of the only card, and so did 6,999 of 7,000 random ones, with the same tie. v17 changed Go's cards in 10 of the 90 earlier targeted cases and in 113 of the random ones, so the run tested its rules.
>   - `Key_FactorsTest.php` now has 72 tests. A new one keeps the only card for its channel in five cases: a referring site, a post, a campaign, a referring site whose page is no row, and a flat period. Another lets a part without rows take its card after a page took the first card. The brand keyword test now expects the keyword named.
>   - Five cases of a part that takes its channel's card now have a second channel that moved, so the part's card isn't the only one.

§5.10 says a port should be checked by exporting the checkpoint requests and their decomposition from Go as JSON fixtures and requiring identical output. The baseline and availability ports have this, but Go doesn't export decomposition fixtures yet. Worth asking Arkaitz to add an export.

Key\_FactorsTest.php also has no tests for:

- oversized page rows  
- the one-cut consistency walk  
- the 100% cap  
- the §4.4 example (an elevated child plus an OFFSET card)

### **4\. No sensitive-content screen on the plugin's own cards** ✅ Done

> **Status: done.**
>
> - **The service's screen is ported.** The new `Content_Screen` class ports three checks:
>   - `IsSensitiveContent()`: the multilingual term set, normalization, look-alikes, leetspeak, masked words, and the pair, `lund` and `chút` rules.
>   - `IsOpaqueOrPersonalLabel()`.
>   - The markers the output check rejects (`hasOutputBlockedMarker()`: `javascript:`, `you are now`, and so on).
>
>   Every term list, character map and pattern was checked against the Go source byte for byte. The rules change with the service's, so the class names the Go files it follows.
> - **It runs where the Go client runs it, before any card is chosen.** So a hidden name never takes a card, and the next part can take its place:
>   - **Search keywords:** hidden keywords are left out, so Organic Search names the largest keyword it may show.
>   - **Sources:** hidden ones are left out of `Source_Classifier::classify_source()`.
>   - **Recent posts:** a post with a hidden title doesn't take its channel's card. It keeps its place among the request's 50, as in the service.
>   - **Campaign names:** `get_campaign_title()` checks them before and after they're renamed for readers. The insight request's campaign rows use the same check.
>   - **Page addresses** aren't screened for sensitive content, the same as on the endpoint.
> - **The campaign ID check now matches Go's.** The old check (no letter, or 5+ digits) is gone. It dropped labels the service keeps, such as `getfluence-20230417` and `Merca20_102018`.
> - **Beyond Go:** the plugin also applies the marker check to sources and campaigns. Go doesn't screen those on input, but the endpoint ignores a card or row that carries a marker.
> - **Tests.** `Content_ScreenTest` runs all 185 cases from the service's `sanitizer_test.go` and `labels_test.go`, copied by script so the multi-script strings are exact. They also pass on PHP 7.4, and with neither intl nor mbstring loaded. Without intl, the screen uses the plugin's scoped Symfony normalizer. Without mbstring, it lower-cases ASCII letters only. `Key_FactorsTest` and `Source_ClassifierTest` now cover a hidden keyword, a hidden source, a post with a hidden title, and hidden campaign names. Each of those tests fails when its screen call is removed.
> - **Not covered:** the chart's content markers still show the site's own post titles unscreened. They aren't cards, and the item didn't ask for them.

§5.10 goal 8: sensitive text and internal or personal campaign names never appear. The endpoint screens only the AI narrative. The cards the plugin renders have no screen for keywords, referrer names or campaign titles ([Key\_Factors.php\#L45](https://github.com/google/site-kit-wp/blob/9d9cc22075e035ae788e2887afafacdac8c383cf/includes/Modules/Analytics_4/Benchmarking/Key_Factors.php#L45) notes this). Opaque campaign IDs are detected only by a heuristic (no letters, or 5+ digits).

---

## **Insights plumbing**

5. **Errors are handled by HTTP status, not by the service's code** (§6.3). ✅ Done  
   - SITE\_NOT\_FOUND and NO\_DATA both become "400, cached 1 day". The spec asks for a reset offer on SITE\_NOT\_FOUND.  
   - RATE\_LIMITED (60 s Retry-After) is cached for 1 h. That's conservative, but it hides the insight for longer than needed.  
   - Polling for an old range isn't cancelled when the range changes. It's bounded at 60 s and the result is cached, so this is minor.

   > **Status: done, except the polling bullet, which is left as is on purpose.**
   >
   > - **Errors are read by the service's code.** `getAIInsightErrorCode()` in `ai-insight.ts` reads the code that the datapoints pass on as `reason`. A code it doesn't know is read from the status, the way the service codes an error that has none. Retries, resubmits and how long a failure is kept all go by code now.
   > - **NO\_DATA** is no insight rather than an error. It is kept for a day under its request. The plugin never sends a request with both totals at 0, so this is a safety net.
   > - **SITE\_NOT\_FOUND** shows a warning notice at the top of the panel: "Site Kit can't generate insights. The Site Kit service no longer recognizes this site. Reset Site Kit to connect it again." It has the existing **Reset Site Kit** button, which asks for confirmation first.
   >   - Only users who can set up Site Kit see it. Other users see the panel without the insights.
   >   - The failure is kept for a day under its request. A reset clears it.
   >   - The copy is new and has no design yet, so Sigal may want to adjust it.
   >   - The site-wide "Redo the plugin setup" banner isn't used, because the service's setup also needs the site's record. Only a reset fixes it.
   > - **RATE\_LIMITED now pauses requests for 30 minutes rather than an hour, and DAILY\_CAP until its Retry-After.**
   >   - The 60-second Retry-After isn't followed as is. The service charges the site's daily counter before it checks the user's allowance (`CheckAndConsume()` in `internal/ai/ratelimit/rate-limit.go`, and the quota design doc). So every refused request still uses one of the site's 20 generations a day, which all its users share.
   >   - 30 minutes is how long the default allowance (two an hour) takes to refill one generation, so the next request can succeed. A longer Retry-After is followed.
   > - **The pause covers every insight, not just the refused request.** One entry, shared by every tab, pauses requests for both the benchmarking and the conversion insights, because the quota counts both. Before, picking another date range sent a new request, which was refused and used up another of the day's generations.
   > - **Not changed: polling for the old range.** It runs on in the background for up to 60 seconds, and its result is cached, so going back to that range shows it at once. Cancelling it would need the store to rerun a resolution that has already finished, for a gain the item calls minor.
   > - **Tests:**
   >   - `benchmarking.test.ts`: how long each code's failure is kept; the pause for each quota code, across date ranges and tabs; NO\_DATA; an unknown code read by its status; and a code that overrides its status.
   >   - `conversion-insights.test.ts`: a refusal there pauses the benchmarking insight too.
   >   - `useBenchmarkingInsight.test.ts`: the hook's new `siteNotFound` flag.
   >   - `TypicalTrafficOverviewPanel.test.tsx`: the notice shows for users who can set up Site Kit, and not for other users or other failures.
   > - **Worth raising with Arkaitz:** a 60-second Retry-After on RATE\_LIMITED invites retries that each use up one of the site's daily generations. Either the Retry-After could say when the user's allowance next has a generation, or a refused request could be given its daily slot back.
   > - **Update (service port, Nov 26): RATE\_LIMITED now follows its Retry-After.** The service fixed the cause in `7fa118fa`: it checks the user's allowance before it counts a request against the site's daily allowance, so a refused request spends none of the site's generations.
   >   - The plugin now holds back every insight for the refusal's Retry-After, a minute, as §9 asks, rather than for 30 minutes.
   >   - `AI_INSIGHT_RATE_LIMIT_HOLD`, now a minute, applies only to a refusal without a usable Retry-After. DAILY\_CAP is unchanged.
   >   - The tables in `ai-insight.test.ts`, `benchmarking.test.ts` and `conversion-insights.test.ts` now expect a minute.

---

## **UX states and copy**

6. **A card with no rows looks broken.** ✅ Done  
   When no row qualifies, the card shows only its title and badge. Example from oi.ie, Sep 3–30: Organic Search rose \+169, but:  
     
   - the gain is spread across 233 pages, 216 of them at \+1 and none above \+5;  
   - Search Console clicks were flat (480 vs 485), so there's no keyword row;  
   - desktop and new visitors were already 96–97% of the channel, so their rows are left out.

   

   The Change drivers doc treats "no single driver" as a real answer ("…spread across many pages"). A line like that would explain the card. §5.10 doesn't cover this case either, so it's worth raising with Arkaitz.

   > **Status: done.**
   >
   > - **The server says when a card's change was spread across many pages.** `Key_Factors::is_spread_across_pages()` marks a moving channel card that has no rows. It marks the card when no page that moved with the channel carried `ROW_SHARE` (10%) of its change, which is the share a page needs to be a row. The card's `key_factor` then has `spreadAcrossPages: true`. It travels as the card's tenth field, after `parentChannelChange`, and only when true, so a browser that doesn't read it sees the card as before and `FORMAT_VERSION` stays 1. The service's `decomposition` doesn't carry it.
   > - **Why the server and not the browser.** A card also has no rows when the change sits on a page no card names, so "spread" can't be read from an empty card. Two such cases:
   >   - The homepage carried it. The homepage is a row only on Direct.
   >   - A hidden page carried it, such as a login page, a feed, or a page whose title is sensitive.
   >
   >   So every page counts in the check, the homepage and hidden pages among them, with the homepage's addresses as one page.
   > - **It claims "many" only when the report backs it.** The pages that moved with the channel must add up to at least its whole change. With each under 10%, that means at least 11 pages. The pages report is capped at 500 rows across all channels (item 14). When the cut leaves out part of the change, the card says nothing rather than guess.
   > - **The card:** under "Top changes within Organic Search", in the gray of the row titles, it says "Spread across many pages, with none standing out" in place of the rows. The heading stays, so the card lines up with its neighbors.
   >   - Steady cards and the cards a page, site, or campaign took from its channel are unchanged. They already have a line under their title.
   >   - The PDF prints no rows on any card, so it has nothing to add.
   >   - The copy is new and has no design, so Sigal may want to adjust it.
   > - **Not covered:** the other reasons a card can have no rows still leave it with its title and badge alone. These are a change carried by the homepage or a hidden page, or a device or visitor-type row that only mirrors the channel's mix (the oi.ie desktop and new-visitor case).
   > - **Tests:**
   >   - `Key_FactorsTest.php`: the oi.ie shape marks the card and stays out of the decomposition. Five cases don't mark it: the homepage carried half, the homepage at two addresses carried 40 of 300, a hidden page carried half, the pages add up to less than the change, and the card has a row.
   >   - `Response_EncoderTest.php`: the field's position.
   >   - `decodeBenchmarkingResponse.test.ts`: only `true` marks the card.
   >   - `KeyFactors.test.tsx`: the line in place of the rows, and no line on a card with rows.
   >   - A new `Spread Across Pages` story with a visual check. Its reference images still need generating.
   > - **Worth raising with Arkaitz:** §5.10 has no "no single driver" result. The client could send the same flag on a card, so the driver can say the change was spread across many pages rather than leave the card unexplained.
   > - **Update (service port, Nov 26):**
   >   - **A channel's card for its other pages** (round 1, item 5) is judged on what is left of its change, without the page that took the first card.
   >   - **The line shows less often.** A visitor type is now a row however much of the channel's visits it already had, and a device or visitor type that moved further than its card is the row of a card that has no other (item 2). On the oi.ie card, new visitors carried the rise (question 4), so they would now be its row, in place of the spread line.
   >   - **Still not covered:** a change carried by a hidden page or, outside Direct, by the homepage. A device that only mirrors the channel's mix is still no row, but a visitor type now is (above).
   >   - **Also worth raising with Arkaitz:** whether a visitor type that only mirrors the channel's mix should give way to a "spread across many pages" line.
   > - **Update (service v17, Nov 26): a lone card with nothing under its title is left out.** The spec's §8 now asks clients to hide the card list when it is one card without rows, as a catch-all. v17 keeps a part from taking the only card without rows (round 1, item 6), but a lone channel card can still have none, as when no part clears the row floors. `getShownKeyFactors()` decides it for the panel and the PDF:
   >   - A row without a name counts as none, since the card shows none of them.
   >   - **The spread line counts as something under the title**, since it says why the card has no rows, so a lone card with it still shows. This is the plugin's reading: the spec's rule counts `attributes` alone, and the spread line is the plugin's own.
   >   - The section keeps its heading for the insight, its placeholder, or the steady notice. Without any of them, the section is left out rather than show a heading with nothing under it. That happens when there is no insight: without the `trafficInsights` feature, for a range too long for it, or when it fails. The PDF does the same.
   >   - "No channel changed notably…" still counts the hidden card, so it never shows just because the card was left out.
   >   - Beside other cards, a card without rows still shows its title and badge alone, as above.
   >   - **Tests:** `key-factors.test.ts`, `KeyFactors.test.tsx`, `TypicalTrafficOverviewPanel.test.tsx`, `getTypicalTrafficOverviewPDFData.test.ts` and `TypicalTrafficOverviewPDF.test.tsx`. Tests whose only card had no rows now give it a second card or a row. No story changes, so no new reference images.

7. **Ranges over 364 days** show the band and key factors but silently no insight, because the service caps days\_in\_period at 364\. A short notice like the short-range one would explain the gap. ✅ Done  

   > **Status: done.**
   >
   > - **The server now says a range is too long for the insight.** `Typical_Traffic_Availability` has a new `range_too_long` flag, true above `Insight_Request_Builder::MAX_PERIOD_DAYS` (364). It travels as the availability's ninth field (`Wire_Format::AVAILABILITY_RANGE_TOO_LONG`). Before, `insight_request_allowed` stayed true for such a range even though no request was built, so the browser still asked for an insight that couldn't come. Now `insight_request_allowed` and `performance_insight_available` are false for it.
   > - **A notice takes the analysis's place:** "Select a date range of up to 364 days to see insights about your traffic." It is an info notice in the gray of the band's and the key factors' notices, at the top of the panel. The key factor cards and the band show as before.
   >   - It shows only with the `trafficInsights` feature, since there is no insight to explain without it.
   >   - It waits for the key factors. Until the history covers the period before the range, there is no insight either way, and the key factors' section already says when they will show. That keeps the notices from stacking (item 8). A range that has its key factors always has its band too, since the key factors need 2d days of history and the band d + 55 (d + 83 before the service port), so it never stacks with the band's notice either.
   >   - The PDF export prints the same notice in the analysis's place.
   >   - The copy is new and has no design yet, so Sigal may want to adjust it.
   > - **Who can pick such a range:** the date picker's custom ranges go back 14 months, so a range can run to about 425 days.
   > - **Tests:**
   >   - `Typical_Traffic_AvailabilityTest.php`: 364 days gets the insight and 365 doesn't, with the band and the key factors either way. The service's fixtures still match, since none of them is longer than 90 days.
   >   - `Response_EncoderTest.php` and `Get_Benchmarking_DataTest.php`: the new field's position.
   >   - `decodeBenchmarkingResponse.test.ts`: the new field is decoded, and a cached response in the eight-field layout is asked for again rather than read.
   >   - `typical-traffic.test.ts`, `TypicalTrafficOverviewPanel.test.tsx`, `TypicalTrafficOverviewPDF.test.tsx` and `getTypicalTrafficOverviewPDFData.test.ts`: when the notice shows, and where.
   > - **Worth raising with Arkaitz:** the service's `TypicalTrafficAvailabilityFor()` has no longest period, because its dashboards send 7, 14, 28 or 90 days (§4). The plugin's custom ranges can be longer, so the plugin adds the rule itself. The service could add a `RangeTooLong` field, with a fixture, so the two stay in step.

8. **Notices can stack.** ✅ Done  
     
   - The band notice and the no-previous-period notice can show together with two different "Check back on" dates.  
   - The band notice can also show together with the short-range notice.  
   - A 1-day range shows the band notice, a "vs. the previous 1 day" heading and the 7-day notice.

   

   One combined notice, or a precedence rule, would read better.

   > **Status: done.**
   >
   > - **One notice says what the range lacks.** It sits where the analysis would, above the visitor figures. It replaces four notices: the band's, the long-range one, and the key factors' short-range and no-previous-period notices. `getTypicalTrafficAvailabilityText()` picks its text, and the first rule that applies wins:
   >   1. A range under 7 days asks for one of at least 7 days. The notice says nothing of the band: its date is for a range this short, and a longer range moves it.
   >   2. While the key factors wait for the previous period, it says when they will show, and when the band will if it waits too.
   >   3. While the band alone waits, it says when the band will show.
   >   4. A range over 364 days, with `trafficInsights`, says what range the insight needs.
   > - **The key factors section shows only for a range with key factors.** Before, it kept its heading with a notice in place of the cards (round 1, items 10 and 11). The notice at the top now says the same, so no heading names a comparison that wasn't made, such as "vs. the previous 1 day".
   >   - The section keeps its placeholders until the figures arrive, so the sections still arrive together.
   >   - Its own notice is now only "No channel changed notably…".
   > - **Both dates in one sentence.** While both parts wait and both dates are ahead, the notice gives the earlier first: "We’re still learning what’s usual for your site. Check back on February 25, 2025 to see which channels changed the most, and on March 24, 2025 to see your typical traffic range." When the two share a day, it names the day once. The other cases:
   >   - **Both dates passed:** the range ends in the past, so the notice asks for a range that ends on or after the later one, which has both parts.
   >   - **Only the earlier passed:** it asks for a later range for that part, as that part's own notice did. Once one is selected, the notice says when to check back for the other.
   >   - Item 9 replaced these two cases: a past range now gets both dates in one "Select…" sentence.
   >   - **No dates,** since the site has no recorded traffic: it says the history is too short for either part.
   > - **The three cases above:**
   >   - band and no previous period: one notice with both dates;
   >   - band and short range: the short-range notice alone;
   >   - 1-day range: the 7-day notice alone, with no key factors heading.
   > - **The PDF** prints the same notice in the analysis's place. It leaves out the key factors section for a range without key factors.
   > - **Copy:** five new strings, for the combined notice, built from the wording of the two notices they replace. Sigal should check them, and the placement, since the key factors no longer have a waiting notice of their own.
   > - **Code:**
   >   - `TypicalTrafficAvailabilityNotice` replaces `TypicalTrafficRangeNotice` and `TrafficInsightRangeNotice`, with the class `googlesitekit-traffic-overview__availability-notice`.
   >   - `KeyFactors` loses `rangeTooShort`, `noPreviousPeriod` and `keyFactorsAvailableFrom`. Its `Range Too Short` and `No Previous Period` stories, which had no visual check, are gone.
   >   - `getTrafficInsightRangeText()` is gone, and `getKeyFactorsNoticeText()` only says that no channel changed notably.
   > - **Tests:**
   >   - `typical-traffic.test.ts`: each rule, and each date case of the combined text.
   >   - `TypicalTrafficAvailabilityNotice.test.tsx`: the one notice, and when it shows nothing.
   >   - `TypicalTrafficOverviewPanel.test.tsx`: one notice above the visitor figures, and no key factors section for a short range or while the key factors wait. The band's notice still shows when the band alone waits.
   >   - The PDF tests.
   > - **Screenshot references need updating.** The `Typical Traffic, Short History` story of `TrafficOverviewWidget` now shows the combined notice and no key factors section. Update its reference images with `npm run test:visualapprove` or the "VRT: Update reference images" label. *Since the service port, the story's band date is March 24, 2025, as the band needs d + 55 days, so the images need that too.*

9. **"Check back on" for past ranges.** For a custom range ending in the past, the notice says "Check back on *date*" until that date has passed, but a past range will never gain the missing history. The "Select a date range that ends on or after *date*" wording should apply whenever the range ends before the available-from date. ✅ Done  

   > **Status: done.**
   >
   > - **The notice now looks at where the range ends, not only at the date.** It says "Check back on…" only when the range ends on the last day a range can end on. Every other range gets "Select a date range that ends on or after…", whether the date has passed or is still ahead.
   >   - Any range whose part is waiting ends before that part's date, so the date alone can't separate the two cases. What matters is whether waiting helps. Only a range ending on the last selectable day has no later range to pick instead. A range that ends earlier never gains the missing history.
   >   - A date that has passed still gets "Select…", whatever the range, as before.
   > - **The last day a range can end on** is today on the dashboard. In the PDF it is yesterday, because the PDF's ranges end then. So a preset printed to PDF still says "Check back on…", as the dashboard does.
   > - **Both parts waiting on a past range:** the notice gives both dates in one sentence, as the "Check back on" version does. For example: "There isn’t enough traffic history for these dates. Select a date range that ends on or after February 6, 2025 to see which channels changed the most, and on or after April 2, 2025 to see your typical traffic range."
   >   - This replaces two item 8 cases. When both dates had passed, the notice gave only the later date. When only the earlier had passed, it gave only the earlier part. Now the same sentence covers every past range, so the reader sees both dates at once.
   >   - When the two dates are the same day, the notice keeps item 8's one-date sentence.
   > - **Copy:** two new strings for the two-date sentence, one for each order of the parts. They use the wording of the existing one-date "Select…" sentence, so Sigal can review them with item 8's five.
   > - **Not covered:** "Select a date range that ends on or after *date*" doesn't say the new range must be the same length. A longer range needs more history (the band needs d + 55 days), so it may still be too early. This was already true of the old "Select…" strings.
   > - **Code:**
   >   - The three waiting texts take `{ endDate, latestSelectableDate }` instead of today's date. `isCheckBackDay()` makes the one decision they share.
   >   - `getKeyFactorsWaitingText()` moved from `key-factors.ts` to `typical-traffic.ts`. Since item 8, only the notice at the top uses it, and the move lets it share that decision without an import cycle.
   >   - `TypicalTrafficAvailabilityNotice` reads the range's last day from `getDateRangeDates()` and the last selectable day from `getLatestSelectableDate()`. The PDF passes its own range's last day and yesterday.
   > - **Tests:**
   >   - `typical-traffic.test.ts`: each waiting text for a range that ends today and one that ends in the past, with the date ahead and passed. The availability text, for each part waiting on a past range.
   >   - `TypicalTrafficAvailabilityNotice.test.tsx`: a custom past range.
   >   - `TypicalTrafficOverviewPanel.test.tsx`: the band's notice for a range that ends today and one that ends in the past. The mixed case now gets the two-date sentence.
   >   - No story uses a past range, so no screenshot changes.

10. **Copy against Figma.** ✅ Done  
      
    - **No previous period.** The notice reads "There's no previous period to compare to yet. Check back on…" ([getKeyFactorsWaitingText.ts\#L65](https://github.com/google/site-kit-wp/blob/9d9cc22075e035ae788e2887afafacdac8c383cf/assets/js/modules/analytics-4/components/traffic-overview/utils/getKeyFactorsWaitingText.ts#L65)). The [Low traffic frame](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=3003-103856) has "Your selected date range has no previous period to compare to…". The dated version is better, so Sigal could update Figma.  
    - **Punctuation.** The short-range notice has no closing period, unlike the others ([getKeyFactorsNoticeText.ts\#L79](https://github.com/google/site-kit-wp/blob/9d9cc22075e035ae788e2887afafacdac8c383cf/assets/js/modules/analytics-4/components/traffic-overview/utils/getKeyFactorsNoticeText.ts#L79)).

    > **Status: done. Only the punctuation needed a code change.**
    >
    > - **No previous period:** the dated wording stays, and Figma is left for Sigal (question 3 below). Since item 9 the notice reads "There’s no previous period to compare to yet. Check back on *date* to see which channels changed the most." for a range that ends on the last selectable day, and "There’s no previous period to compare to. Select a date range that ends on or after *date*…" for one that ends earlier. While the typical traffic range waits too, item 8's combined notice gives both dates.
    > - **Punctuation:** the short-range notice now ends with a period: "Select a date range of at least 7 days to see which channels changed the most."
    >   - "No channel changed notably compared with the previous *N* days" had no period either, so it gets one too. Since item 8 it is the key factors section's only notice, and every other notice ends with one.
    >   - The lines on the cards, such as "Spread across many pages, with none standing out" and "While other pages fell", are labels rather than notices, so they stay without one.
    > - **Where the strings are now:** the files the item links to are gone. The short-range text is in `getTypicalTrafficAvailabilityText()` in `typical-traffic.ts`, and the no-change text in `getKeyFactorsNoticeText()` in `key-factors.ts`.
    > - **Tests:** every expectation of the two notices now has the period, in the helpers', `KeyFactors`, panel and PDF tests. That includes the tests that check a notice doesn't show, so they still look for the real text.
    > - **Screenshot references need updating.** The `No Notable Change` story of `KeyFactors` shows the no-change notice. Update its reference images with `npm run test:visualapprove` or the "VRT: Update reference images" label. No story shows the short-range notice.

    

11. **Low traffic state.** The [Low traffic frame](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=3003-103856) ("There aren't enough visits in the selected date range…") isn't implemented. It's waiting on the threshold decision (D12), so this is expected for now. ✅ Done  

    > **Status: done, with a provisional threshold until product decides D12 (question 1 below).**
    >
    > - **The server says when a site has low traffic.** `Typical_Traffic_Availability` has a new `low_traffic` flag. It travels as the availability's tenth field (`Wire_Format::AVAILABILITY_LOW_TRAFFIC`).
    > - **The threshold:** under 100 visits per 28 days, averaged over the 56 days that end on the range's last day. A site with less history is measured over the days it has.
    >   - 100 per 28 days is the top of T0, the lowest traffic tier in the service's population evaluation. At that level the floor of the band's margin alone is 63 visits on a center of 100, so the band says little.
    >   - The window is the last 8 weeks, not the range. Every range that ends on a day gets the same answer, and a drop inside a short range doesn't hide the band that shows it.
    >   - Both numbers are constants in `Typical_Traffic_Availability`: `LOW_TRAFFIC_DAYS` and `LOW_TRAFFIC_VISITS_PER_28_DAYS`.
    >   - A site with no history up to the range's end isn't low traffic. Its parts still say they wait for history.
    > - **What a site with low traffic gets:**
    >   - **No band, key factors, or insight.** `band_available`, `key_factors_available`, `insight_request_allowed` and `performance_insight_available` are false, however long the history. This follows item 7's `range_too_long`. The dates still count the history alone. The response then carries no band bounds, no `bandReferenceDays`, no cards and no insight request, so the plugin doesn't spend a generation on it.
    >   - **Its own notice.** The availability text gets a new first rule. Low traffic wins over the short-range, waiting, and long-range texts, since neither waiting nor another range would bring the parts back.
    > - **The notice uses the frame's current copy.** The frame has changed since the review. Its notice is now a yellow warning: "There isn’t enough traffic data right now to show a reliable typical range or traffic shifts. These insights will come back once your site gets more regular visits."
    >   - On the dashboard, `TypicalTrafficAvailabilityNotice` shows it as a `WARNING` notice (`googlesitekit-traffic-overview__low-traffic-notice`) in the analysis's place, with a "Learn more" link and a "Got it" button.
    >   - The link goes to the `typical-traffic-low-traffic` documentation slug, with item 12's links.
    >   - The button has no action yet, so the warning shows whenever the site has low traffic.
    >   - As in the frame, the chart keeps the line and the published posts, and the breakdown stays.
    > - **The PDF** prints the same text in the analysis's place, with no key factors section and no band.
    > - **Tests:**
    >   - `Typical_Traffic_AvailabilityTest.php`:
    >     - 199 visits over the last 56 days is low and 200 isn't, at 7, 28 and 90 days, after a year of 100 a day.
    >     - A drop to zero in the range, after 300 visits in the 28 days before it, isn't low.
    >     - A 14-day history is measured over its own days.
    >     - A site without history isn't low.
    >   - `Period_BaselineTest.php`: `get_recent_visits()`.
    >   - `Response_BuilderTest.php`: a site with low traffic gets no band, no cards, and no insight request.
    >   - `Response_EncoderTest.php`, `Get_Benchmarking_DataTest.php`, and the shared `benchmarking-data.json` fixture: the new field.
    >   - `decodeBenchmarkingResponse.test.ts`: the flag's position. A cached response in the nine-field layout is asked for again rather than read.
    >   - `typical-traffic.test.ts`: the new rule wins over every other.
    >   - `TypicalTrafficAvailabilityNotice.test.tsx`: the warning, its link and its button.
    >   - `TypicalTrafficOverviewPanel.test.tsx`: no band, key factors or insight request.
    >   - `getTypicalTrafficOverviewPDFData.test.ts`: the PDF's notice.
    > - **Screenshot references need generating** for a new `Typical Traffic, Low Traffic` story of `TrafficOverviewWidget`. Generate them with `npm run test:visualapprove` or the "VRT: Update reference images" label.
    > - **Still open:**
    >   - The threshold (question 1).
    >   - What "Got it" should do.
    >   - The "Learn more" page, behind the `typical-traffic-low-traffic` slug (item 12).
    >   - Whether Sigal keeps the frame's copy. It says "typical range" where the band's legend says "typical traffic range".

    
12. **"Learn more" links** on the band tooltip and the key factors tooltip still go to \#. ✅ Done  

    > **Status: done. The links use new documentation slugs, which the support team still has to add.**
    >
    > - **The links now go through `DocumentationLink`.** It builds `https://sitekit.withgoogle.com/support/?doc=<slug>` with `getDocumentationLinkURL()`, as the footer's `ai-insights` link does.
    >   - The band's tooltip uses `typical-traffic-range`, in `getTypicalTrafficLegendItem.tsx`.
    >   - The key factors tooltip uses `typical-traffic-shifts`, in `KeyFactors.tsx`. The slug is named after the section's heading, "Biggest traffic shifts".
    >   - Item 11's low traffic notice had the same `#` link, so it now uses `typical-traffic-low-traffic`, in `TypicalTrafficAvailabilityNotice.tsx`.
    > - **The slugs work before their pages exist.** The service's `/support/` endpoint looks each slug up in the support team's redirect sheet.
    >   - A slug that isn't in the sheet goes to the sheet's `_notfound` page, or to the documentation's home page if the sheet has no `_notfound` page.
    >   - Once the support team adds a slug, its link opens the page without a plugin release.
    > - **What the pages should cover:**
    >   - The band's page is the one the design doc's "Documentation in-product" section describes. The design doc puts its link in a tooltip on the chart's title, but the link is now in the tooltip on the band's legend item. The page explains the same things.
    >   - The key factors page has no description in the design doc yet.
    >   - The low traffic slug could go to the design doc's second page, on how much traffic each part needs, or to a page of its own.
    > - **Tests:** `getTypicalTrafficLegendItem.test.tsx`, `KeyFactors.test.tsx`, and `TypicalTrafficAvailabilityNotice.test.tsx` check each link's URL. They used to check for `#`, or for no URL at all.
    > - **No screenshot changes.** `DocumentationLink` renders the same `Link` with the same props. Only the `href` changes.
    > - **Still open:** the support team has to add the three slugs and write their pages.

    
13. **Layout shift while loading.** AVAILABILITY\_WHILE\_LOADING assumes every part is available, so sites without a band briefly see the analysis placeholder, which then disappears.

---

## **Minor**

14. **The 500-row cap on breakdowns** (a known limit) is the one most likely to matter on large sites. A page that lost most of its traffic can fall outside the cut and look like it never moved. ⏸️ Known limit, no change  

    > **Status: left as is. The only fix is to ask GA4 for more rows, which costs quota on every request.**
    >
    > - **What the cut does.** Each dimension report asks for 500 rows (`Report_Options::REPORT_ROW_LIMIT`). With two periods, each row is one value in one period, ordered by visits, so the cut keeps the 500 largest of those. `pair_periods()` counts a value missing from one period as 0 visits in it.
    >   - A page cut in one period looks like it gained or lost all of its visits, so its change is overstated rather than missed.
    >   - A page cut in both periods is missing from the cards, as the item says.
    >   - Either way, the error is at most the visits of the smallest row kept, since every row cut has no more. On a site where that row has 40 visits, a page can lose up to 40 visits unseen.
    > - **What already guards against it.** A card says its change was "spread across many pages" only when the pages kept add up to its whole change (item 6), so the cut can't make a card claim that.
    > - **If real sites show it matters,** raise the limit only for the reports with the most values, such as channel × landing page. Measure the GA4 quota and the response size on a large property first.
15. **Partial last day.** Presets still end today. The date picker epic is expected to drop today from the presets, which covers most of this. ⏸️ Deferred to the date picker epic  

    > **Status: deferred, no code change, as round 1's item 18 was.** The presets and custom ranges still end today, and `origin/develop` hasn't changed them yet (checked at `7952ec3ddd`, November 25). Round 1's item 18 weighed the two fixes: ending the tab on the last complete day, or marking today's point as partial. Revisit if the date picker epic keeps ranges that end today.
16. **Recent-content window.** The plugin uses publishedDaysAgo \< d, which matches the selected period. The service's §5.7 and its reference client use 0 … d (inclusive). The plugin's version looks right, so this is probably one for Arkaitz, but the two need to agree. ✅ Done, no plugin change  

    > **Status: the plugin is right. The service's docs and reference client need the fix.**
    >
    > - **The plugin.** `publishedDaysAgo` counts whole days back from the range's last day, so the range's first day is `d − 1` days ago. All three places that pick posts published in the range use `publishedDaysAgo < d`: the key factor cards (`Key_Factors::get_recent_post()`), the insight request (`Insight_Request_Builder::get_recent_content_rows()`), and the chart's markers (`Content_Markers`).
    > - **The service.** In production, the service reads the rows the plugin sends and doesn't filter them by age again, so the two agree. The difference is only in the service's own docs and tools:
    >   - §5.7 says "published `0 … d` days before `T`".
    >   - The reference client, `internal/ai/benchmark_dataset.go` (around line 1203), keeps `daysAgo <= periodDays`. Its comment says "published within the current period", which `daysAgo < periodDays` would match.
    >   - The difference is one day: a post published on the previous period's last day counts as new for the service's evaluation runs, and not for the plugin.
    > - **Still open:** Arkaitz changes §5.7 and the reference client to `< d`.
17. **Stale comments.** ✅ Done  
    - ai-insight.ts around L767 still describes the old range-keyed cache.  
    - benchmarking.ts around L658 still mentions "too long" ranges.  

    > **Status: done.**
    >
    > - **`ai-insight.ts`, `resolveAIInsight()`.** The comment said an insight keeps describing the period when the figures change later in the day. That only holds for a key without the figures, such as the conversion insight's. The benchmarking insight's key is its signed request, which changes with the figures. The comment now says the request's `cacheKey` decides this, with both cases. The service also keeps an insight for 24 hours, keyed by the request (its §6.1), so the entry's day still matches it.
    > - **`benchmarking.ts`, `getBenchmarkingInsight`.** "Too long" is right again since item 7: a range over 364 days has no insight request. The list of reasons was missing some, so it now names them all, as `Typical_Traffic_Availability` and `Insight_Request_Builder::build()` decide them: the feature is off, the range has no key factor cards (shorter than 7 days, a history that doesn't cover the period before it, or a site with low traffic), the range is longer than 364 days, neither period had a visit, or the request for the response failed.
18. **Steady cards and placeholder channels.** Placeholder channels (e.g. "Unassigned") are left out of STEADY cards, which the spec doesn't ask for, but they still count in the steady excess check. ✅ Done  

    > **Status: done. The excess check now leaves out the same channels as the cards.**
    >
    > - **What a placeholder channel is.** It's a channel named by a value in parentheses, such as `(not set)`, as `Insight_Request_Builder::is_placeholder()` tells. "Unassigned" isn't one: it's a real GA4 channel, and it gets a card like any other. *Since the service port, the card names it "Uncategorized traffic", as the service does.*
    > - **Why the check changed, not the cards.** The plugin gives a placeholder channel no card on any period, not only a steady one (`get_card_nodes()`, now `set_up_nodes()`), since it names nothing the reader would recognize. The service drops such a card from the `decomposition` too (§5.10, "Endpoint screening"). So the check had to follow the cards.
    >   - Before, a flat period where only `(not set)` moved by 1% of the site's visits was `OFFSETTING`, though no card could show that change.
    >   - Now `has_offsetting_channel()` skips placeholder channels, so that period is `STEADY` and shows the channels with the most visits.
    > - **A difference from Go.** §5.10's Step 4 counts every channel. It's on item 3's list of known differences.
    > - **Tests:** a new `Key_FactorsTest.php` test has `(not set)` gain 1.2% of a flat period. It failed before the change and passes now. All 963 benchmarking PHP tests pass.
19. **Test coverage.** ai-insight.ts (782 lines, shared with conversion insights) has no unit tests of its own. ✅ Done  

    > **Status: done.**
    >
    > - **The new `ai-insight.test.ts`** has 147 tests. They call the module directly, with no data store: `submit` and `readOperation` are `jest.fn()`s, time runs on Jest's fake timers, and entries are read back from the real API cache to check their TTLs.
    >   - **The helpers:** the error codes and timing constants, `getRetryAfterDelay()`, `getAIInsightErrorCode()`, `getFailureLifetime()`, and `getQuotaHoldLifetime()`, each as a table of inputs and outputs.
    >   - **`resolveAIInsight()`**: a cache entry, read from the tab's storage or the shared one; an insight answered at once; an operation read until done, honoring `Retry-After`; busy refusals retried until the deadline; a lost operation replaced only once; which failed reads delete the stored operation; the deadline; failure lifetimes; and the quota hold.
    > - **The tests guard the rules.** 44 copies of `ai-insight.ts`, each breaking one documented rule, each failed at least one test.
    > - **A stale comment they found.** `getQuotaHoldLifetime()`'s comment said a refusal without a usable `Retry-After` is held for an hour. That holds only for the daily cap: the code holds the rate limit for 30 minutes, as its own bullet and `benchmarking.test.ts` say. The comment now says so, and the table checks both. *Since the service port, the rate limit is held for its `Retry-After`, or for a minute without one (item 5).*
    > - **Not changed, since nothing breaks today:**
    >   - A read whose answer has no `done` is taken as still running, so it is read until the deadline and ends as a timeout. An unreadable answer to the request itself ends at once, as an invalid response.
    >   - `deleteInsightCacheEntry()` ignores the request's `shared`. `deleteItem()` still clears a shared entry, but only because its key has `::`. Both stores' keys come from `createCacheKey()`, which always has it.
    > - **Checks:** the new file and the two store suites pass (298 tests), and ESLint and `tsc` are clean.
20. **Click tracking.** Middle-clicks on key factor links aren't tracked. ✅ Done  

    > **Status: done.**
    >
    > - **Middle clicks.** The browser reports a middle click as an `auxclick`, not a `click`, so the handler never saw one. Both key factor links, a post card's title and a landing page row, now pass `useKeyFactorLinkClick()`'s handler to `onAuxClick` as well as `onClick`.
    > - **The handler.** A middle click records `click_page_link` and leaves the link to the browser, which opens it in a new tab, as a Command or Control click already did.
    >   - A click with Shift held does the same now. Before, the handler cancelled it and opened the link in the same tab, though Shift asks for a new window.
    >   - Any other button, such as the right one, which some browsers also report as an `auxclick`, isn't recorded.
    > - **Tests:** `KeyFactors.test.tsx` adds a Shift click, a middle click on each link, and a right-button `auxclick`.
21. **Duplicated components.** Until the original Traffic overview components are removed at launch, any develop change to them needs mirroring in the Typical\* versions. ✅ Done, nothing to mirror yet  

    > **Status: checked, with nothing to mirror. The rule stands until launch.**
    >
    > - **The merged `develop`.** Since each `Typical*` copy was made, one change reached its original: `983519911b` ("Show property marker on view-only dashboards", in `TrafficChart.tsx`). `TypicalTrafficChart.tsx` already has it.
    > - **`origin/develop` at `7952ec3ddd` (November 25).** It isn't merged into this branch yet. Since the last merge, it changes only Recent activity files, which have no `Typical*` copies.
    > - **Next merge:** list the changes to the originals with `git log <merge-base>..origin/develop -- assets/js/modules/analytics-4/components/traffic-overview`, and mirror any in the copies.

---

## **Questions needing product alignment**

1. **Low traffic threshold (D12).** What daily-visits level triggers the Low traffic state? Until product decides, item 11 uses under 100 visits per 28 days over the last 8 weeks. Product should also say what "Got it" does.  
2. **Post cards.** Following the service, a recently published post can take its channel's card when it carried most of the change. The designs show channel cards only. Sigal should confirm the card design for that case. *Since the service port, a page that brought visits through several channels can also take the first card, with a row for each channel, and those channels' cards then read "Direct (other pages)", for example (round 1, item 5). That needs a design too.*  
3. **Figma copy.** The band tooltip ("Based on N weeks of your traffic") and the dated no-previous-period notice are both better than the current Figma copy. Sigal should update the frames to match.  
4. **Organic Search sessions vs Search Console clicks.** In the oi.ie example, GA4 Organic Search rose \+169 (mostly "google", all new desktop visitors, about one visit per page), while Search Console clicks were flat. That looks like a crawler with a Google referrer. Should the cards or the insight point out a sessions rise that clicks don't confirm? The request already carries search\_clicks. *Since the service port, the insight notes a similar pattern on Direct alone (`direct_surge_pattern`): a rise of almost all new visits with no landing page, or spread thinly across many pages. Organic Search has no such rule.*
5. **Share lines on the cards.** Item 1 adds a line under each row ("75% of the change", "While other pages fell", "Partly offset by -10 visits from instagram.com") and under an elevated card's title ("73.3% of Referral’s +300 visits", "More than Referral’s net change of +300 visits"), in the gray of the row titles. The Figma cards have neither. Sigal should confirm the placement and copy, and whether moving cards should also show their headline share ("64.5% of the growing traffic", "offsetting about 20% of the rise"). *The service port changed these lines (item 1). "While returning-visitor visits fell" needs a check too, since it names visits where the service writes "while returning fell".*

