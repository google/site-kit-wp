# Typical traffic: data scenarios

Draft · Oct 21, 2026 · Evan Mattson

## Summary

- This doc shows what the Typical traffic tab could show for each mix of data history and selected date range. It turns the open questions from the Oct 20 call into concrete cases.  
- None of the rules are decided yet. Each case shows the facts, and 13 open decisions turn those facts into what the tab shows.  
- For the default range of the last 28 days, every day in the range has at least 28 days of history before it once a site has 56 days of data. Every day has at least 56 days before it once the site has 84\. The traffic shift cards also need 56 days, so that the 28 days before the range have data.  
- The decisions that most change when the tab first shows something are how much history the band needs, how much of the range it must cover, and what the Traffic performance insight needs.

## How to read this

**How this doc works.** None of the rules are decided. Each scenario shows the facts: which days have data, and how much history comes before each day. It then lists the decisions that change the outcome. IDs such as D1 point to those decisions, and anyone can weigh in on any of them. Numbers in \[brackets\] are candidate values. Once the team decides, the scenarios can show the results.

**Parts of the tab.** Typical traffic is one of three tabs under "Find out how your audience is growing" on the Site Kit dashboard, next to Traffic overview and Recent activity.

- **Line:** the traffic line on the chart.  
- **Band:** the typical range drawn around the line.  
- **Key factors:** the cards below the chart, under "Biggest traffic shifts vs. the previous N days". Each card names a source: a channel such as Organic Search, or a landing page, search keyword, referring site or campaign. A source gets a card only if its traffic changed by at least a set amount, the minimum change.  
- **Traffic performance insight:** the AI insight above the chart that says how traffic compares with the band. Figma titles it "How your traffic compares to usual".  
- **Primary drivers insight:** the AI insight next to it that sums up the key factors. Figma titles it "Biggest traffic shifts".  
- **Insights:** in this doc, only these two. The Traffic overview tab has its own AI insight at the top, which this doc does not cover.

**Inputs**

- **History:** days of GA4 data up to the end of the range, counted from the first day with traffic.  
- **Range:** the selected date range. Today the presets are the last 7, 14, 28 or 90 days. The date picker epic, which Sigal is designing, adds custom ranges of any length, ending on any date up to the current day.  
- **Previous period:** the same number of days right before the range. Key factors compare against it.

**Tab states**

- 🟢 **Full:** every part shows.  
- 🟡 **Partial:** the chart shows, but at least one part is still waiting for more history. This doc always says which parts show and which wait. A notice on the tab says the same, so "Partial" never stands alone.  
- 🟠 **Not enough for this range:** a zero state, so a message replaces the whole tab. Another range would show at least a Partial view, so the message suggests one. Figma calls it "Not enough data to show typical traffic".  
- ⚪ **Collecting:** a zero state. No range can show even a Partial view yet, so the message says so. Figma calls it "We're still collecting data for your typical traffic".

**What each part waits for.** This is what a Partial view is made of.

- **Line:** shows whenever the tab is not in a zero state.  
- **Band:** waits until days in the range have enough history before them, and until enough of the range has a band. See D1 and D6.  
- **Traffic performance insight:** waits for a band. How much of the range it needs, and which tier, is D9.  
- **Primary drivers insight:** sums up the key factors, so it waits for them. D11 covers what it says when no source changed enough.  
- **Key factors:** wait until every day of the previous period has data, which the call agreed. They may also wait for the band. See D10.

**Sources.** "The design doc" is the engineering design doc for this epic, which Eugene is updating. Its older Traffic Insights part is "the design doc's older insights part". "Figma" is the iteration Sigal shared on Oct 20, and "the prototype" is the working prototype discussed on the Oct 20 call. The open-questions doc and Mariya's Change drivers doc are older planning docs. The appendix has the links, more about some terms, the math and the conflicts with older docs.

## Band quality

The design doc's older insights part already draws a simpler band when history is short. This draft proposes three tiers, so a band is usable from 28 days of history, useful from 56 days and at its best from about 13 months. Each day's tier depends on the history before that day. D1, D4 and D5 decide how the tiers are used.

```
0          28 days        56 days                     13 months
|----------+--------------+---------------------------+---------->
  no band       Early                Weekly             Seasonal
```

