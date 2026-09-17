# Benchmarking wire format — the PHP encoder, the JS decoder and the fixture they share

## Feature Description

The Typical Traffic tab will use the response of the `GET:benchmarking-data` datapoint to draw thirteen months of daily visitor counts — 395 rows — beside up to seven ranked lists of dimension rows whose labels are page titles, search queries and referrer hostnames. The dashboard holds a response like that in browser storage for an hour, for every date range a reader opens, in the same store every other cached response shares. Written the obvious way — one object per row, repeating its field names, carrying a date string for every day — that is tens of kilobytes per date range. 

This issue adds the format the benchmarking data will be encoded in the response data travels in. The format is positional: a row is an array whose index `n` means the same field on both sides of the wire, rather than an object that repeats its keys once per row. Four rules do most of the saving. The date axis is implicit, so one start date plus one count per day replaces 395 date strings. Every label, URL and post title is hoisted into a single string table and referenced by index, so a URL that appears in two dimensions is stored once. A dimension code travels as its position in a fixed list rather than as its name. And every non-integer is rounded before it is encoded, so the browser never re-rounds or re-serializes a number.

Concretely, a three-day response carrying one row in each of three dimensions decodes to this — the shape the tab's sections are written against:

```json
{
	"visitors": { "current": 412, "previous": 388 },
	"dailyTraffic": [
		{ "date": "2025-08-18", "visitors": 132 },
		{ "date": "2025-08-19", "visitors": 0 },
		{ "date": "2025-08-20", "visitors": 147 }
	],
	"dimensions": [ "CONTENT", "SEARCH_QUERIES", "CHANNELS" ],
	"contextualData": {
		"content": [
			{ "url": "/how-to-plant-garlic/", "title": "How to plant garlic", "visitors": 96, "publishedDaysAgo": 14 }
		],
		"searchQueries": [
			{ "label": "how to plant garlic", "current": 74, "previous": 31, "positionCurrent": 8.4, "positionPrevious": 14.2 }
		],
		"channels": [
			{ "label": "Organic Search", "current": 210, "previous": 168 }
		]
	}
}
```

and travels as this:

```json
[
	1,
	[ "/how-to-plant-garlic/", "How to plant garlic", "how to plant garlic", "Organic Search" ],
	"2025-08-18",
	[ 132, 0, 147 ],
	[ 412, 388 ],
	{
		"5": [ [ 0, 1, 96, 14 ] ],
		"4": [ [ 2, 74, 31, 8.4, 14.2 ] ],
		"0": [ [ 3, 210, 168 ] ]
	},
	[ 5, 4, 0 ]
]
```

Member `0` is the format version and member `1` the string table; every label, URL and title in member `5` is a position in that table, so a string two rows share costs one entry and two integers. Member `2` is the first plotted day and member `3` one count per day from there, so no date for `2025-08-19` or `2025-08-20` is written at all. Member `4` carries the two period totals. Member `5` is keyed by each dimension's position in a fixed list — `CHANNELS` `0`, `SEARCH_QUERIES` `4`, `CONTENT` `5` — and member `6` gives those same positions in ranked order, which is what `dimensions` decodes back to. Across 395 days and seven dimensions rather than three days and three rows, that difference is the format's whole reason for existing.

Two pieces implement the format — an encoder in PHP and a decoder in JavaScript — and the contract runs one way only, because the browser never encodes anything. What keeps the two honest is a single JSON fixture checked into the repository and read by both test suites: the PHP test asserts that a fixed set of values encodes to that file, and the JavaScript test asserts that the same file decodes to the objects the tab's sections are written against. A field added on one side without the other fails one of the two tests rather than silently misreading a number in the dashboard.

A version integer leads the encoded structure. The browser cache key already carries the plugin version, so a stored response cannot outlive a plugin update; the version integer covers a request that was already in flight across one, and a decoder that does not recognize it treats the response as unusable rather than guessing at the layout.

A response written by a later encoder therefore arrives looking like this:

```json
[ 2, [ "Organic Search" ], "2025-08-18", [ 132, 0, 147 ], [ 412, 388 ], { "0": [ [ 0, 210, 168 ] ] }, [ 0 ] ]
```

and a decoder written against version `1` returns nothing for it — not the daily series it could still have read out of member `3`, and not the totals out of member `4` — so the tab shows its error state instead of a chart built from members whose meaning it is only guessing at.

This issue produces the format and nothing that uses it. The datapoint that encodes a real response, and the datastore slice that decodes one, are separate pieces of work — see #13594 and #13598.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* The decoder turns an encoded response into an object with exactly four fields:

  | Field | Shape |
  | :---- | :---- |
  | `visitors` | `{ current, previous }`, both integers |
  | `dailyTraffic` | one row per day in ascending date order, each `{ date, visitors }` with `date` as `YYYY-MM-DD` and `visitors` an integer |
  | `dimensions` | an array of dimension codes, ordered as the encoded response ordered them |
  | `contextualData` | the dimension rows, keyed by dimension |

