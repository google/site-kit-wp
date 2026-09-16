# Benchmarking wire format — the PHP encoder, the JS decoder and the fixture they share

## Feature Description

The Typical Traffic tab draws thirteen months of daily visitor counts — 395 rows — beside up to seven ranked lists of dimension rows whose labels are page titles, search queries and referrer hostnames. The dashboard holds a response like that in browser storage for an hour, for every date range a reader opens, in the same store every other cached response shares. Written the obvious way — one object per row, repeating its field names, carrying a date string for every day — that is tens of kilobytes per date range.

This issue adds the format the response travels in, before anything produces or consumes one. The format is positional: a row is an array whose index `n` means the same field on both sides of the wire, rather than an object that repeats its keys once per row. Four rules do most of the saving. The date axis is implicit, so one start date plus one count per day replaces 395 date strings. Every label, URL and post title is hoisted into a single string table and referenced by index, so a URL that appears in two dimensions is stored once. A dimension code travels as its position in a fixed list rather than as its name. And every non-integer is rounded before it is encoded, so the browser never re-rounds or re-serializes a number.

Two pieces implement the format — an encoder in PHP and a decoder in JavaScript — and the contract runs one way only, because the browser never encodes anything. What keeps the two honest is a single JSON fixture checked into the repository and read by both test suites: the PHP test asserts that a fixed set of values encodes to that file, and the JavaScript test asserts that the same file decodes to the objects the tab's sections are written against. A field added on one side without the other fails one of the two tests rather than silently misreading a number in the dashboard.

A version integer leads the encoded structure. The browser cache key already carries the plugin version, so a stored response cannot outlive a plugin update; the version integer covers a request that was already in flight across one, and a decoder that does not recognize it treats the response as unusable rather than guessing at the layout.

This issue produces the format and nothing that uses it. The datapoint that encodes a real response, and the datastore slice that decodes one, are separate pieces of work — see #13594 and #13598.

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

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
