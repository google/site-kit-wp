# Benchmarking wire format — key factor cards in place of the dimension arrays, and `visits` in place of `visitors`

## Feature Description

The benchmarking response the Typical Traffic tab reads is encoded in a positional wire format (#13593), and the browser decodes it into the object the tab's sections are written against (#13598). Today members `5` and `6` of that format carry seven ranked dimension arrays — channels, devices, visitor mix, referrers, search queries, content and categories — and the decoder turns them into `dimensions` and `contextualData`.

The design for the Key factors section has changed. It no longer shows one list per dimension. It shows up to three **cards**, and each card names one **driver**: a channel, a landing page, a search keyword, a referring site or a campaign. Each card also has up to two **attributes**: the values inside the driver that carried its change, such as the referring site behind a `Referral` card or the device behind a `Direct` card ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2096-14304&m=dev)). A card and each of its attributes carry a label, two counts and a share: the part of the site's change, in the same direction, that the card or attribute accounts for. The design shows that share as `9.8% of traffic growth` on a card and as `4.3% of growth` on an attribute.

This issue changes the wire format and the decoder to carry those cards instead of the dimension arrays. The tab's key factors section is then written against the cards. The work that fills them on the server comes later, in #13845.

**The format changes in two members.** Member `5` carries the cards in rank order. Member `6` carries their attributes: one list for each card, in the same order as member `5`. The format version stays `1`, because no response in format `1` has been released to users. A kind — the kind of a driver or the kind of an attribute — travels as its position in a fixed list, the same way a dimension code does today. A label travels as a position in the string table, and a share travels as a number rounded to one decimal.

**`visitors` becomes `visits`.** The response's period totals and each day's count are named `visitors`, but from #13845 on every count in the tab is a session, which the tab calls a visit. This issue renames them `visits` on both sides of the format — in the assembled response, the encoder, the decoder, the decoded types and the constants that name members `3` and `4` — so that the expected-range and week-ahead work is written against the new names. Nothing on the wire changes for the rename: the format is positional, so it moves names and no bytes.

A response with two cards decodes to this:

```json
{
	"visits": { "current": 412, "previous": 388 },
	"dailyTraffic": [
		{ "date": "2025-08-18", "visits": 132 },
		{ "date": "2025-08-19", "visits": 0 },
		{ "date": "2025-08-20", "visits": 147 }
	],
	"keyFactors": [
		{
			"kind": "REFERRING_SITE",
			"label": "Facebook",
			"current": 96,
			"previous": 31,
			"sharePct": 21.4,
			"attributes": [
				{ "kind": "LANDING_PAGE", "label": "/how-to-plant-garlic/", "current": 58, "previous": 12, "sharePct": 15.1 },
				{ "kind": "DEVICE", "label": "mobile", "current": 71, "previous": 20, "sharePct": 16.8 }
			]
		},
		{
			"kind": "CHANNEL",
			"label": "Organic Search",
			"current": 210,
			"previous": 222,
			"sharePct": 40.3,
			"attributes": []
		}
	]
}
```

and travels as this:

```json
[
	1,
	[ "Facebook", "/how-to-plant-garlic/", "mobile", "Organic Search" ],
	"2025-08-18",
	[ 132, 0, 147 ],
	[ 412, 388 ],
	[
		[ 3, 0, 96, 31, 21.4 ],
		[ 0, 3, 210, 222, 40.3 ]
	],
	[
		[ [ 1, 1, 58, 12, 15.1 ], [ 6, 2, 71, 20, 16.8 ] ],
		[]
	]
]
```

A card is `[ kind, label, current, previous, sharePct ]`, and so is an attribute. The driver kinds are listed `CHANNEL`, `CONTENT`, `SEARCH_KEYWORD`, `REFERRING_SITE`, `CAMPAIGN`, so `3` is `REFERRING_SITE`. The attribute kinds are listed `TRAFFIC_CHANNEL`, `LANDING_PAGE`, `SEARCH_KEYWORD`, `REFERRING_SITE`, `PLATFORM`, `CAMPAIGN`, `DEVICE`, `USER_TYPE`, so `1` is `LANDING_PAGE` and `6` is `DEVICE`. A kind is only ever added at the end of its list, so an index never changes meaning.