* A dimension code is one of `CHANNELS`, `DEVICES`, `VISITOR_MIX`, `REFERRERS`, `SEARCH_QUERIES`, `CONTENT` or `CATEGORIES`, and each one decodes to its own `contextualData` key and row shape:

  | Code | `contextualData` key | Row |
  | :---- | :---- | :---- |
  | `CHANNELS` | `channels` | `{ label, current, previous }` |
  | `DEVICES` | `devices` | `{ label, current, previous }` |
  | `VISITOR_MIX` | `visitorMix` | `{ label, current, previous }` |
  | `REFERRERS` | `referrers` | `{ label, current, previous }` |
  | `SEARCH_QUERIES` | `searchQueries` | `{ label, current, previous, positionCurrent, positionPrevious }` |
  | `CONTENT` | `content` | `{ url, title, visitors, publishedDaysAgo }` |
  | `CATEGORIES` | `categories` | `{ label, current, previous }` |

* The encoded response is an array of seven members:

  | Member | Holds |
  | :---- | :---- |
  | `0` | the format version, an integer |
  | `1` | the string table: every label, URL and post title, each once |
  | `2` | the first plotted day, as `YYYY-MM-DD` |
  | `3` | the daily visitor counts, one per day |
  | `4` | `[ visitorsCurrent, visitorsPrevious ]` |
  | `5` | the dimension rows, keyed by dimension index |
  | `6` | the dimension order, as dimension indices |

* The encoded response carries no dates other than member `2`: the decoder gives the row at position `n` of member `3` the date `n` days after member `2`, so a response whose member `2` is `2025-08-18` and whose member `3` has 395 entries decodes to `dailyTraffic` running from `2025-08-18` to `2026-09-15` with no day missing.
* Every string in the encoded response is an index into the string table at member `1`, and a string used by more than one row appears in the table once. Decoding a response whose `content` row and `referrers` row both point at index `4` gives both rows the same string.
* A missing value is encoded as `null` and decodes as `null`. A value of `0` is a real visitor count and decodes as `0`.
* Every number in the encoded response is already rounded, and the decoder returns each one unchanged.
* A response whose member `0` is not the version the decoder was written against decodes to nothing, and the decoder reports it as an unusable response rather than returning the fields it could read.
* A dimension index in member `5` or member `6` that the decoder does not recognize is dropped: that dimension is absent from both `dimensions` and `contextualData`, and every other dimension in the response decodes.
* One JSON file in the repository is the encoder's expected output and the decoder's input: encoding a fixed set of values produces that file, and decoding that file produces the four fields above.
* Nothing requests, produces or renders an encoded response as part of this work: the encoder is driven by the values it is handed and the decoder by the checked-in file.

## Implementation Brief

The format version is `1`. The dimension codes travel as their position in this fixed list, which both sides use: `CHANNELS` `0`, `DEVICES` `1`, `VISITOR_MIX` `2`, `REFERRERS` `3`, `SEARCH_QUERIES` `4`, `CONTENT` `5`, `CATEGORIES` `6`.

A row is one array per dimension, in one of three layouts:

| Dimensions | Row |
| :---- | :---- |
| `CHANNELS`, `DEVICES`, `VISITOR_MIX`, `REFERRERS`, `CATEGORIES` | `[ labelIndex, current, previous ]` |
| `SEARCH_QUERIES` | `[ labelIndex, current, previous, positionCurrent, positionPrevious ]` |
| `CONTENT` | `[ urlIndex, titleIndex, visitors, publishedDaysAgo ]` |

