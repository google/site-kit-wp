# Benchmarking response — the insight request payload and the locale, in the response and the wire format

GitHub issue: [#13943](https://github.com/google/site-kit-wp/issues/13943)

## Feature Description

The Site Kit Service writes the insight from a request that the plugin builds. This issue builds that request in PHP inside `GET:benchmarking-data` (#13594), from the reports that the datapoint has just run. The response returns it as one encoded string, `payload`. The browser never reads this string. It sends the string back unchanged to `POST:benchmarking-insight` (#13940). So every number, row limit and card is decided in PHP, and the same data always gives the same payload. This matters because the service uses the payload's values as the key of its 24-hour cache, and a new key means a new generation.

**The payload always covers the 28 days that end on `endDate`**, whatever range the header shows. The service compares the period with a range for a 28-day total, so a 90-day total would look above the range almost every time. For this reason, the payload is only on the response for those 28 days. It is also only built when the site has 56 days of recorded traffic up to `endDate`, counted from `firstTrafficDate` (#13799). Then both 28-day windows were measured. Otherwise, any period would look like growth.

The response also gets `locale`: the user's language, in the form that the service reads. The dashboard uses it in the key of the stored insight (#13946).

The payload uses the summary from `Expected_Baseline` (#13941), the reports added for the insight (#13942), and the key factor cards (#13845) translated into the service's `decomposition` (#13944).

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?pli=1&tab=t.ti7yrmnh2lrv#heading=h.xai0p0vhie15 (see "Payload assembly", "Gating and visibility", "Wire format additions" and "Privacy")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* With `trafficInsights` enabled, `getBenchmarkingData( '2026-08-19', '2026-09-15' )` returns `payload`, a string, and `locale`.
* For the same request, when `firstTrafficDate` is `2026-07-23` (55 days of recorded traffic), `payload` is `null`, and the top pages and channel × landing page reports do not run. When it is `2026-07-22` (56 days), `payload` is a string.
* A response for any other range, such as `Last 90 days`, has `payload: null`.
* A site with no visits in either 28-day window gets `payload: null`.
* `locale` is the user's language as a tag with a hyphen and no variant: `de-DE` for `de_DE_formal`, `en-US` for `en_US`, and `ja` for `ja`.
* The decoded payload has `end_date`, `days_in_period: 28`, the locale, `visits`, `baseline`, `decomposition`, and these `contextual_data` members: `traffic_channel_surges`, `channel_breakdowns`, `device_shifts`, `user_mix_shifts`, `channel_pages`, `referrers`, `channel_campaigns`, `search_query_shifts`, `search_clicks`, `recent_content_momentum` and `top_pages`.
* `visits.current_period` and `visits.previous_period` are the visits in the 28 days that end on `endDate` and in the 28 days before them. `visits.current_week` and `visits.previous_week` are the same for 7 days.
* Each `top_pages` row has the names of its post's categories. A page that is not a post has none.
* In `channel_pages`, a landing page keeps only the names of `gclid`, `fbclid`, `msclkid` and `mc_cid` from its query string, without their values. Rows that become the same are summed into one row.
* `search_query_shifts` and `search_clicks` are absent when the user's request cannot read Search Console.
* Every count in the payload is an integer, never a float such as `12.0`.
* Two requests for the same dates over the same report data return the same `payload`, byte for byte.
* The encoded response carries the locale in member `10` and the payload in member `11`.
* With `trafficInsights` disabled, the response is the same as before, byte for byte, and the decoder still reads it.

## Implementation Brief

* [ ] <!-- One or more bullet points for how to technically implement the feature. Make sure to include changes to Storybook and visual regression tests where relevant. -->

### Test Coverage

* <!-- One or more bullet points for how to implement automated tests to verify the feature works. -->

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