| Tier | What the band knows | Why this threshold |
| :---- | :---- | :---- |
| Early | Recent traffic level and trend, with a rough weekday pattern | 28 days give 4 samples of each weekday. This is the minimum in the design doc and the prototype. |
| Weekly | A stable weekday pattern, such as busier Mondays | 56 days give 8 samples of each weekday. The prototype treats 56 days as normal. The design doc's older insights part needs 8–9 weeks for its weekday tier. |
| Seasonal | Patterns from the same dates last year | 13 months cover a full year back plus 4 weeks. The design doc's older insights part needs 392 days. The design doc also hides the tab until the property is 13 months old. |

Suggested UI, for Sigal to design:

- If one chart can show more than one tier, the change between tiers should not look like a break in the band. See D5.  
- Only Early days look different, for example with an "Early estimate" label in the legend.  
- The tooltip on the info icon next to the chart title says what the band is based on and what comes next. For example: "Based on 6 weeks of your traffic. Weekly patterns are included in 2 weeks." It replaces the fixed "last 18 months" copy.

## Key milestones

Days of data a site needs before each milestone, for ranges that end today. These are facts, not decisions. Each part of the tab waits for one or more of them, depending on the decisions.

| Range | Every day has \[28\] days of history before it | Every day has \[56\] days before it | Every day of the previous period has data | Every day has \[13 months\] before it |
| :---- | :---- | :---- | :---- | :---- |
| Last 7 days | 35 | 63 | 14 | 399 |
| Last 14 days | 42 | 70 | 28 | 406 |
| Last 28 days | 56 | 84 | 56 | 420 |
| Last 90 days | 118 | 146 | 180 | 482 |

A band on only part of the range can appear sooner. See D6. The math in the appendix gives the numbers for a range of any length.

## Scenarios

**How to read a scenario.** On the data row, ⬛ is a day with data and 🔲 is a day without. On the band row, each day shows the best tier its history allows: 🔲 none, 🟨 Early, 🟪 Weekly or 🟦 Seasonal. Whether that day actually gets a band depends on the decisions. Left of \| is the previous period and right of \| is the selected range, 10 squares each. The chart never draws the previous period, so its band row shows ➖.

### Ranges that end today

#### S1 · 20 days of history · Last 28 days

```
data  🔲🔲🔲🔲🔲🔲🔲🔲🔲🔲 | 🔲🔲🔲⬛⬛⬛⬛⬛⬛⬛
band  ➖➖➖➖➖➖➖➖➖➖ | 🔲🔲🔲🔲🔲🔲🔲🔲🔲🔲
```

- No day has 28 days of history before it, so no option of D1 gives a band yet. The previous period has no data, so key factors can't show either.  
- Every option therefore gives a zero state, and D13 decides what it says about timing. At the earliest, a 1-day range gets a band in 9 days. Every day of the last 28 days has 28 days of history before it in 36 days.

#### S2 · 40 days of history · Last 14 days

```
data  ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛ | ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛
band  ➖➖➖➖➖➖➖➖➖➖ | 🔲🟨🟨🟨🟨🟨🟨🟨🟨🟨
```

- 12 of the 14 days could get an Early band, which is 86% of the range. Under D1, a \[56\]-day minimum means no day gets a band yet.  
- D6 decides whether a band on 86% of the range shows now or waits 2 days for the whole range.  
- The previous period has data on every day, so key factors can show unless D10 makes them wait for the band. The Traffic performance insight waits under every option of D9: 2 days for a band of any tier on every day, or 30 days for a Weekly one.

#### S3 · 40 days of history · Last 28 days

```
data  🔲🔲🔲🔲🔲🔲⬛⬛⬛⬛ | ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛
band  ➖➖➖➖➖➖➖➖➖➖ | 🔲🔲🔲🔲🔲🔲🟨🟨🟨🟨
```

- Only 12 of the 28 days could get an Early band, which is 43% of the range. The previous period has data on only 12 of its 28 days, so key factors can't show under any option.  
- Under D6, only a \[25%\] share shows the band now. With a larger share, the tab shows a zero state. It is Not enough for this range if D7 allows a shorter range, because the last 7 days would show a band. The Figma copy asks for a range of at least 28 days instead.

#### S4 · 56 days of history · Last 28 days

