# Benchmarking response — the expected range for each plotted day, in the response and the wire format

## Feature Description

The Typical Traffic chart is going to draw an expected range under its line: for every day, the lowest and the highest number of visitors that the site's own history makes normal for that day. `Expected_Baseline` computes that range in PHP from a daily visitor series. But `GET:benchmarking-data` does not call it, and the response has no place for the result. Each `dailyTraffic` row carries a date and a visitor count and nothing else, and the encoded response from #13593 has no member for the bounds.

This issue puts the expected range into the response: two more numbers on every `dailyTraffic` row, `expectedMin` and `expectedMax`, computed on the server and carried to the browser in the wire format.

**The daily report gets longer, but the chart does not.** The chart plots 395 days. The fit for each of those days reads up to 365 days of history ending on that day, so the earliest plotted day needs the 364 days before it. The daily visitors report from #13595 therefore covers 759 days ending on `endDate` instead of 395. Only the last 395 of them become `dailyTraffic` rows. The other 364 days are read by the fits and are never sent to the browser. The report is still one request in the same batched call, so this adds no request.

**Each plotted day gets the bounds fitted on its own history.** A day's bounds come from the fit for that day, which reads the series up to and including that day and nothing after it. A day that does not have 28 days of recorded traffic behind it gets no bounds. This happens at the start of a young property's chart, and after a long run of zeros at the start of the series, for example when the site was tagged long after the property was created. On those days both bounds are `null`.

**The totals do not change.** `visitors.current` and `visitors.previous` are still sums over the selected period and the period before it. Both periods are inside the 395 plotted days, so a longer report does not change them.

**The wire format gains one member.** The bounds travel as member `7` of the encoded response: one `[ expectedMin, expectedMax ]` pair for each daily count in member `3`, in the same order, or `null` for a day without a band. The bounds are rounded to one decimal before they are encoded, as every other non-integer in the format is, and the browser does not round them again. The format version stays `1`, because no response in format `1` has been released to users.

Concretely, the first three plotted days of a response decode to this:

```json
"dailyTraffic": [
	{ "date": "2025-08-18", "visitors": 132, "expectedMin": null, "expectedMax": null },
	{ "date": "2025-08-19", "visitors": 0, "expectedMin": 118.4, "expectedMax": 183.1 },
	{ "date": "2025-08-20", "visitors": 147, "expectedMin": 124.3, "expectedMax": 191.5 }
]
```

and travel as members `2`, `3` and `7`:

```json
"2025-08-18",
[ 132, 0, 147 ],
...,
[ null, [ 118.4, 183.1 ], [ 124.3, 191.5 ] ]
```

The first day has no band because it is only the 27th day counted from the site's first day with recorded traffic. The second day has a band although it had no visitors: a day without traffic is still a day the site's history has an expectation for.

The checked-in fixture that both the PHP encoder test and the JavaScript decoder test read gains member `7`, so a change to the bounds on one side without the other still fails one of the two tests.

This issue needs `Expected_Baseline` from #13798, which computes the bounds, the response assembly from #13595 and the wire format from #13593. The decoded rows are what the `benchmarking` slice from #13598 stores, so they reach the panel from #13599 with the bounds on them. Drawing the bounds on the chart from #13600 is separate work.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* For a request with `endDate=2026-09-15`, the daily visitors report covers the 759 days from `2024-08-18` to `2026-09-15`, ascending, and is run in the same batched call as before, so the response still needs at most two calls to Analytics.
* `dailyTraffic` still holds one row for each of the 395 days ending on `endDate` — `2025-08-17` to `2026-09-15` for that request — and the 364 earlier days of the report appear nowhere in the response.
* Every `dailyTraffic` row carries `date`, `visitors`, `expectedMin` and `expectedMax`.
* A row's `expectedMin` and `expectedMax` are the bounds `Expected_Baseline` returns for that row's day, fitted on the zero-filled series of the 759 days up to and including that day.
* A row whose day has fewer than 28 days from the first day with recorded traffic up to and including that day has `expectedMin: null` and `expectedMax: null`. Every other row has both bounds as numbers with at most one decimal.
* On a property whose series has recorded traffic on every day of the 759, every one of the 395 rows has both bounds.
* On a series with `0` visitors on every day before `2026-03-01` and traffic from that day on, every row before `2026-03-28` has `null` bounds, and every row from `2026-03-28` on has both bounds.
* `visitors.current` and `visitors.previous` are the same sums over the same two periods as before.
* Two requests ending on `2026-09-15` whose daily series differ only on `2026-09-15` return the same bounds for every day before `2026-09-15`.
* The encoded response is an array of eight members. Members `0` to `6` are unchanged, and member `7` holds one entry for each daily count in member `3`, in the same order:
  * `[ expectedMin, expectedMax ]` for a day with a band, each rounded to one decimal.
  * `null` for a day without a band.
* The format version in member `0` stays `1`.
* The decoder gives each `dailyTraffic` row the `expectedMin` and `expectedMax` from the matching entry of member `7`, unchanged, and `null` for both when the entry is `null`.
* An encoded response that is not an array of eight members, or whose member `7` does not have one entry for each daily count, decodes to nothing and is reported as an unusable response.
* The checked-in `benchmarking-data.json` carries member `7` with at least one day that has a band and one that does not. Encoding the fixed set of values in the PHP test produces that file, and decoding that file in the JavaScript test produces `dailyTraffic` rows with the matching bounds.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