The checked-in fixture that both the PHP encoder test and the JavaScript decoder test read changes with the format, so a change on one side without the other still fails one of the two tests.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* With `typicalTraffic` enabled, a `GET` to `/google-site-kit/v1/modules/analytics-4/data/benchmarking-data?startDate=2026-08-19&endDate=2026-09-15` returns the encoded response. Its members `0` to `4` are unchanged, and the format version in member `0` stays `1`.
* Member `5` holds one entry per key factor card, in the order the response ranks them, each `[ kind, label, current, previous, sharePct ]`:
  * `kind` is the card's driver kind, as its position in this list: `CHANNEL` `0`, `CONTENT` `1`, `SEARCH_KEYWORD` `2`, `REFERRING_SITE` `3`, `CAMPAIGN` `4`.
  * `label` is a position in the string table in member `1`.
  * `current` and `previous` are integers.
  * `sharePct` is a number rounded to one decimal.
* Member `6` holds one list per entry of member `5`, in the same order. Each list holds that card's attributes, each `[ kind, label, current, previous, sharePct ]`, with `kind` as its position in this list: `TRAFFIC_CHANNEL` `0`, `LANDING_PAGE` `1`, `SEARCH_KEYWORD` `2`, `REFERRING_SITE` `3`, `PLATFORM` `4`, `CAMPAIGN` `5`, `DEVICE` `6`, `USER_TYPE` `7`. A card with no attributes has an empty list.
* A response with no cards is encoded with an empty member `5` and an empty member `6`. Until #13845, the request above always returns both members empty.
* A label that appears on two cards, or on a card and an attribute, is stored once in the string table.
* `getBenchmarkingData( '2026-08-19', '2026-09-15' )` on `modules/analytics-4` returns the decoded response. It has the keys `visits`, `dailyTraffic` and `keyFactors`, and does not have the keys `visitors`, `dimensions` or `contextualData`. `visits` is `{ current, previous }`, and each `dailyTraffic` row carries its day's count as `visits`. Until #13845, `keyFactors` is `[]`.
* Each `keyFactors` entry is `{ kind, label, current, previous, sharePct, attributes }`, in the order of member `5`, and each of its `attributes` is `{ kind, label, current, previous, sharePct }`, in the order of its list in member `6`. Every number comes out exactly as it was encoded.
* A card whose driver kind index is not in the list is left out of `keyFactors`, together with its attributes, and every other card is decoded. An attribute whose kind index is not in the list is left out of its card, and every other attribute is decoded.
* A card or an attribute with fewer than five fields is left out, and the rest are decoded.
* An encoded response is decoded to nothing, and the store records `benchmarking_decode_failed`, when any of these scenarios are encountered:
  * Member `0` is not `1`.
  * Member `5` or member `6` is not a list.
  * Member `6` does not hold exactly one entry for each entry of member `5`.