```
data  ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛ | ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛
band  ➖➖➖➖➖➖➖➖➖➖ | 🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨
```

- Every day could get an Early band, and none a Weekly one yet. The previous period has data on every day.  
- Under D9, the Traffic performance insight shows now if it can use an Early band, or in 28 days if it needs a Weekly one. The last 7 days at 40 days of history are the same case.  
- Under D1, a \[56\]-day minimum means no day gets a band yet.

#### S5 · 120 days of history · Last 90 days

```
data  🔲🔲🔲🔲🔲🔲🔲⬛⬛⬛ | ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛
band  ➖➖➖➖➖➖➖➖➖➖ | 🟨🟨🟨🟪🟪🟪🟪🟪🟪🟪
```

- The first 26 days could get an Early band, and the other 64 a Weekly one. The previous period has data on only 30 of its 90 days, so key factors wait 60 more days under any option.  
- D5 decides whether the chart shows both tiers, or the Early tier across the whole range.  
- Under D9, the Traffic performance insight shows now with a band of any tier, or in 26 days if it needs a Weekly band on every day.

### Ranges that end in the past

These ranges come with the date picker epic.

#### S6 · 2 years of history · 28 days ending 6 months ago

```
data  ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛ | ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛
band  ➖➖➖➖➖➖➖➖➖➖ | 🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦
```

- Every day has over 13 months of history before it, so every day could get a Seasonal band. The previous period has data on every day.  
- Under D4, the band is Weekly if the first version has no Seasonal tier.  
- Under D3, reading up to 13 months back means this range needs data from about 20 months ago. A cap on how far back the plugin fetches would give the oldest days a lower tier.

#### S7 · 7 months of history · 28 days ending 6 months ago

```
data  🔲🔲🔲🔲🔲🔲🔲🔲🔲⬛ | ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛
band  ➖➖➖➖➖➖➖➖➖➖ | 🔲🔲🔲🔲🔲🔲🔲🔲🔲🟨
```

- Only 2 of the 28 days could get an Early band, which is 7% of the range. The previous period has data on 2 of its 28 days.  
- No option of D6 shows a band this small, and key factors can't show, so the tab shows a zero state. If a later range would work, the message can suggest it.  
- A range that ends before the first day with data is the same case, unless the date picker epic adds a dashboard-wide state for it.

## Settled

Agreed on the Oct 20 call:

- The tab always shows. Missing data never hides it.  
- The band is calculated the same way whatever range is selected. The range only decides which days show.  
- Key factors compare against a previous period of the same length, so they need data for that whole period.

Decided since the call:

- The tab never shows predicted or future traffic. The chart's end date is never later than the current day.

## Decisions needed

Every decision is open, and anyone can weigh in on any of them. Each one lists the reasonable options and what each option changes.

### The band

- **D1. How much history must come before a day for it to get a band?** We also need to know how much the current model, the calculation behind the band, improves between 56 days and 13 months.  
  - **A. \[28\] days, shown as an Early band.** This matches the design doc and the prototype. S2 to S5 can show a band.  
  - **B. \[56\] days.** There is no Early tier, so every band has a stable weekday pattern. S2, S3 and S4 get no band yet, and S5 gets one on its last 64 days.  
  - **C. About \[13 months\].** Only Seasonal bands show. This is the 13-month gate in the design doc, and the open-questions doc lists 12–18 months as the requirement. Only S6 gets a band, and new sites wait more than a year for any band.  
- **D2. Which days can a day's band draw on?** We also need to know which of these the current model does.  
  - **A. Only the days before it, like a forecast.** The band shows what was expected before that day happened.  
  - **B. The days up to and including that day.** This is the design doc, which fits each day on its history up to that day and on nothing after it. The day's own traffic is part of its own fit.  
  - **C. The whole selected range, including later days.** The range's own days then shape their own band, so a period can read as normal partly because the band was built from it.  
- **D3. How far back can the band reach for a range that ends in the past?** The Figma tooltip says the model reads 18 months, and the design doc says 12\.  
  - **A. Up to \[13 months\] before each day.** S6 then needs data from about 20 months ago. A range that starts a year ago needs data from over 2 years ago.  
  - **B. Cap how far back the plugin fetches, and let the band improve as more data loads.** The oldest days in a past range then get a lower tier or no band.  
  - **C. Limit how far back a custom range can start.** The date picker epic would need to enforce the limit.  