`labelIndex`, `urlIndex` and `titleIndex` are positions in the string table at envelope member `1`. `positionCurrent` and `positionPrevious` are the only non-integer values the format carries.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/` (new directory):
  * Add `Wire_Format.php`, holding only constants and no behavior: `FORMAT_VERSION`; one constant per envelope member (`MEMBER_VERSION` `0`, `MEMBER_STRINGS` `1`, `MEMBER_FIRST_DATE` `2`, `MEMBER_DAILY_VISITORS` `3`, `MEMBER_VISITOR_TOTALS` `4`, `MEMBER_DIMENSION_ROWS` `5`, `MEMBER_DIMENSION_ORDER` `6`); `DIMENSION_INDEXES`, mapping each dimension code to its index in the fixed list above; `CONTEXTUAL_DATA_KEYS`, mapping each dimension code to its `contextualData` key; and `POSITION_DECIMAL_PLACES`, set to `1`.
  * Add `Response_Encoder.php` with one public method, `encode( array $response )`, taking the assembled response — `visitors`, `dailyTraffic`, `dimensions` and `contextualData` — and returning the seven-member envelope. Every index it writes comes from a `Wire_Format` constant; no literal index appears in the file.
  * Encoding the daily series: member `2` is the `date` of the first `dailyTraffic` row, and member `3` is each row's `visitors` in the order the rows arrive. The encoder writes no other date.
  * Encoding the strings: collect every label, URL and post title into member `1`, in the order they are first seen, with each distinct string stored once. Each row then carries that string's position. A string field whose value is `null` is encoded as `null`, not as an index.
  * Encoding the rows: member `5` is keyed by the dimension's index, and holds the rows of the matching `contextualData` key in the order they arrive. Member `6` is the codes in `dimensions`, as their indices, in the same order.
  * Rounding: `positionCurrent` and `positionPrevious` are rounded to `POSITION_DECIMAL_PLACES`. Every other number is cast to an integer. A `null` stays `null`, and a `0` stays `0`.

* [ ] In `assets/js/modules/analytics-4/utils/benchmarking/` (new directory):
  * Add `constants.ts`, exporting the JavaScript half of `Wire_Format`: `BENCHMARKING_FORMAT_VERSION`, the seven envelope member indices under the same names, `BENCHMARKING_DIMENSION_CODES` as the fixed list in order, and `BENCHMARKING_CONTEXTUAL_DATA_KEYS`. Nothing outside this file holds a literal index.
  * Add `types.ts`, exporting the decoded shapes: `BenchmarkingDimensionCode` as the union of the seven codes; `BenchmarkingVisitors` (`{ current: number; previous: number }`); `BenchmarkingDailyTrafficRow` (`{ date: string; visitors: number }`); `BenchmarkingValueRow` (`{ label: string | null; current: number; previous: number }`); `BenchmarkingSearchQueryRow`, which adds `positionCurrent` and `positionPrevious`; `BenchmarkingContentRow` (`{ url, title, visitors, publishedDaysAgo }`); `BenchmarkingContextualData`, keyed by the seven `contextualData` keys with every key optional; and `DecodedBenchmarkingResponse`, the four fields the decoder returns.
  * Add `decodeBenchmarkingResponse.ts`, exporting `decodeBenchmarkingResponse( encoded: unknown ): DecodedBenchmarkingResponse | null`. It returns `null` when `encoded` is not an array of seven members or when member `0` is not `BENCHMARKING_FORMAT_VERSION`, and it returns `null` rather than a partly decoded object in both cases.
  * Decoding the daily series: the row at position `n` of member `3` gets the date `n` days after member `2`, built with `getPreviousDate` and `getDateString` from `@/js/util` so that no local time zone shifts a day.
  * Decoding the strings: a numeric string field is read as `member[ 1 ][ index ]`; a `null` field stays `null`. Two rows pointing at one index get the same string.
  * Decoding the dimensions: walk member `6` in order, skip an index that is not in `BENCHMARKING_DIMENSION_CODES`, and give each remaining index its code in `dimensions` and its rows under its `contextualData` key. Skip a key in member `5` whose index is not in the list as well. The decoder does no arithmetic and returns every number as it arrives.

* [ ] In `assets/js/modules/analytics-4/datastore/__fixtures__/` :
  * Add `benchmarking-data.json`, the one encoded response both test suites read. Build it so that it exercises the whole format: a daily series of several days with a `0` in the middle, both `visitors` totals, at least one dimension of each of the three row layouts, a string used by a `CONTENT` row and a `REFERRERS` row so that both point at one index, a `null` in a string field, and a `SEARCH_QUERIES` row whose positions have one decimal place.
  * Read it from PHP with `file_get_contents( GOOGLESITEKIT_PLUGIN_DIR_PATH . 'assets/js/modules/analytics-4/datastore/__fixtures__/benchmarking-data.json' )`, the way `Audience_UtilitiesTest` reads `audiences.json`, and import it in JavaScript from `@/js/modules/analytics-4/datastore/__fixtures__/benchmarking-data.json`.
  * Add the export to `assets/js/modules/analytics-4/datastore/__fixtures__/index.js` as `benchmarkingData`.

Nothing in this issue requests, produces or renders a real response. The datapoint that encodes one is #13594, and the datastore slice that decodes one is #13598.

### Test Coverage

* Add `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_EncoderTest.php` covering:
  * A fixed assembled response encodes to exactly the checked-in `benchmarking-data.json`.
  * A label that two dimensions share is written to the string table once, and both rows carry the same index.
  * A `null` label stays `null` in the encoded row, and a `0` visitor count stays `0`.
  * An average position of `8.44` is encoded as `8.4`, and every other number is an integer.
  * A `dailyTraffic` series carries no date past the first row's.
* Add `assets/js/modules/analytics-4/utils/benchmarking/decodeBenchmarkingResponse.test.ts` covering:
  * The checked-in `benchmarking-data.json` decodes to the four fields, with the dimension rows the fixture describes.
  * A 395-entry daily series starting at `2025-08-18` decodes to dates running to `2026-09-15` with no day missing, and a `0` day keeps its own date.
  * Two rows pointing at one string-table index decode to the same string, and a `null` string field decodes to `null`.
  * A response whose version is not `1` decodes to `null`, and so does a response that is not an array of seven members.
  * A dimension index the decoder does not know is absent from both `dimensions` and `contextualData`, and every other dimension in the response still decodes.
* No Storybook story is required, because the change adds no UI.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