## Implementation Brief

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Wire_Format.php`:
  * Replace `MEMBER_DIMENSION_ROWS` with `MEMBER_KEY_FACTORS`, set to `5`, and `MEMBER_DIMENSION_ORDER` with `MEMBER_KEY_FACTOR_ATTRIBUTES`, set to `6`.
  * Add `KEY_FACTOR_KINDS`, mapping each driver kind to its index: `CHANNEL` `0`, `CONTENT` `1`, `SEARCH_KEYWORD` `2`, `REFERRING_SITE` `3`, `CAMPAIGN` `4`.
  * Add `KEY_FACTOR_ATTRIBUTE_KINDS`, mapping each attribute kind to its index: `TRAFFIC_CHANNEL` `0`, `LANDING_PAGE` `1`, `SEARCH_KEYWORD` `2`, `REFERRING_SITE` `3`, `PLATFORM` `4`, `CAMPAIGN` `5`, `DEVICE` `6`, `USER_TYPE` `7`.
  * Replace `POSITION_DECIMAL_PLACES` with `SHARE_DECIMAL_PLACES`, set to `1`.
  * Rename `MEMBER_DAILY_VISITORS` to `MEMBER_DAILY_VISITS` and `MEMBER_VISITOR_TOTALS` to `MEMBER_VISIT_TOTALS`. Their values stay `3` and `4`.
  * Leave `DIMENSION_INDEXES` and `CONTEXTUAL_DATA_KEYS` in place. `Response_Builder` and `Contextual_Data_Validator` still read them until #13845.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Encoder.php`:
  * In `encode()`, read `$response['keyFactors']`, or an empty array when it is absent, and stop reading `dimensions` and `contextualData`.
  * Write member `Wire_Format::MEMBER_KEY_FACTORS` as one `array( kind index, label, current, previous, sharePct )` per card, and member `Wire_Format::MEMBER_KEY_FACTOR_ATTRIBUTES` as one list per card of the same five fields per attribute. Encode `label` with the existing `encode_string()`, the counts with `encode_int()`, and `sharePct` with a new `encode_share()` that rounds to `Wire_Format::SHARE_DECIMAL_PLACES`, following the existing `encode_position()`.
  * Skip a card whose `kind` is not a key in `Wire_Format::KEY_FACTOR_KINDS`, together with its attributes, so the two members stay the same length. Skip an attribute whose `kind` is not a key in `Wire_Format::KEY_FACTOR_ATTRIBUTE_KINDS`.
  * Remove `encode_row()` and `encode_position()`.
  * Read the totals from `$response['visits']` and each day's count from each `dailyTraffic` row's `visits`, in place of `visitors`.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Builder.php`:
  * Rename the `visitors` key of the returned totals and of each `dailyTraffic` row to `visits`, and `sum_visitors()` to `sum_visits()`. Update the docblocks that name them.

* [ ] In `assets/js/modules/analytics-4/utils/benchmarking/constants.ts`:
  * Replace `MEMBER_DIMENSION_ROWS` with `MEMBER_KEY_FACTORS` (`5`) and `MEMBER_DIMENSION_ORDER` with `MEMBER_KEY_FACTOR_ATTRIBUTES` (`6`).
  * Replace `BENCHMARKING_DIMENSION_CODES` and `BENCHMARKING_CONTEXTUAL_DATA_KEYS` with `BENCHMARKING_KEY_FACTOR_KINDS` and `BENCHMARKING_KEY_FACTOR_ATTRIBUTE_KINDS`, each an `as const` array of the kinds in the order of their indexes in `Wire_Format`.
  * Rename `MEMBER_DAILY_VISITORS` to `MEMBER_DAILY_VISITS` and `MEMBER_VISITOR_TOTALS` to `MEMBER_VISIT_TOTALS`, as in `Wire_Format`.

* [ ] In `assets/js/modules/analytics-4/utils/benchmarking/types.ts`:
  * Replace `BenchmarkingDimensionCode`, `BenchmarkingValueRow`, `BenchmarkingSearchQueryRow`, `BenchmarkingContentRow` and `BenchmarkingContextualData` with:
    * `BenchmarkingKeyFactorKind` and `BenchmarkingKeyFactorAttributeKind`, the unions of the two kind lists.
    * `BenchmarkingKeyFactorAttribute`: `{ kind: BenchmarkingKeyFactorAttributeKind; label: string | null; current: number; previous: number; sharePct: number }`.
    * `BenchmarkingKeyFactor`: the same fields with `kind: BenchmarkingKeyFactorKind`, plus `attributes: BenchmarkingKeyFactorAttribute[]`.
  * In `DecodedBenchmarkingResponse`, replace `dimensions` and `contextualData` with `keyFactors: BenchmarkingKeyFactor[]`.
  * Rename `BenchmarkingVisitors` to `BenchmarkingVisits`, the `visitors` field of `DecodedBenchmarkingResponse` to `visits`, and the `visitors` field of `BenchmarkingDailyTrafficRow` to `visits`, with doc comments that say visits.

* [ ] In `assets/js/modules/analytics-4/utils/benchmarking/decodeBenchmarkingResponse.ts`:
  * Add to `membersHoldTheirShapes` that members `MEMBER_KEY_FACTORS` and `MEMBER_KEY_FACTOR_ATTRIBUTES` are both arrays of the same length. Remove the `MEMBER_DIMENSION_ORDER` check.
  * Replace `decodeDimensionRows()` with a `decodeKeyFactors( cards: unknown[], attributes: unknown[], strings: string[] ): BenchmarkingKeyFactor[]` that walks member `5` in order and pairs each card with the entry at the same position in member `6`. Drop a card shorter than five fields, or whose kind index has no entry in `BENCHMARKING_KEY_FACTOR_KINDS`. Within a card, drop an attribute shorter than five fields, or whose kind index has no entry in `BENCHMARKING_KEY_FACTOR_ATTRIBUTE_KINDS`. Decode an entry of member `6` that is not a list to no attributes. Read labels with the existing `readString()`, and keep the existing `laidOut()` check for a row's length.
  * Return `{ visits, dailyTraffic, keyFactors }`, and give each daily row its count as `visits`. Rename the local names that say visitors.

* [ ] In `assets/js/modules/analytics-4/datastore/benchmarking.ts`:
  * Update the `getBenchmarkingData` docblock to name `visits`, `dailyTraffic` and `keyFactors`.

* [ ] In `getTypicalTrafficChartData.ts` and `TypicalTrafficChart.tsx` under `assets/js/modules/analytics-4/components/traffic-overview/charts/`, and in `traffic-overview/test-utils.ts` (all added in #13600):
  * Read and build each day's `visits` in place of `visitors`, and rename `maximumVisitors` to `maximumVisits`.

* [ ] In `assets/js/modules/analytics-4/datastore/__fixtures__/benchmarking-data.json`:
  * Replace members `5` and `6` with three cards: a `REFERRING_SITE` card with a `LANDING_PAGE` and a `DEVICE` attribute; a `CHANNEL` card with no attributes, whose `current` is below its `previous`; and a `CONTENT` card for the same path as the first card's `LANDING_PAGE` attribute, with one `TRAFFIC_CHANNEL` attribute. Remove from member `1` every string no member still refers to.

### Test Coverage

* Update `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_EncoderTest.php`:
  * Replace `dimensions` and `contextualData` in `get_fixture_response()` with the three cards of the fixture, and rename its `visitors` keys to `visits`. The encoded result must still match `benchmarking-data.json`.
  * Replace the dimension cases with cases covering:
    * Each card is encoded with its kind index, its label's string-table position, its counts and its share, in rank order.
    * Each card's attributes are encoded in member `6` at the card's own position, and a card with no attributes has an empty list.
    * A card with an unknown kind is skipped together with its attributes, and an attribute with an unknown kind is skipped.
    * A label shared by a card and an attribute is written to the string table once.
    * A share is rounded to one decimal, and every count is written as an integer.
    * A response with no `keyFactors` is encoded with empty members `5` and `6`.
* Update `assets/js/modules/analytics-4/utils/benchmarking/decodeBenchmarkingResponse.test.ts`:
  * The checked-in response decodes to `visits`, `dailyTraffic` and `keyFactors`, with every card and attribute in order, and with no `visitors` field.
  * A card and an attribute with an unknown kind index are each dropped, and the rest decode.
  * A card and an attribute shorter than five fields are each dropped.
  * Each of these decodes to `null`: a member `5` that is not a list, a member `6` that is not a list, and a member `6` with one entry more or one entry fewer than member `5`.
  * Remove the cases that cover dimension rows.
* Update `tests/phpunit/integration/Modules/Analytics_4/Datapoints/Get_Benchmarking_DataTest.php`: replace the assertion on `Wire_Format::MEMBER_DIMENSION_ORDER` with one that member `Wire_Format::MEMBER_KEY_FACTORS` is a list.
* Fix any other test that reads `dimensions` or `contextualData` from the decoded response, including `assets/js/modules/analytics-4/datastore/benchmarking.test.ts` and `assets/js/modules/analytics-4/components/traffic-overview/hooks/useBenchmarkingData.test.ts`.
* Rename `visitors` to `visits` in every assembled and decoded response the tests write out: `Response_BuilderTest.php`, where `test_build__lists_0_visitors_for_a_day_analytics_returned_no_row_for` becomes `test_build__lists_0_visits_for_a_day_analytics_returned_no_row_for`, `Get_Benchmarking_DataTest.php`, `benchmarking.test.ts`, `__factories__/benchmarking.test.ts`, `TrafficOverviewWidget.test.tsx`, and the chart's tests from #13600.
* No Storybook story is required, because the change adds no UI.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