- **D4. Should the first version include the Seasonal tier?** We also need to know whether the current model uses seasonality at all, and what the tier would take.  
  - **A. No.** Ship Early and Weekly, and remove copy that promises seasonal patterns. The current Figma tooltip says "Seasonal patterns are already part of your typical range". S6 then shows a Weekly band.  
  - **B. Yes.** The model must first compare against the same dates last year. The design doc's older insights part already describes this: it compares each day with the same weekday 364 days earlier.  
- **D5. Can one chart show more than one band tier?** S5 is an example, with an Early start and a Weekly rest.  
  - **A. Yes, each day gets the best tier its history allows.** The band improves wherever more history exists, as long as the change does not look like a break.  
  - **B. No, the whole chart uses its lowest tier.** The band looks uniform, but recent days show less than their history supports.  
  - **C. Yes, with a visible marker where the tier changes.** Readers can see why the band changes, but the chart gets busier.  
- **D6. How much of the range must the band cover before the chart shows it?**  
  - **A. At least \[50%\].** S2's band shows, at 86% of the range. S3's band, at 43%, waits.  
  - **B. A smaller share, such as \[25%\].** S2's and S3's bands both show. A band can then be a thin strip on a long chart.  
  - **C. All of it.** Neither shows yet. S2's band follows in 2 days.

### The range

- **D7. What is the shortest range that can show typical traffic?** Custom ranges can soon be any length. In a doc comment, Mariya wrote that she is considering a floor and a ceiling on the range for this feature.  
  - **A. Any length.** Each day's band comes from that day's history, so even a 1-day range can show one.  
  - **B. A minimum range, such as \[7\] or \[28\] days.** Shorter ranges show Not enough for this range. With \[28\], as in the Figma zero state, S2's 14-day range never shows the tab.  
  - **C. Any length for the band, but \[7\] days or more for the insights and key factors.** On the call, Sigal noted that a short window can be dominated by a spike.  
- **D8. What period do the chart and the insights cover?**  
  - **A. The selected range for both.** All copy follows the range, for example "vs. the previous 7 days".  
  - **B. The selected range for the chart, but a fixed 28 days for the insights.** This is how the prototype works today, per the call. In a doc comment, Arkaitz wrote that the service, which writes the insights from data the plugin sends, compares the last 28 days with the previous 28 days whatever range is shown. A 7-day chart can then sit next to an insight about 28 days.  
  - **C. A fixed 13 months for the chart, with insights for the selected range.** This is the design doc. It plots 395 days at every range, and argues that a chart limited to the range would repeat the Traffic overview tab.

### The insights and key factors

- **D9. What band does the Traffic performance insight need before it shows?**  
  - **A. A Weekly or Seasonal band on every day of the range.** The insight says traffic is higher or lower than usual, so it should rest on a stable weekday pattern. It first shows at 63, 70, 84 and 146 days for the four preset ranges.  
  - **B. A band of any tier on every day of the range.** It first shows at 35, 42, 56 and 118 days.  
  - **C. Option B, with copy that names the short history.** For example: "Based on 5 weeks of your traffic".  
  - **D. The same band the chart shows, judging only the days that have one.** The insight can show as soon as the band does, but it then speaks for only part of the range.  
- **D10. What shows before the band can?**  
  - **A. A zero state.** Key factors alone compare with the previous period, not with typical traffic.  
  - **B. The line, the key factors and the Primary drivers insight, with a notice.** For the last 7 days, key factors could show from 14 days of history.  
  - **C. The line only, with a notice.** The tab looks like Traffic overview until the band arrives.  
- **D11. What should show when no source changed enough to get a card?** The answer also covers what the Primary drivers insight says then. In a doc comment, Arkaitz wrote that the intent is 0 to 3 cards, and asked Mariya to confirm.  
  - **A. One line of copy instead of the cards.** For example: "No single source changed much vs. the previous 28 days". The rest of the tab still shows.  
  - **B. The top channels with their share of traffic.** This is the Figma frame for steady traffic, which shows each channel's share of the total instead of its change.  
  - **C. Nothing.** The key factors section is hidden. This is what the design doc does.

### Zero states and notices

