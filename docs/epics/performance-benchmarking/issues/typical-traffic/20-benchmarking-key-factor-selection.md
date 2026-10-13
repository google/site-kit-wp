# Benchmarking response — select the key factor cards and their attributes

## Feature Description

The benchmarking response builder (#13595) runs seven Analytics reports, one per dimension: channel, device, new against returning, referring source, page path and post category, each counting visitors (`totalUsers`). Search Console adds its search queries through the `googlesitekit_benchmarking_contextual_data` filter (#13596). The builder then ranks the rows of each dimension, keeps five per dimension, and orders the dimensions.

The design for the Key factors section has changed ([Figma](https://www.figma.com/design/MWN8TXAjfTeKLF0DZ91bIX/Performance-benchmarking?node-id=2096-14304&m=dev)). The section shows at most three **cards**. Each card names one **driver**: a channel, a landing page, a search keyword, a referring site or a campaign. Each card has at most two **attributes**: the values inside the driver that carried its change, such as the referring site behind a `Referral` card, or the device behind a `Direct` card. Device and new-or-returning are never cards. They are only attributes. Post categories are not part of the section at all. The wire format carries these cards in the response's `keyFactors` field (#13844). This issue fills that field.

**The reports count sessions, and they are broken down by channel.** A session — what the card calls a visit — has exactly one channel, one landing page, one source, one campaign, one device and one visitor type. So the rows of a sessions report always add up: a landing page's sessions are the sum of its rows across channels, and a card's attributes are parts of the card. Visitors do not add up this way, because one visitor can arrive through two channels. Four reports, each keyed on the channel, replace the six dimension reports. Together with the daily series they are five reports, which is one Analytics call. The daily series still counts visitors, because the chart plots visitors.

**Choosing the cards.** Every channel, landing page, campaign, referring site and search keyword is a candidate. Each one is scored with the formula the builder already uses, now measured against the site's sessions. A weight is set for each kind of driver, so a specific driver beats a broad one with the same change. The significance floor and the counter-trend filter drop the candidates that moved too little, as they do today. Then two new rules apply:

* **A specific driver must clear a gate.** A landing page, search keyword, referring site or campaign stays a candidate only if it changed by at least 10 sessions and accounts for at least 15% of the site's change in the same direction. Below that, its change is a small part of its channel's change, and the channel is the better thing to name.
* **A specific driver that clears the gate replaces its channel.** The channel is no longer a candidate, so the same visits are never shown on two cards.

The three candidates with the highest scores become the cards.

**The share each card shows** is measured against the site's change in the card's own direction. The site's growth is the sum of the increases of every channel that rose. The site's drop is the sum of the decreases of every channel that fell. So a channel that fell on a site that grew shows its share of everything the site lost, for example `71.4% of traffic drop`. It does not show a negative share of the site's net growth.

For example, a site's sessions rose from 1,000 to 1,100:

| Channel | Previous | Current | Change |
| :---- | ---: | ---: | ---: |
| `Organic Search` | 480 | 500 | +20 |
| `Direct` | 250 | 300 | +50 |
| `Referral` | 150 | 200 | +50 |
| `Email` | 120 | 100 | −20 |

The site's growth is 120 sessions and its drop is 20. Inside `Referral`, `substack.com` went from 40 to 80 sessions, so it changed by 40 and accounts for 33.3% of the site's growth. That clears the gate, so `substack.com` becomes a candidate and `Referral` stops being one. `news.example.com` went from 110 to 120, which is 8.3% of the growth, so it does not clear the gate. The scores put `substack.com` first (5.67), `Direct` second (5.00), `Organic Search` third (2.90) and `Email` fourth (2.48). The response therefore carries three cards: `substack.com` with 33.3%, `Direct` with 41.7% and `Organic Search` with 16.7% of the site's growth. `Referral` would have scored 5.50, but it is not a card because `substack.com` already shows its visits.

**Choosing each card's attributes.** Each card has a list of attribute kinds it may show, decided by its driver. For a channel card, the list also depends on which channel it is: an `Organic Search` card may show a search keyword, and a paid channel card may show a campaign. For each kind in the list, the builder finds the value that moved the most in the card's own direction. A value must move by at least 5 sessions to count. A device or a visitor type must also move at a rate that differs from the card's own rate by at least 5 percentage points. Otherwise it only repeats the card's change and explains nothing more. The card keeps the two kinds whose values moved the most.

**A second pass for the attributes the first reports cannot give.** A channel card finds all of its attributes in the four breakdowns, and a search keyword card finds them in Search Console's rows. A landing page, campaign or referring site card needs a device, a visitor type, a landing page or a referring site broken down for that one driver. Those reports are run only for the cards that were kept — at most six reports in at most two more calls, and none at all when no kept card needs them.

**Search Console's rows are written in Analytics' terms.** Search Console now adds three sets of rows instead of one: each query's clicks, the same clicks by page, and the same clicks by device. A page is written as a path, the same form as Analytics' landing page, so a landing-page card can find its keywords. A device is written as Analytics' lowercase device name. Search keywords count clicks, not sessions, and the average position is no longer reported.

**Facebook's source names are joined.** `facebook.com`, `m.facebook.com`, `l.facebook.com`, `lm.facebook.com` and `fb` all mean visits from Facebook. They are joined into one referring site named `Facebook` before anything is added up, so a surge split across them counts as one referring site and not five small ones.

A shared reader's response needs `sessionSource`, `landingPage` and `sessionCampaignName` among the dimensions a shared Analytics report may use. #13597 adds `sessionSource`, and #13843 adds the other two. Encoding `keyFactors` is #13844.

Link to the design doc: https://docs.google.com/document/d/1dsEs6-NjlP_LNqz5md5fnJMuxh9Vd9f88w4DTrZdLok/edit?tab=t.y7e2u5h52vf1

---------------

_Do not alter or remove anything below. The following sections will be managed by moderators only._

## Acceptance criteria

* For a request with `startDate=2026-08-19` and `endDate=2026-09-15`, the assembled response carries `visitors`, `dailyTraffic` and `keyFactors`, and carries neither `dimensions` nor `contextualData`. `visitors` and `dailyTraffic` are unchanged.
* Before any card is chosen, five Analytics reports are run in one call:

  | Report | Windows |
  | :---- | :---- |
  | `totalUsers` by `date`, as today | as today |
  | `sessions` by `sessionDefaultChannelGrouping`, `deviceCategory` and `newVsReturning` | selected and comparison, at most 250 rows |
  | `sessions` by `sessionDefaultChannelGrouping` and `sessionSource` | selected and comparison, at most 250 rows |
  | `sessions` by `sessionDefaultChannelGrouping` and `landingPage` | selected and comparison, at most 250 rows |
  | `sessions` by `sessionDefaultChannelGrouping` and `sessionCampaignName` | selected and comparison, at most 250 rows |

* No report by `pagePath`, by `deviceCategory` alone, by `newVsReturning` alone, by `sessionSource` alone, by `customEvent:googlesitekit_post_date` or by `customEvent:googlesitekit_post_categories` is run, whether or not those custom dimensions have data.
* When Search Console has a property, it adds three keys to the contextual data through `googlesitekit_benchmarking_contextual_data`, from one `searchanalytics-batch` call, each with at most 250 rows per window:

  | Key | Row |
  | :---- | :---- |
  | `searchKeywords` | `{ keyword, current, previous }`, clicks |
  | `searchKeywordPages` | `{ keyword, page, current, previous }`, clicks, with `page` the path of the page's URL: `https://example.com/garlic/` becomes `/garlic/` |
  | `searchKeywordDevices` | `{ keyword, device, current, previous }`, clicks, with `device` in lowercase: `MOBILE` becomes `mobile` |

* When Search Console has no property, or its report fails, it adds none of the three keys. The response then has no `SEARCH_KEYWORD` card and no `SEARCH_KEYWORD` attribute, and the rest of the response is built as it would be otherwise.
* A row's two windows are paired by all of its dimension values. A row present in one window only is paired with `0` for the other.
* The candidates are:
  * each channel, with its sessions summed over every `sessionDefaultChannelGrouping`, `deviceCategory` and `newVsReturning` row of that channel;
  * each landing page, and each campaign, with its sessions summed over every channel;
  * each referring site: a source with sessions in `Referral` or `Organic Social`, summed over those two channels only;
  * each search keyword, counted in clicks.
* The sources `facebook.com`, `m.facebook.com`, `l.facebook.com`, `lm.facebook.com` and `fb`, in any letter case, are counted together as one source labelled `Facebook`, both as a candidate and as an attribute value.
* A value that is empty, or that starts with `(` and ends with `)` — such as `(not set)`, `(direct)`, `(organic)` and `(referral)` — is never a card and never an attribute. Its sessions still count toward its channel's total and the site's totals.
* The site's session totals are the sums of the `sessionDefaultChannelGrouping`, `deviceCategory` and `newVsReturning` rows in each window. Every candidate is scored with the existing formula, with these site totals in place of the visitor totals:

  | Term | Value |
  | :---- | :---- |
  | `delta` | `current - previous` |
  | `trafficImpactPct` | `delta / MAX( sessions.previous, sessions.current ) * 100` |
  | `selfChangePct` | `delta / previous * 100`, or `100` when `previous` is `0` and `current` is above `0` |
  | `siteGrowthRate` | `( sessions.current - sessions.previous ) / sessions.previous` |
  | `excessImpactPct` | `( delta - previous * siteGrowthRate ) / MAX( sessions.previous, sessions.current ) * 100` |
  | `score` | `( 0.6 * ABS( trafficImpactPct ) + 0.4 * ABS( excessImpactPct ) ) * weight * boost` |

* `weight` is `1.5` for a landing page, `1.4` for a search keyword, `1.3` for a referring site, `1.2` for a campaign and `1.1` for a channel. `boost` is `1.25` when a candidate moved in the same direction as the site and `1.0` otherwise. The site's direction is `UP` when its sessions rose by at least `3%`, `DOWN` when they fell by `3%` or more, and `STABLE` between them.
* A candidate is dropped when either of these holds:
  * `ABS( delta ) < 5`, or `ABS( trafficImpactPct ) < 0.40`.
  * Its direction is the opposite of the site's direction, and it clears neither `ABS( trafficImpactPct ) >= 1.0` nor both of `ABS( selfChangePct ) >= 10` and `ABS( delta ) >= 25`.
* A candidate's `sharePct` is `ABS( delta )` divided by the site's growth when the candidate rose, or by the site's drop when it fell, times `100`, held at `100` at most and rounded to one decimal. The site's growth is the sum of every channel's `delta` above `0`. The site's drop is the sum of every channel's `delta` below `0`, as a positive number. When that sum is `0`, `sharePct` is `0`.
* A landing page, search keyword, referring site or campaign is dropped unless `ABS( delta ) >= 10` and `sharePct >= 15`. A channel has no such gate.
* A landing page, search keyword, referring site or campaign that is not dropped removes its parent channel from the candidates. A search keyword's parent is `Organic Search`. A landing page's, campaign's or referring site's parent is the channel whose row for it changed the most in its own direction. Two channels with the same change are ordered by name, and the first one is the parent.
* `keyFactors` holds the three remaining candidates with the highest scores, highest first, each `{ kind, label, current, previous, sharePct, attributes }`. Two candidates with the same score are ordered by kind — `CHANNEL`, `CONTENT`, `SEARCH_KEYWORD`, `REFERRING_SITE`, `CAMPAIGN` — and then by label. When fewer than three remain, `keyFactors` holds those; when none remain, it is empty.
* For the four channels in the description's example, with `substack.com` from `40` to `80` sessions and `news.example.com` from `110` to `120` sessions inside `Referral`, `keyFactors` holds `substack.com` (`REFERRING_SITE`, `sharePct` `33.3`), `Direct` (`CHANNEL`, `41.7`) and `Organic Search` (`CHANNEL`, `16.7`), in that order, and no `Referral` card.
* A card may show these attribute kinds, listed in order:

  | Card | Attribute kinds |
  | :---- | :---- |
  | `Organic Search` | `SEARCH_KEYWORD`, `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
  | `Direct` | `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
  | `Referral` | `REFERRING_SITE`, `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
  | `Organic Social` | `REFERRING_SITE`, `CAMPAIGN`, `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
  | `Paid Search`, `Paid Social`, `Paid Shopping`, `Paid Video`, `Paid Other`, `Display`, `Cross-network` | `CAMPAIGN`, `PLATFORM`, `USER_TYPE`, `LANDING_PAGE`, `DEVICE` |
  | `Email` | `CAMPAIGN`, `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
  | `Organic Video` | `PLATFORM`, `LANDING_PAGE`, `DEVICE` |
  | `Unassigned` | `LANDING_PAGE` |
  | any other channel | `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
  | a landing page | `TRAFFIC_CHANNEL`, `SEARCH_KEYWORD`, `USER_TYPE`, `DEVICE`, `REFERRING_SITE` |
  | a campaign | `TRAFFIC_CHANNEL`, `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
  | a referring site | `LANDING_PAGE`, `USER_TYPE`, `DEVICE` |
  | a search keyword | `LANDING_PAGE`, `DEVICE` |

* For each attribute kind a card may show, a value of that kind counts only when all of these hold:
  * It moved in the card's own direction by at least `5` (sessions, or clicks for a search keyword).
  * It is not empty and not a value in parentheses.
  * For `DEVICE` and `USER_TYPE`, its own `selfChangePct` differs from the card's `selfChangePct` by at least `5`.
* For each attribute kind, the value with the largest `ABS( delta )` that counts represents the kind; two values with the same change are ordered by label. A card's `attributes` are the two kinds whose representatives have the largest `ABS( delta )`, largest first, with two equal changes ordered by the kind's position in the card's list. Each is `{ kind, label, current, previous, sharePct }`, with `sharePct` worked out the same way as a card's. A kind with no value that counts is skipped, so a card can have one attribute or none.
* A `REFERRING_SITE` attribute only uses sources in `Referral` or `Organic Social`. A `PLATFORM` attribute uses the card's own channel's sources. A `USER_TYPE` attribute's label is the `newVsReturning` value, and a `DEVICE` attribute's label is the `deviceCategory` value.
* After the cards are chosen, more Analytics reports are run only for kept `CONTENT`, `CAMPAIGN` and `REFERRING_SITE` cards, each with both windows and at most 250 rows, and each filtered to the card's own driver:

  | Card | Reports |
  | :---- | :---- |
  | a landing page | `sessions` by `deviceCategory` and `newVsReturning`; `sessions` by `sessionDefaultChannelGrouping` and `sessionSource`; both filtered on `landingPage` |
  | a campaign | `sessions` by `deviceCategory` and `newVsReturning`; `sessions` by `landingPage`; both filtered on `sessionCampaignName` |
  | a referring site | `sessions` by `deviceCategory` and `newVsReturning`; `sessions` by `landingPage`; both filtered on every source the site was joined from |

  These reports take at most two calls, and none are run when no kept card is one of those three kinds.
* An error from any Analytics call, before or after the cards are chosen, is returned unchanged, with nothing assembled beside it.
* A contextual-data key a filter callback returns is kept only when it is one of `channelBreakdowns`, `channelSources`, `channelPages`, `channelCampaigns`, `searchKeywords`, `searchKeywordPages` and `searchKeywordDevices`. A row missing one of its key's fields, or with a field of the wrong type, is dropped, and each key keeps at most its first 250 rows.
* Building the response twice from the same report figures gives the same response, including the order of the cards and of their attributes, and every rounded number.

## Implementation Brief

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Report_Options.php`:
  * Set `REPORT_ROW_LIMIT` to `250`.
  * In the private `get_dimension_options()`, count `sessions` instead of `totalUsers`, and order by `sessions` descending.
  * Replace `get_channels_options()`, `get_devices_options()`, `get_visitor_mix_options()`, `get_referrers_options()`, `get_content_options()` and `get_categories_options()` with four methods, each with no dimension filter:

    | Method | Dimensions |
    | :---- | :---- |
    | `get_channel_breakdowns_options()` | `sessionDefaultChannelGrouping`, `deviceCategory`, `newVsReturning` |
    | `get_channel_sources_options()` | `sessionDefaultChannelGrouping`, `sessionSource` |
    | `get_channel_pages_options()` | `sessionDefaultChannelGrouping`, `landingPage` |
    | `get_channel_campaigns_options()` | `sessionDefaultChannelGrouping`, `sessionCampaignName` |

  * Add `get_driver_breakdown_options( $filter_dimension, array $filter_values, array $dimension_names )` for the second pass. It returns `get_dimension_options( $dimension_names, ... )` with an in-list filter on `$filter_dimension` set to `$filter_values`, which `RequestHelpers::parse_dimension_filter()` builds from a numeric array.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Row_Scorer.php`:
  * Replace `DIMENSION_WEIGHTS` with `KIND_WEIGHTS`: `CONTENT` `1.5`, `SEARCH_KEYWORD` `1.4`, `REFERRING_SITE` `1.3`, `CAMPAIGN` `1.2`, `CHANNEL` `1.1`.
  * Rename the constructor parameters to `$sessions_current` and `$sessions_previous`, and add `$site_gain` and `$site_loss`, the site's growth and drop from the acceptance criteria.
  * In `is_excluded_row()`, remove the macro-divergence check. Keep the significance floor and the counter-trend filter as they are.
  * Add `ELEVATION_MINIMUM_DELTA` (`10`), `ELEVATION_MINIMUM_SHARE_PERCENT` (`15`) and `MAXIMUM_SHARE_PERCENT` (`100`).
  * Add `get_share_percent( array $row )`, returning the `sharePct` in the acceptance criteria, rounded with `Wire_Format::SHARE_DECIMAL_PLACES`. It returns `0` when the divisor is `0`.
  * Add `passes_elevation_gate( $kind, array $row )`, which is `true` for a `CHANNEL` and otherwise applies the two thresholds.
  * Keep `MACRO_DIVERGENCE_PERCENT`. `Key_Factor_Selector` uses it for device and visitor-type attributes.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Key_Factor_Selector.php` (new file):
  * Add `Key_Factor_Selector`, with no dependency on the REST layer, the module or the reports, so PHPUnit can drive it from plain arrays.
  * Add the constants:
    * `MAXIMUM_KEY_FACTORS` (`3`) and `MAXIMUM_ATTRIBUTES` (`2`).
    * `REFERRING_SITE_CHANNELS`: `Referral`, `Organic Social`.
    * `JOINED_SOURCES`, mapping each lowercase source to the label it is joined into: `facebook.com`, `m.facebook.com`, `l.facebook.com`, `lm.facebook.com` and `fb` to `Facebook`.
    * `CHANNEL_ATTRIBUTE_KINDS`, mapping each channel name in the acceptance criteria's table to its list of attribute kinds, and `DEFAULT_CHANNEL_ATTRIBUTE_KINDS` for any other channel.
    * `KIND_ATTRIBUTE_KINDS`, mapping `CONTENT`, `CAMPAIGN`, `REFERRING_SITE` and `SEARCH_KEYWORD` to their lists.
  * Add `is_placeholder( $value )`, which is `true` for an empty string and for a value that starts with `(` and ends with `)`.
  * Add `select_key_factors( array $contextual_data )`. It returns the cards without attributes, each with its `kind`, `label`, `current`, `previous` and `sharePct`, plus an internal `sourceValues` list for a referring site: the raw sources it was joined from. In order, it:
    * Sums the candidates from the contextual-data keys, as the acceptance criteria describe. It joins sources with `JOINED_SOURCES`, compared in lowercase, and skips placeholder values.
    * Works out the site's session totals, growth and drop from `channelBreakdowns`, and creates a `Row_Scorer` with them.
    * Drops the rows `Row_Scorer::is_excluded_row()` rejects, and then the rows `Row_Scorer::passes_elevation_gate()` rejects.
    * Removes each parent channel of a remaining non-channel candidate.
    * Sorts the rest by `Row_Scorer::score_row()`, descending, and keeps `MAXIMUM_KEY_FACTORS`. It breaks ties explicitly by `Wire_Format::KEY_FACTOR_KINDS` order and then `strcmp()` on the label, because `usort()` is not stable on PHP 7.4.
  * Add `select_attributes( array $card, array $breakdowns )`. `$breakdowns` maps each attribute kind to its paired rows `{ label, current, previous }` for this card. It applies the rules in the acceptance criteria, and uses `MACRO_DIVERGENCE_PERCENT` for `DEVICE` and `USER_TYPE`. It returns at most `MAXIMUM_ATTRIBUTES` attributes, each with its `sharePct` from the same `Row_Scorer`.
  * Add `get_attribute_kinds( array $card )`, which returns the card's list from `CHANNEL_ATTRIBUTE_KINDS`, `DEFAULT_CHANNEL_ATTRIBUTE_KINDS` or `KIND_ATTRIBUTE_KINDS`.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Contextual_Data_Validator.php`:
  * Key `ROW_FIELDS` by the seven contextual-data keys, with the row fields from the acceptance criteria. Type `channel`, `device`, `userType`, `source`, `page`, `campaign` and `keyword` as `string`, and `current` and `previous` as `count`. Remove the `position` type.
  * In `validate()`, walk `ROW_FIELDS` instead of `Wire_Format::CONTEXTUAL_DATA_KEYS`, and keep at most `Report_Options::REPORT_ROW_LIMIT` rows for each key.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Response_Builder.php`:
  * Remove the `Custom_Dimensions_Data_Available` constructor parameter, its property and the `MAX_ROWS_PER_DIMENSION` constant.
  * In `get_report_requests()`, request the daily series and the four breakdowns from `Report_Options`, under the keys `dailyTraffic`, `channelBreakdowns`, `channelSources`, `channelPages` and `channelCampaigns`.
  * In `get_report_rows()`, read the first metric value of a row as its count, whatever the metric is.
  * In `pair_periods()`, key each pair on all of the row's dimension values, not only the first one.
  * Replace `build_contextual_data()` and `build_content_rows()` with code that builds the four Analytics keys with the row fields in the acceptance criteria.
  * Replace `rank_contextual_data()` and `get_response_row()` with a step that calls `Key_Factor_Selector::select_key_factors()` on the filtered contextual data. Then it runs the second-pass reports from `Report_Options::get_driver_breakdown_options()` for each kept `CONTENT`, `CAMPAIGN` and `REFERRING_SITE` card, through the existing `run_reports()`, in chunks of five. Last, it calls `Key_Factor_Selector::select_attributes()` for every card, with breakdowns built from the first-pass keys, Search Console's keys and the second-pass rows, as the acceptance criteria list them.
  * Return a `WP_Error` from a second-pass call unchanged.
  * Return `visitors`, `dailyTraffic` and `keyFactors`. Remove the internal `sourceValues` from each card before returning.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Wire_Format.php`:
  * Remove `DIMENSION_INDEXES` and `CONTEXTUAL_DATA_KEYS`, which nothing reads any more.

* [ ] In `includes/Modules/Analytics_4/Datapoints/Get_Benchmarking_Data.php`:
  * Create `Response_Builder` with the module only.

* [ ] In `includes/Modules/Analytics_4.php`:
  * Remove `custom_dimensions_data_available` from the `GET:benchmarking-data` definition in `get_datapoint_definitions()`.

* [ ] In `includes/Modules/Search_Console/Benchmarking/Report_Options.php`:
  * Replace `get_search_query_requests()` with `get_search_keyword_requests()`. It returns six requests, one per window for each of the dimensions `query`, `query,page` and `query,device`, with the identifiers `keywords_current`, `keywords_previous`, `keyword_pages_current`, `keyword_pages_previous`, `keyword_devices_current` and `keyword_devices_previous`.

* [ ] In `includes/Modules/Search_Console/Benchmarking/Report_Data_Builder.php`:
  * Replace `build_search_query_rows()` with `build_search_keyword_rows( array $args )`. It runs the six requests in one `searchanalytics-batch` call and returns `searchKeywords`, `searchKeywordPages` and `searchKeywordDevices`, pairing each set's two windows by all of the row's keys and counting `getClicks()`.
  * Write a page as `wp_parse_url( $page, PHP_URL_PATH )`, and a device with `strtolower()`.
  * Leave a key out when either of its two requests failed. Return an empty array when the whole batch failed.

* [ ] In `includes/Modules/Search_Console.php`:
  * Rename `add_search_query_rows()` to `add_search_keyword_rows()`, keep its property check, and merge every key `build_search_keyword_rows()` returns into the contextual data. Update the `add_filter()` call in `register()`.

Encoding `keyFactors` is #13844. `sessionSource` is added to the dimensions a shared report may use in #13597, and `landingPage` and `sessionCampaignName` in #13843.

### Test Coverage

* Update `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Report_OptionsTest.php` covering:
  * Each of the four breakdowns counts `sessions`, carries both windows, has the dimensions in the table and asks for 250 rows.
  * `get_driver_breakdown_options()` adds an in-list filter on the dimension it is given.
* Update `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Row_ScorerTest.php` covering:
  * Scores use the new weights by kind.
  * The macro-divergence check no longer drops anything.
  * `get_share_percent()` uses the site's growth for a rise and the site's drop for a fall, stops at `100`, rounds to one decimal, and returns `0` when the divisor is `0`.
  * `passes_elevation_gate()` lets through a channel at any size, and a landing page at exactly `10` sessions and `15%`, and drops it at `9` sessions or at `14.9%`.
* Add `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Key_Factor_SelectorTest.php`, driven from plain contextual-data arrays, covering:
  * The example in the acceptance criteria gives `substack.com`, `Direct` and `Organic Search`, with their shares, and no `Referral` card.
  * A search keyword that clears the gate removes `Organic Search`. A landing page's parent is the channel whose row changed the most in the page's direction.
  * The Facebook sources are joined into one referring site, and a source only in a paid channel is not a referring site.
  * Placeholder values are never a card or an attribute, but they still count toward channel totals.
  * Two candidates with the same score, and two attribute kinds with the same change, come back in the same order on every run.
  * Attributes: the card's list decides which kinds may appear; a value that moved against the card or by less than `5` does not count; a device that changed at nearly the card's own rate does not count; the two largest kinds are kept; and a card can have one attribute or none.
  * A site with no candidate left gives an empty list.
* Update `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Response_BuilderTest.php` covering:
  * Five reports are run in one call, and none of the removed reports is run.
  * Rows are paired by all of their dimension values.
  * Second-pass reports are run only for kept landing page, campaign and referring-site cards, and are filtered to the card's driver. No second-pass report is run when the cards are channels and search keywords.
  * A `WP_Error` from a second-pass call is returned unchanged.
  * The response carries `keyFactors` and neither `dimensions` nor `contextualData`, and building it twice from the same fixtures gives the same response.
  * Remove the cases that cover dimension ranking, caps and content rows.
* Update `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Contextual_Data_ValidatorTest.php` for the seven keys, the 250-row limit, and the removal of the `position` type.
* Update `tests/phpunit/integration/Modules/Search_Console/Benchmarking/Report_OptionsTest.php` and `Report_Data_BuilderTest.php` covering the six requests, the three keys, the conversion of a page URL to a path and of a device name to lowercase, and a key left out when one of its requests fails.
* Update the benchmarking cases in `tests/phpunit/integration/Modules/Search_ConsoleTest.php` and `tests/phpunit/integration/Modules/Analytics_4/Datapoints/Get_Benchmarking_DataTest.php` for the new keys and the new response, including the view-only cases from #13597:
  * Dispatched as a view-only user whose role has Analytics shared, the datapoint runs the five first-pass reports and any second-pass reports under the module owner's client.
  * With Analytics shared and Search Console not shared, the response carries no `SEARCH_KEYWORD` card and no `SEARCH_KEYWORD` attribute, in place of the case that asserts no `searchQueries` key and no `SEARCH_QUERIES` in `dimensions`.
* No Storybook story is required, because the change adds no UI.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
