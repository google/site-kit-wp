# Benchmarking response — select the key factor cards and their attributes

## Feature Description

The Key factors section shows at most three **cards** ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2096-14304&m=dev)). Each card names one **driver** (a channel, a landing page, a search keyword, a referring site or a campaign) and up to two **attributes**: the values inside the driver that carried its change. Device and new-or-returning are only ever attributes. The wire format carries the cards in `keyFactors` (#13844), and this issue fills that field on the server.

Every count is a session, broken down by channel. A session has exactly one channel, landing page, source, campaign, device and visitor type, so the rows add up: a card's attributes are parts of the card, and the cards are parts of the line, which counts sessions too. Search Console adds each search keyword's clicks, with its pages and devices written in Analytics' terms, through `googlesitekit_benchmarking_contextual_data` (#13596).

A specific driver that changed enough replaces its channel, so the same visits never appear on two cards. Each card's share is a share of the site's growth or of its drop, whichever way the card moved. The reports behind the attributes run only for the cards that are kept. No card is chosen while the period before the selected one starts before `firstTrafficDate` (#13799): the site was not yet measured on those days, so every driver would look like growth.

A shared reader's response needs `sessionSource`, `landingPage` and `sessionCampaignName` among the shareable dimensions, which #13597 and #13843 add. This issue needs #13799.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1 (see "Report gathering", "Key factor scoring" and "Attribute selection")

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* With `typicalTraffic` enabled, the response for `startDate=2026-08-19` and `endDate=2026-09-15` carries `visits`, `dailyTraffic`, `firstTrafficDate` and `keyFactors`, and neither `dimensions` nor `contextualData`. Every count is in sessions, except a search keyword's clicks.
* The first call to Analytics runs five reports of sessions: by `date`, and by `sessionDefaultChannelGrouping` with `deviceCategory` and `newVsReturning`, with `sessionSource`, with `landingPage`, and with `sessionCampaignName`. No report by `pagePath`, by post date or by post categories is run.
* With these channels, and with `substack.com` going from `40` to `80` sessions and `news.example.com` from `110` to `120` inside `Referral`, `keyFactors` holds `substack.com` (`REFERRING_SITE`, `sharePct` `33.3`), `Direct` (`CHANNEL`, `41.7`) and `Organic Search` (`CHANNEL`, `16.7`), in that order, and no `Referral` card:

  | Channel | Previous | Current |
  | :---- | ---: | ---: |
  | `Organic Search` | 480 | 500 |
  | `Direct` | 250 | 300 |
  | `Referral` | 150 | 200 |
  | `Email` | 120 | 100 |

* On a site that grew, a card for a channel that fell has its share of the site's drop as its `sharePct`.
* Each card has at most two attributes, each `{ kind, label, current, previous, sharePct }`. A device or a visitor type whose rate of change is within 5 percentage points of the card's own rate is never an attribute.
* After the cards are chosen, the reports for their attributes run only for kept landing page, campaign and referring site cards, in at most two more calls, and in none when no such card is kept.
* `facebook.com`, `m.facebook.com`, `l.facebook.com`, `lm.facebook.com` and `fb` count as one referring site, `Facebook`.
* A value that is empty or in parentheses, such as `(not set)`, is never a card or an attribute, but its sessions still count toward its channel and the site.
* When Search Console has a property, search keyword cards and attributes count its clicks. When it has none, or its report fails, there is no `SEARCH_KEYWORD` card or attribute, and the rest of the response is the same.
* With a previous period that starts on `2026-07-22`, a `firstTrafficDate` of `2026-07-22` gives cards. A `firstTrafficDate` of `2026-07-23`, or of `null`, gives an empty `keyFactors`, and no Analytics call runs after the first.
* An error from any Analytics call is returned unchanged.
* The same report figures always give the same response, including the order of the cards and of their attributes.

## Implementation Brief

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Report_Options.php`:
  * Set `REPORT_ROW_LIMIT` to `250`.
  * In the private `get_dimension_options()`, count `sessions` instead of `totalUsers`, and order by `sessions`, descending.
  * In `get_daily_series_options()`, count `sessions` instead of `totalUsers` as well.
  * Change the docblocks that say a report counts visitors to say that it counts sessions.
  * Replace `get_channels_options()`, `get_devices_options()`, `get_visitor_mix_options()`, `get_referrers_options()`, `get_content_options()` and `get_categories_options()` with four methods, each with no dimension filter:

    | Method | Dimensions |
    | :---- | :---- |
    | `get_channel_breakdowns_options()` | `sessionDefaultChannelGrouping`, `deviceCategory`, `newVsReturning` |
    | `get_channel_sources_options()` | `sessionDefaultChannelGrouping`, `sessionSource` |
    | `get_channel_pages_options()` | `sessionDefaultChannelGrouping`, `landingPage` |
    | `get_channel_campaigns_options()` | `sessionDefaultChannelGrouping`, `sessionCampaignName` |

  * Add `get_driver_breakdown_options( $filter_dimension_name, array $filter_values, array $dimension_names )` for the reports that run after the cards are chosen. It returns `get_dimension_options( $dimension_names, array( $filter_dimension_name => $filter_values ) )`. `RequestHelpers::parse_dimension_filter()` turns a numeric array of values into an `inListFilter`.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Row_Scorer.php`:
  * Replace `DIMENSION_WEIGHTS` with `KIND_WEIGHTS`, keyed by card kind: `CONTENT` `1.5`, `SEARCH_KEYWORD` `1.4`, `REFERRING_SITE` `1.3`, `CAMPAIGN` `1.2`, `CHANNEL` `1.1`. `score_row( $kind, array $row )` reads it.
  * Change the constructor to `__construct( $sessions_current, $sessions_previous, $site_growth, $site_drop )`, and rename the two existing properties to match. `$site_growth` is the sum of every channel's `delta` above `0`, and `$site_drop` the sum of every channel's `delta` below `0`, as a positive number.
  * Change `is_excluded_row()` to `is_excluded_row( array $row )`. Remove the device and visitor mix check from it.
  * Make `get_self_change_percent()` public, for the attribute rule on devices and visitor types.
  * Change the docblock of `MACRO_DIVERGENCE_PERCENT`: a `DEVICE` or `USER_TYPE` attribute value counts only when its own change differs from the card's change by at least this many percentage points.
  * Add `SPECIFIC_DRIVER_MINIMUM_DELTA` (`10`), `SPECIFIC_DRIVER_MINIMUM_SHARE_PERCENT` (`15`) and `MAXIMUM_SHARE_PERCENT` (`100`).
  * Add `get_share_percent( array $row )`. It returns `abs( delta )` divided by `$site_growth` when the row rose, or by `$site_drop` when it fell, times `100`, held at `MAXIMUM_SHARE_PERCENT` at most, and rounded with `round( $value, Wire_Format::SHARE_DECIMAL_PLACES )` (added in #13844). It returns `0` when the row did not change, or when the growth or drop it divides by is `0`.
  * Add `passes_specific_driver_gate( $kind, array $row )`. It returns `true` for `CHANNEL`. For every other kind, it returns `true` only when `abs( delta )` is at least `SPECIFIC_DRIVER_MINIMUM_DELTA` and the rounded `get_share_percent()` is at least `SPECIFIC_DRIVER_MINIMUM_SHARE_PERCENT`.
  * Change the docblocks that say "visitors" to say "sessions".

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Key_Factor_Selector.php` (new file):
  * Add `Key_Factor_Selector`, following `Row_Scorer` for the file header and docblocks. It works only on plain arrays: no REST layer, no module and no reports.
  * Add these constants:
    * `MAXIMUM_KEY_FACTORS` (`3`), `MAXIMUM_ATTRIBUTES` (`2`) and `MINIMUM_ATTRIBUTE_DELTA` (`5`).
    * `REFERRING_SITE_CHANNELS`: `Referral` and `Organic Social`.
    * `JOINED_SOURCES`: `facebook.com`, `m.facebook.com`, `l.facebook.com`, `lm.facebook.com` and `fb`, each mapped to `Facebook`. A source is looked up in lowercase.
    * `CHANNEL_ATTRIBUTE_KINDS`, `DEFAULT_CHANNEL_ATTRIBUTE_KINDS` and `KIND_ATTRIBUTE_KINDS`, with the attribute kinds each card may show, in order:

      | Constant | Card | Attribute kinds |
      | :---- | :---- | :---- |
      | `CHANNEL_ATTRIBUTE_KINDS` | `Organic Search` | `SEARCH_KEYWORD`, `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
      | `CHANNEL_ATTRIBUTE_KINDS` | `Direct` | `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
      | `CHANNEL_ATTRIBUTE_KINDS` | `Referral` | `REFERRING_SITE`, `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
      | `CHANNEL_ATTRIBUTE_KINDS` | `Organic Social` | `REFERRING_SITE`, `CAMPAIGN`, `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
      | `CHANNEL_ATTRIBUTE_KINDS` | `Paid Search`, `Paid Social`, `Paid Shopping`, `Paid Video`, `Paid Other`, `Display`, `Cross-network` | `CAMPAIGN`, `PLATFORM`, `USER_TYPE`, `LANDING_PAGE`, `DEVICE` |
      | `CHANNEL_ATTRIBUTE_KINDS` | `Email` | `CAMPAIGN`, `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
      | `CHANNEL_ATTRIBUTE_KINDS` | `Organic Video` | `PLATFORM`, `LANDING_PAGE`, `DEVICE` |
      | `CHANNEL_ATTRIBUTE_KINDS` | `Unassigned` | `LANDING_PAGE` |
      | `DEFAULT_CHANNEL_ATTRIBUTE_KINDS` | any other channel | `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
      | `KIND_ATTRIBUTE_KINDS` | `CONTENT` | `TRAFFIC_CHANNEL`, `SEARCH_KEYWORD`, `USER_TYPE`, `DEVICE`, `REFERRING_SITE` |
      | `KIND_ATTRIBUTE_KINDS` | `CAMPAIGN` | `TRAFFIC_CHANNEL`, `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
      | `KIND_ATTRIBUTE_KINDS` | `REFERRING_SITE` | `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
      | `KIND_ATTRIBUTE_KINDS` | `SEARCH_KEYWORD` | `LANDING_PAGE`, `DEVICE` |

  * `__construct( array $contextual_data )` takes the validated contextual data. A key that is missing has no rows. The constructor:
    * Adds up the `channelBreakdowns` rows of each window into the site's sessions, and into each channel's sessions.
    * Works out the site's growth and drop from every channel's change, including a channel whose name is a placeholder.
    * Creates the `Row_Scorer` that every other method uses.
  * A private `is_placeholder( $value )` returns `true` for an empty string, and for a value that starts with `(` and ends with `)`.
  * A private `join_source( $source )` returns `JOINED_SOURCES[ strtolower( $source ) ]`, or the source unchanged when it is not in the list.
  * `get_key_factors()` returns at most `MAXIMUM_KEY_FACTORS` cards, each `array( 'kind', 'label', 'current', 'previous', 'sharePct' )`. A `REFERRING_SITE` card also has `sourceValues`: the raw sources it was joined from, in the order they were first read. The method does these steps, in order:
    * Build the candidates, and skip every placeholder value:
      * `CHANNEL`: each `channel` of `channelBreakdowns`, with the channel's sessions.
      * `CONTENT`: each `page` of `channelPages`, summed over every channel.
      * `CAMPAIGN`: each `campaign` of `channelCampaigns`, summed over every channel.
      * `REFERRING_SITE`: each joined `source` of the `channelSources` rows whose `channel` is in `REFERRING_SITE_CHANNELS`, summed over those two channels.
      * `SEARCH_KEYWORD`: each `keyword` of `searchKeywords`.
    * For each `CONTENT`, `CAMPAIGN` and `REFERRING_SITE` candidate, also keep its sessions in each channel, so the next steps can find its parent.
    * Drop each candidate that `Row_Scorer::is_excluded_row()` excludes, and then each candidate that `Row_Scorer::passes_specific_driver_gate()` does not pass.
    * Remove the parent channel of every candidate that is not a `CHANNEL`. A `SEARCH_KEYWORD`'s parent is `Organic Search`. The parent of any other kind is the channel whose change for that candidate is the largest in the candidate's own direction. When two channels changed by the same amount, the parent is the one that comes first by `strcmp()`.
    * Sort the candidates by `Row_Scorer::score_row()`, highest first, and keep the first `MAXIMUM_KEY_FACTORS`. Order two equal scores by `Wire_Format::KEY_FACTOR_KINDS[ $kind ]` (added in #13844), lowest first, and then with `strcmp()` on the label. Write these tie-breaks into the `usort()` callback, because `usort()` is not stable on PHP 7.4.
    * Give each card its `sharePct` from `Row_Scorer::get_share_percent()`.
  * `get_attributes( array $card, array $driver_rows )` returns the card's attributes, at most `MAXIMUM_ATTRIBUTES`, each `array( 'kind', 'label', 'current', 'previous', 'sharePct' )`:
    * `$driver_rows` holds the rows of the reports that ran for this card after the cards were chosen. Its keys are `driverBreakdowns` (`device`, `userType`, `current`, `previous`), `driverSources` (`channel`, `source`, `current`, `previous`) and `driverPages` (`page`, `current`, `previous`). It is an empty array for a `CHANNEL` or a `SEARCH_KEYWORD` card.
    * Take the card's list of kinds from `CHANNEL_ATTRIBUTE_KINDS`, `DEFAULT_CHANNEL_ATTRIBUTE_KINDS` or `KIND_ATTRIBUTE_KINDS`.
    * For each kind in the list, read the values from these rows. Add up the rows that have the same value, and join every source with `join_source()` first:

      | Card | Attribute kind | Values from |
      | :---- | :---- | :---- |
      | `CHANNEL` | `SEARCH_KEYWORD` | `searchKeywords`, by `keyword` |
      | `CHANNEL` | `LANDING_PAGE` | the card's channel's `channelPages` rows, by `page` |
      | `CHANNEL` | `REFERRING_SITE`, `PLATFORM` | the card's channel's `channelSources` rows, by `source` |
      | `CHANNEL` | `CAMPAIGN` | the card's channel's `channelCampaigns` rows, by `campaign` |
      | `CHANNEL` | `USER_TYPE`, `DEVICE` | the card's channel's `channelBreakdowns` rows, by `userType` or by `device` |
      | `CONTENT` | `TRAFFIC_CHANNEL` | the card's page's `channelPages` rows, by `channel` |
      | `CONTENT` | `SEARCH_KEYWORD` | the card's page's `searchKeywordPages` rows, by `keyword` |
      | `CONTENT` | `REFERRING_SITE` | the `driverSources` rows in `REFERRING_SITE_CHANNELS`, by `source` |
      | `CAMPAIGN` | `TRAFFIC_CHANNEL` | the card's campaign's `channelCampaigns` rows, by `channel` |
      | `CAMPAIGN`, `REFERRING_SITE` | `LANDING_PAGE` | `driverPages`, by `page` |
      | `CONTENT`, `CAMPAIGN`, `REFERRING_SITE` | `USER_TYPE`, `DEVICE` | `driverBreakdowns`, by `userType` or by `device` |
      | `SEARCH_KEYWORD` | `LANDING_PAGE` | the card's keyword's `searchKeywordPages` rows, by `page` |
      | `SEARCH_KEYWORD` | `DEVICE` | the card's keyword's `searchKeywordDevices` rows, by `device` |

    * Keep only the values that moved in the card's own direction by at least `MINIMUM_ATTRIBUTE_DELTA` and are not placeholders. For `DEVICE` and `USER_TYPE`, also keep only the values whose `Row_Scorer::get_self_change_percent()` differs from the card's by at least `MACRO_DIVERGENCE_PERCENT`.
    * For each kind, the value with the largest `abs( delta )` represents it, with two equal changes ordered by `strcmp()` on the label. Keep the two kinds whose representatives have the largest `abs( delta )`, with two equal changes ordered by the kind's position in the card's list. Write these tie-breaks into the `usort()` callbacks. A kind with no value left is skipped. Give each attribute its `sharePct` from `Row_Scorer::get_share_percent()`.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Contextual_Data_Validator.php`:
  * Key `ROW_FIELDS` by the seven contextual-data keys, with these fields. Type the text fields as `string`, and `current` and `previous` as `count`:

    | Key | Fields |
    | :---- | :---- |
    | `channelBreakdowns` | `channel`, `device`, `userType`, `current`, `previous` |
    | `channelSources` | `channel`, `source`, `current`, `previous` |
    | `channelPages` | `channel`, `page`, `current`, `previous` |
    | `channelCampaigns` | `channel`, `campaign`, `current`, `previous` |
    | `searchKeywords` | `keyword`, `current`, `previous` |
    | `searchKeywordPages` | `keyword`, `page`, `current`, `previous` |
    | `searchKeywordDevices` | `keyword`, `device`, `current`, `previous` |

  * Remove the `position` type from `validate_row()`.
  * In `validate()`, walk the keys of `ROW_FIELDS` instead of `Wire_Format::CONTEXTUAL_DATA_KEYS`. After dropping the rows that are not valid, keep the first `Report_Options::REPORT_ROW_LIMIT` rows of each key.
  * Update the docblocks to name the seven keys.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Builder.php`:
  * Remove the `Custom_Dimensions_Data_Available` constructor parameter, its property, its `use` statement and the `MAX_ROWS_PER_DIMENSION` constant. Remove `rank_contextual_data()`, `get_response_row()` and `build_content_rows()`.
  * In `get_report_requests()`, stop reading `Custom_Dimensions_Data_Available`, and return the daily series and the four breakdowns under the keys `dailyTraffic`, `channelBreakdowns`, `channelSources`, `channelPages` and `channelCampaigns`.
  * In `get_report_rows()`, rename the `visitors` key of each row to `count`. Read `count` in `get_daily_series()` (#13600) and in `pair_periods()`.
  * Change `pair_periods()` to pair the two windows by all of a row's dimension values, not only by the first value.
  * Change `build_contextual_data()` to build the four Analytics keys from the paired rows, with the fields in the `Contextual_Data_Validator` table above, in the order of each report's dimensions.
  * In `filter_contextual_data()`, rewrite its own docblock and the filter's docblock for the seven keys and their row fields, and remove the filter docblock's sentence about ranking and the cap of 5 rows.
  * Add a private `get_key_factors( Report_Options $report_options, array $contextual_data )`, which returns the cards or a `WP_Error`:
    * Create a `Key_Factor_Selector` from the filtered contextual data, and call `get_key_factors()`.
    * For each `CONTENT`, `CAMPAIGN` and `REFERRING_SITE` card, add two requests from `Report_Options::get_driver_breakdown_options()`:

      | Card | Filter | `driverBreakdowns` dimensions | Second report |
      | :---- | :---- | :---- | :---- |
      | `CONTENT` | `landingPage`, the card's `label` | `deviceCategory`, `newVsReturning` | `driverSources`: `sessionDefaultChannelGrouping`, `sessionSource` |
      | `CAMPAIGN` | `sessionCampaignName`, the card's `label` | `deviceCategory`, `newVsReturning` | `driverPages`: `landingPage` |
      | `REFERRING_SITE` | `sessionSource`, the card's `sourceValues` | `deviceCategory`, `newVsReturning` | `driverPages`: `landingPage` |

    * Run the requests through `run_reports()` only when there is at least one. Return a `WP_Error` from that call unchanged.
    * Pair each report's windows with `pair_periods()`, name the fields as `Key_Factor_Selector::get_attributes()` expects them, and set each card's `attributes` from `get_attributes()`. Call `get_attributes()` with an empty array for a `CHANNEL` or a `SEARCH_KEYWORD` card.
    * Remove `sourceValues` from each card.
  * In `build()`, before the cards are chosen, compare the `startDate` of `Report_Options::get_compare_range()` with the `firstTrafficDate` that `get_first_traffic_date()` (added in #13799) finds. When `firstTrafficDate` is `null`, or the compare range's `startDate` is earlier than it, set `keyFactors` to an empty array and do not call `get_key_factors()`. Both are `YYYY-MM-DD` strings, so compare them as strings. Otherwise set `keyFactors` from `get_key_factors()`.
  * In `build()`, return `visits`, `dailyTraffic`, `firstTrafficDate` and `keyFactors`, and update its `@return` description: `visits` and each `dailyTraffic` row's `visits` count sessions, and `keyFactors` is empty while the compare period starts before `firstTrafficDate`. Say the same about sessions in the docblocks of `get_daily_series()` and of `sum_visits()`.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Wire_Format.php`:
  * Remove `DIMENSION_INDEXES` and `CONTEXTUAL_DATA_KEYS`. After the changes above, no class reads them.

* [ ] In `includes/Modules/Analytics_4/Datapoints/Get_Benchmarking_Data.php`:
  * Create `Response_Builder` with `$definition['module']` only.

* [ ] In `includes/Modules/Analytics_4.php`:
  * Remove `custom_dimensions_data_available` from the `GET:benchmarking-data` definition in `get_datapoint_definitions()`.

* [ ] In `includes/Modules/Search_Console/Benchmarking/Report_Options.php`:
  * Replace `get_search_query_requests()` with `get_search_keyword_requests()`. It returns six requests, one for each window of each of the dimensions `query`, `query,page` and `query,device`. Their identifiers are `keywords_current`, `keywords_previous`, `keyword_pages_current`, `keyword_pages_previous`, `keyword_devices_current` and `keyword_devices_previous`.

* [ ] In `includes/Modules/Search_Console/Benchmarking/Report_Data_Builder.php`:
  * Replace `build_search_query_rows()` with `build_search_keyword_rows( array $args )`. It runs the six requests in one `searchanalytics-batch` call, and returns `array( 'searchKeywords' => …, 'searchKeywordPages' => …, 'searchKeywordDevices' => … )`, with the row fields in the `Contextual_Data_Validator` table above.
  * Count `(int) $report_row->getClicks()`, and stop reading the position.
  * Write a page as `wp_parse_url( $page, PHP_URL_PATH )`, or `/` when the URL has no path. Write a device with `strtolower()`.
  * Pair each key's two windows by all of the row's values after the page and the device are converted. Add up the rows that become the same, for example two URLs of one page with different query strings.
  * Return an empty array when the batch call fails, or when any of the six requests fails.

* [ ] In `includes/Modules/Search_Console.php`:
  * Rename `add_search_query_rows()` to `add_search_keyword_rows()`, and update the `add_filter()` call in `register()`.
  * Add every key `build_search_keyword_rows()` returns to the contextual data, and update its docblock.

Encoding `keyFactors` is #13844. `sessionSource` is added to the dimensions a shared report may use in #13597, and `landingPage` and `sessionCampaignName` in #13843.

### Test Coverage

* Update `build_report()` in `tests/phpunit/includes/Fake_Benchmarking_Reports_Trait.php`:
  * Key `$report_rows` by the dimension names the request asks for, joined with commas, such as `sessionDefaultChannelGrouping,landingPage`, instead of by the first name only. The `dateRange` the fake adds is not part of the key.
  * Let a key hold a callable that receives the report request and returns the rows, so a test can return different rows for two reports with the same dimensions and different filters.
  * Name the metric header `sessions`.
  * Remove the copy of `build_report()` from `Response_BuilderTest.php`, so that both test classes use the trait's.
* Update `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Report_OptionsTest.php` covering:
  * Each of the four breakdowns counts `sessions`, carries both windows, has the dimensions in the table and asks for 250 rows.
  * The daily series counts `sessions` by `date`, from 364 days before the period's first day to its last day. Change the `get_daily_series_options()` tests to expect `sessions`, and say sessions rather than visitors in their names and messages.
  * `get_driver_breakdown_options()` adds an in-list filter on the dimension it is given.
  * Remove the cases for the six removed methods.
* Update `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Row_ScorerTest.php` for the new constructor, covering:
  * Scores use the weights by kind.
  * `is_excluded_row()` keeps a row whose own change is within `MACRO_DIVERGENCE_PERCENT` points of the site's change.
  * `get_share_percent()` divides by the site's growth for a rise and by the site's drop for a fall, stops at `100`, rounds to one decimal, and returns `0` when it would divide by `0`.
  * `passes_specific_driver_gate()` passes a channel of any size. It passes a landing page at exactly `10` sessions and `15%`, and fails it at `9` sessions or at `14.9%`.
* Add `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Key_Factor_SelectorTest.php`, driven by plain contextual-data arrays, covering:
  * The four channels in the acceptance criteria, with `substack.com` and `news.example.com` inside `Referral`, give `substack.com`, `Direct` and `Organic Search`, in that order, with shares of `33.3`, `41.7` and `16.7`, and no `Referral` card.
  * On a site that grew, a channel card that fell has its share of the site's drop as its `sharePct`, not a share of the site's growth.
  * A search keyword that passes the gate removes `Organic Search`. A landing page's parent is the channel whose change for it is the largest in its direction, and two channels with the same change give the parent that comes first by name.
  * `Facebook.com`, `m.facebook.com` and `fb` are counted as one `Facebook` referring site, whose `sourceValues` lists all three. A source that has sessions only in a paid channel is not a referring site.
  * A placeholder value is never a card and never an attribute, but its sessions still count toward its channel's sessions and the site's sessions.
  * Two candidates with the same score, and two attribute kinds with the same change, come back in the same order on every run.
  * For each card kind, the attributes come from the rows in the brief's table, and only the kinds in the card's list appear.
  * A value that moved against the card, or by less than `5`, does not count. A device that changed at almost the card's own rate does not count. The two kinds with the largest changes are kept, and a card can have one attribute or none.
  * Contextual data with no candidate left gives an empty list.
* Update `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_BuilderTest.php` covering:
  * Five reports run in one call, and none of the removed reports runs, with or without data in the post date and post categories dimensions.
  * Rows are paired by all of their dimension values.
  * The reports after the cards are chosen run only for kept landing page, campaign and referring site cards, filtered to the card's driver. A `Facebook` card's filter lists every raw source it was joined from. Three such cards take two calls, and channel and search keyword cards take none.
  * A `WP_Error` from the first call, and one from a later call, is returned unchanged.
  * The response carries `visits`, `dailyTraffic`, `firstTrafficDate` and `keyFactors`, and neither `dimensions` nor `contextualData`. Building it twice from the same report rows gives the same response.
  * For `2026-08-19` to `2026-09-15`, with daily rows that make `firstTrafficDate` `2026-07-22`, the cards are chosen. With rows that make it `2026-07-23`, `keyFactors` is empty, only the first Analytics call runs, and `visits` and `dailyTraffic` are the same as with `2026-07-22`. With visits on `2026-07-22` only, before the selected period, the cards are chosen. With no visits at all, `keyFactors` is empty.
  * The daily report asks for `sessions` by `date`, and `dailyTraffic` and the two `visits` totals are read from its rows.
  * Make `test_build__does_not_return_a_number_with_decimals` also allow each `sharePct`, and assert that it has at most one decimal.
  * Remove the `Custom_Dimensions_Data_Available` setup and these cases: every `test_rank_contextual_data__…` case, `test_build__keeps_the_5_highest_scoring_of_40_rows_a_callback_adds_and_orders_their_dimension_by_the_sum_of_their_scores`, and the five content row cases, from `test_build__builds_a_content_row_for_each_post_with_its_age` to `test_build__reports_a_post_dated_after_the_end_date_as_published_0_days_ago`.
* Update `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Contextual_Data_ValidatorTest.php` for the seven keys and their fields, the limit of 250 rows per key, and the removed `position` type.
* Update `tests/phpunit/integration/Modules/Search_Console/Benchmarking/Report_OptionsTest.php` and `Report_Data_BuilderTest.php` covering:
  * The six requests and their identifiers.
  * The three keys, counting clicks.
  * `https://example.com/garlic/` becomes `/garlic/`, two URLs of one page with different query strings become one row, and `https://example.com` becomes `/`.
  * `MOBILE` becomes `mobile`.
  * An empty array when the batch call fails, and when one of the six requests fails.
* Update the benchmarking cases in `tests/phpunit/integration/Modules/Search_ConsoleTest.php` for `add_search_keyword_rows()` and the three keys.
* Update `tests/phpunit/integration/Modules/Analytics_4/Datapoints/Get_Benchmarking_DataTest.php`:
  * Create the recording builder's parent without `Custom_Dimensions_Data_Available`.
  * In `test_rest_endpoint__answers_a_view_only_reader_with_the_response_the_owner_gets`, give the shared dashboard rows that keep at least one landing page, campaign or referring site card. Assert that the datapoint runs every Analytics call, the first one and the later ones, under the module owner's token, that the builder has the seven contextual-data keys, and that the response carries the cards.
  * In `test_rest_endpoint__builds_every_dimension_except_the_search_queries_for_a_view_only_reader_without_search_console_shared` (#13844), expect the four Analytics keys and none of the three Search Console keys, and no `SEARCH_KEYWORD` card or attribute in the response.
* No Storybook story is required, because the change adds no UI.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