- **D12. What should a site with very little traffic see?** None of the sources sets a minimum average traffic. The design doc notes that nothing stops a band for a site averaging two visitors a day.  
  - **A. A zero state about traffic volume, with no countdown.** It applies below \[N\] visitors a day, even with a year of history, because more time may not fix it.  
  - **B. The normal tab.** The design doc says the band is wider on a small site, and most sources change by less than the minimum change.  
  - **C. Hide the tab for these sites.** Arkaitz suggested this in a doc comment, but the call agreed the tab always shows.  
- **D13. Should zero states and Partial views say when the next part will be ready?**  
  - **A. Yes, with a date or a number of days.** The milestones make that date predictable.  
  - **B. Yes, but only roughly, for example "in a few weeks".** This is safer if gaps in tracking can move the date.  
  - **C. No, but offer to notify the user when it is ready.** Sigal raised this on the call.

## Appendix

### More about some terms

- **Channel:** a GA4 default channel group, such as Organic Search or Referral.  
- **Source:** the card types come from the design doc and the Change drivers doc.  
- **Minimum change:** the design doc calls it the significance floor, and the Change drivers doc calls it a noise floor. The older docs disagree on its value, as the conflicts table shows.  
- **Visitors:** shorthand for traffic. The design doc counts the chart in total users and key factors in sessions. Before the call, the team discussed switching the charts to sessions. This doc does not depend on the choice.  
- **Prototype:** it shows the normal view from 56 days of history, and a collecting notice from 28 to 56 days.  
- **Default range:** the dashboard selects the last 28 days unless the user picks another range.

### The math

For a range that ends today:

- The share of days in the range with at least M days of history before them is (history − M) divided by range, capped between 0% and 100%. M is \[28\] for Early, \[56\] for Weekly and \[392\] for Seasonal.  
- The share of the previous period that has data is (history − range) divided by range, with the same cap.

For example, 40 days of history and the last 28 days give 12 divided by 28, or 43%, of days that could get an Early band. For a range that ends in the past, count history only up to the range end.

### Conflicts with older docs

| Topic | Older docs | This doc |
| :---- | :---- | :---- |
| Tab visibility | Hidden until the property is 13 months old | Always shows. Agreed on the call. |
| Minimum history | Anywhere from 28 days to 18 months | Open. See D1. |
| Chart window | 395 days at every range | Open. See D8. |
| Insight window | A fixed 28 days, or the selected range | Open. See D8. |
| Projected segment | A forecast drawn 7 or 28 days past the last day | None. The chart never goes past the current day. |
| Minimum change | Design doc: a change under 5, or under 0.40% in traffic impact. Change drivers doc: 5 to 10 visitors. | Not set. It belongs to key factor scoring, which is out of scope. |

### Out of scope

GA not connected, gaps in tracking, how key factors are scored, and the card content for growth, drop and steady traffic.

### Sources

- **Call:** [Performance benchmarking weekly sync, Oct 20, 2026](https://docs.google.com/document/d/1gv96CQnDowY6l_joXOZ7f5xethIHucJaz5f4STf8r94/edit). Gemini notes and transcript.  
- **Figma:** [Performance benchmarking](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2381-53216). The link opens the iteration Sigal shared on Oct 20\.  
- **Design doc:** [\[SK\] Performance Benchmarking Design](https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit). Its "Part 3 \- Traffic Insights" is the older insights part. Arkaitz commented that its baseline "is quite different at the moment".  
- **Doc comments:** comments by Arkaitz and Mariya from Oct 1 and 2, 2026, on the [\[SK\] Benchmarking Insights: Documentation Alignment Review](https://docs.google.com/document/d/1LzNLG2ggluqIEZzm-wlT3YuPOyjwsEHEOjnaDLAeSCA/edit). This doc uses only those comments, not the review's own content.  
- **Open questions:** [Benchmarking \- open questions 11 Aug](https://docs.google.com/document/d/145V0jodHXUvz85xoxJlis6quldZzF5sDNQ-cl9k6_xo/edit).  
- **Change drivers doc:** [Change drivers](https://docs.google.com/document/d/1lnDAOs2f6N4SOGoVYEmcQuz9hg9sZI66B3KPjK5AuRo/edit), drafted by Mariya. Its "Proposed driver hierarchy" tab lists the card types and the minimum change.