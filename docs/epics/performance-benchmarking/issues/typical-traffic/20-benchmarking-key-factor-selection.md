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
  * In the private `get_dimension_options()`, count `sessions` instead of `totalUsers`, and order by `sessions`, descending. `get_daily_series_options()` keeps counting `totalUsers`.
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
  * Change the constructor to `__construct( $sessions_current, $sessions_previous, $site_growth, $site_drop )`, and rename the two existing properties to match. `$site_growth` and `$site_drop` are the site's growth and drop from the acceptance criteria, both positive numbers.
  * Change `is_excluded_row()` to `is_excluded_row( array $row )`. Remove the device and visitor mix check from it, and keep the significance floor and the counter-trend check as they are.
  * Make `get_self_change_percent()` public, for the attribute rule on devices and visitor types.
  * Keep `MACRO_DIVERGENCE_PERCENT`, and change its docblock: a `DEVICE` or `USER_TYPE` attribute value counts only when its own change differs from the card's change by at least this many percentage points.
  * Add `SPECIFIC_DRIVER_MINIMUM_DELTA` (`10`), `SPECIFIC_DRIVER_MINIMUM_SHARE_PERCENT` (`15`) and `MAXIMUM_SHARE_PERCENT` (`100`).
  * Add `get_share_percent( array $row )`. It returns the `sharePct` from the acceptance criteria, rounded with `round( $value, Wire_Format::SHARE_DECIMAL_PLACES )` (added in #13844). It returns `0` when the row did not change, or when the growth or drop it divides by is `0`.
  * Add `passes_specific_driver_gate( $kind, array $row )`. It returns `true` for `CHANNEL`. For every other kind, it returns `true` only when `abs( delta )` is at least `SPECIFIC_DRIVER_MINIMUM_DELTA` and the rounded `get_share_percent()` is at least `SPECIFIC_DRIVER_MINIMUM_SHARE_PERCENT`.
  * Change the docblocks that say "visitors" to say "sessions".

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Key_Factor_Selector.php` (new file):
  * Add `Key_Factor_Selector`, following `Row_Scorer` for the file header and docblocks. It works only on plain arrays: no REST layer, no module and no reports.
  * Add these constants:
    * `MAXIMUM_KEY_FACTORS` (`3`), `MAXIMUM_ATTRIBUTES` (`2`) and `MINIMUM_ATTRIBUTE_DELTA` (`5`).
    * `REFERRING_SITE_CHANNELS`: `Referral` and `Organic Social`.
    * `JOINED_SOURCES`: `facebook.com`, `m.facebook.com`, `l.facebook.com`, `lm.facebook.com` and `fb`, each mapped to `Facebook`. A source is looked up in lowercase.
    * `CHANNEL_ATTRIBUTE_KINDS`: each channel name in the acceptance criteria's table, mapped to its list of attribute kinds. `DEFAULT_CHANNEL_ATTRIBUTE_KINDS`: the list for any other channel.
    * `KIND_ATTRIBUTE_KINDS`: `CONTENT`, `CAMPAIGN`, `REFERRING_SITE` and `SEARCH_KEYWORD`, each mapped to its list.
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
    * Sort the candidates by `Row_Scorer::score_row()`, highest first, and keep the first `MAXIMUM_KEY_FACTORS`. Order two equal scores by the kind's index in `Wire_Format::KEY_FACTOR_KINDS` (added in #13844), and then with `strcmp()` on the label. Write these tie-breaks into the `usort()` callback, because `usort()` is not stable on PHP 7.4.
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

    * Keep only the values that count, as the acceptance criteria define them. Use `MINIMUM_ATTRIBUTE_DELTA` for the smallest change. For `DEVICE` and `USER_TYPE`, compare `Row_Scorer::get_self_change_percent()` of the value and of the card with `MACRO_DIVERGENCE_PERCENT`.
    * Pick each kind's representative, and then the two kinds, with the tie-breaks in the acceptance criteria, written into the `usort()` callbacks. Give each attribute its `sharePct` from `Row_Scorer::get_share_percent()`.

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
  * In `get_report_rows()`, rename the `visitors` key of each row to `count`, because the breakdowns count sessions. Read `count` where the daily series reads the rows.
  * Change `pair_periods()` to pair the two windows by all of a row's dimension values, not only by the first value.
  * Change `build_contextual_data()` to build the four Analytics keys from the paired rows, with the fields in the `Contextual_Data_Validator` table above, in the order of each report's dimensions.
  * In `filter_contextual_data()`, rewrite the filter's docblock for the seven keys and their row fields, and remove the sentence about ranking and the cap of 5 rows.
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
  * In `build()`, return `visitors`, `dailyTraffic` and `keyFactors`, and update its `@return` description.

* [ ] In `includes/Modules/Analytics_4/Benchmarking/Wire_Format.php`:
  * Remove `DIMENSION_INDEXES` and `CONTEXTUAL_DATA_KEYS`. After the changes above, no class reads them.

* [ ] In `includes/Modules/Analytics_4/Datapoints/Get_Benchmarking_Data.php`:
  * Create `Response_Builder` with `$definition['module']` only.

* [ ] In `includes/Modules/Analytics_4.php`:
  * Remove `custom_dimensions_data_available` from the `GET:benchmarking-data` definition in `get_datapoint_definitions()`.

* [ ] In `includes/Modules/Search_Console/Benchmarking/Report_Options.php`:
  * Replace `get_search_query_requests()` with `get_search_keyword_requests()`. It returns six requests, one for each window of each of the dimensions `query`, `query,page` and `query,device`. Their identifiers are `keywords_current`, `keywords_previous`, `keyword_pages_current`, `keyword_pages_previous`, `keyword_devices_current` and `keyword_devices_previous`.

* [ ] In `includes/Modules/Search_Console/Benchmarking/Report_Data_Builder.php`:
  * Replace `build_search_query_rows()` with `build_search_keyword_rows( array $args )`. It runs the six requests in one `searchanalytics-batch` call, and returns `array( 'searchKeywords' => …, 'searchKeywordPages' => …, 'searchKeywordDevices' => … )`, with the row fields in the acceptance criteria.
  * Count `(int) $report_row->getClicks()`, and stop reading the position.
  * Write a page as `wp_parse_url( $page, PHP_URL_PATH )`, or `/` when the URL has no path. Write a device with `strtolower()`.
  * Pair each key's two windows by all of the row's values after the page and the device are converted. Add up the rows that become the same, for example two URLs of one page with different query strings.
  * Return an empty array when the batch call fails, or when any of the six requests fails.

* [ ] In `includes/Modules/Search_Console.php`:
  * Rename `add_search_query_rows()` to `add_search_keyword_rows()`, and update the `add_filter()` call in `register()`.
  * Keep its property check. Add every key `build_search_keyword_rows()` returns to the contextual data, and update its docblock.

Encoding `keyFactors` is #13844. `sessionSource` is added to the dimensions a shared report may use in #13597, and `landingPage` and `sessionCampaignName` in #13843.

### Test Coverage

* Update `tests/phpunit/includes/Fake_Benchmarking_Reports_Trait.php`: key `$report_rows` by all of a report's dimension names, joined with commas, instead of by the first name only, because the four breakdowns all start with `sessionDefaultChannelGrouping`. Also let a key hold a callable that receives the report request and returns the rows, so a test can answer two reports that run after the cards are chosen by their filters.
* Update `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Report_OptionsTest.php` covering:
  * Each of the four breakdowns counts `sessions`, carries both windows, has the dimensions in the table and asks for 250 rows.
  * `get_driver_breakdown_options()` adds an in-list filter on the dimension it is given.
  * Remove the cases for the six removed methods.
* Update `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Row_ScorerTest.php` for the new constructor, covering:
  * Scores use the weights by kind.
  * The device and visitor mix check no longer excludes anything.
  * `get_share_percent()` divides by the site's growth for a rise and by the site's drop for a fall, stops at `100`, rounds to one decimal, and returns `0` when it would divide by `0`.
  * `passes_specific_driver_gate()` passes a channel of any size. It passes a landing page at exactly `10` sessions and `15%`, and fails it at `9` sessions or at `14.9%`.
* Add `tests/phpunit/integration/Modules/Analytics_4/Benchmarking/Key_Factor_SelectorTest.php`, driven by plain contextual-data arrays, covering:
  * The example in the acceptance criteria gives `substack.com`, `Direct` and `Organic Search`, in that order, with shares of `33.3`, `41.7` and `16.7`, and no `Referral` card.
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
  * The response carries `visitors`, `dailyTraffic` and `keyFactors`, and neither `dimensions` nor `contextualData`. Building it twice from the same report rows gives the same response.
  * Make `test_build__does_not_return_a_number_with_decimals` also allow each `sharePct`, and assert that it has at most one decimal.
  * Remove the cases for the dimension ranking, the cap of 5 rows and the content rows, and the `Custom_Dimensions_Data_Available` setup.
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
  * Dispatched as a view-only user whose role has Analytics shared, the datapoint runs every Analytics call, the first one and the later ones, under the module owner's token.
  * With Analytics shared and Search Console not shared, the response has no `SEARCH_KEYWORD` card and no `SEARCH_KEYWORD` attribute. This replaces the case that asserts no `SEARCH_QUERIES` dimension.
* No Storybook story is required, because the change adds no UI.
* No VRT changes expected.

## QA Brief

* <!-- One or more bullet points for how to test that the feature works as expected. -->

## Changelog entry

* <!-- One sentence summarizing the PR, to be used in the changelog. -->
