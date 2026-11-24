<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Wire_Format
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Benchmarking;

/**
 * The positions and names the encoded benchmarking response is built from.
 *
 * The JavaScript half of this file is
 * `assets/js/modules/analytics-4/utils/benchmarking/constants.ts`, and the two
 * must agree on the member positions and on the order of both kind lists.
 *
 * @since 1.189.0
 * @access private
 * @ignore
 */
final class Wire_Format {

	/**
	 * The layout the encoded response is written in. A browser that decodes a
	 * different version cannot read the response.
	 */
	const FORMAT_VERSION = 1;

	/**
	 * Envelope members, by position.
	 *
	 * @since 1.189.0
	 * @since 1.191.0 Renamed the constants of members `3` and `4` from visitors to visits, and replaced members `5` and `6` with the key factor cards and their attributes.
	 * @since n.e.x.t Added members `7` and `8`, the expected range of each day and which parts of the typical traffic view show.
	 * @since n.e.x.t Added member `9`, the content markers, member `10`, whether traffic was steady, member `11`, the days of traffic the band is fitted on, and members `12` and `13`, the locale of the generated insight and its signed request. Only a response built with the `trafficInsights` feature carries members `12` and `13`.
	 */
	const MEMBER_VERSION               = 0;
	const MEMBER_STRINGS               = 1;
	const MEMBER_FIRST_DATE            = 2;
	const MEMBER_DAILY_VISITS          = 3;
	const MEMBER_VISIT_TOTALS          = 4;
	const MEMBER_KEY_FACTORS           = 5;
	const MEMBER_KEY_FACTOR_ATTRIBUTES = 6;
	const MEMBER_DAILY_EXPECTED_RANGES = 7;
	const MEMBER_AVAILABILITY          = 8;
	const MEMBER_CONTENT_MARKERS       = 9;
	const MEMBER_STEADY_TRAFFIC        = 10;
	const MEMBER_BAND_REFERENCE_DAYS   = 11;
	const MEMBER_INSIGHT_LOCALE        = 12;
	const MEMBER_INSIGHT_PAYLOAD       = 13;

	/**
	 * The fields of the availability member, by position, in the order
	 * `Typical_Traffic_Availability::get()` returns them. Each `*_FROM` field
	 * is a day, which travels as its offset from the first plotted day.
	 *
	 * @since n.e.x.t
	 */
	const AVAILABILITY_RANGE_TOO_SHORT               = 0;
	const AVAILABILITY_BAND_AVAILABLE                = 1;
	const AVAILABILITY_BAND_AVAILABLE_FROM           = 2;
	const AVAILABILITY_KEY_FACTORS_AVAILABLE         = 3;
	const AVAILABILITY_KEY_FACTORS_AVAILABLE_FROM    = 4;
	const AVAILABILITY_INSIGHT_REQUEST_ALLOWED       = 5;
	const AVAILABILITY_PERFORMANCE_INSIGHT_AVAILABLE = 6;
	const AVAILABILITY_LAST_YEAR_AVAILABLE           = 7;

	/**
	 * The position each driver kind of a key factor card travels as. A kind is
	 * only ever added at the end, so a position never changes meaning.
	 *
	 * @since 1.191.0
	 * @since n.e.x.t Added `CHANNEL_GROUP`, the paid channels as one group. No card is a `SEARCH_KEYWORD` any more, but its position keeps its meaning.
	 */
	const KEY_FACTOR_KINDS = array(
		'CHANNEL'        => 0,
		'CONTENT'        => 1,
		'SEARCH_KEYWORD' => 2,
		'REFERRING_SITE' => 3,
		'CAMPAIGN'       => 4,
		'CHANNEL_GROUP'  => 5,
	);

	/**
	 * The position each kind of a key factor card's attribute travels as. A
	 * kind is only ever added at the end, so a position never changes meaning.
	 *
	 * @since 1.191.0
	 * @since n.e.x.t Added `ASSISTANT`, the AI assistant behind an `AI Assistant` card.
	 */
	const KEY_FACTOR_ATTRIBUTE_KINDS = array(
		'TRAFFIC_CHANNEL' => 0,
		'LANDING_PAGE'    => 1,
		'SEARCH_KEYWORD'  => 2,
		'REFERRING_SITE'  => 3,
		'PLATFORM'        => 4,
		'CAMPAIGN'        => 5,
		'DEVICE'          => 6,
		'USER_TYPE'       => 7,
		'ASSISTANT'       => 8,
	);

	/**
	 * The position each basis of a key factor card's share travels as: what
	 * the share is of, as the decomposition's `share_basis` names it. A basis
	 * is only ever added at the end, so a position never changes meaning.
	 *
	 * @since n.e.x.t
	 */
	const KEY_FACTOR_SHARE_BASES = array(
		'GROSS_CHANGE'   => 0,
		'NET_CHANGE'     => 1,
		'SITE_TRAFFIC'   => 2,
		'VOLUME'         => 3,
		'PARENT_CHANNEL' => 4,
	);

	/**
	 * The fields every key factor card and attribute travels with, in the
	 * order `[ kind, label, current, previous, sharePct ]`. A card can follow
	 * them with `[ url, shareBasis, parentChannel, parentChannelChange ]`, and
	 * an attribute with `[ oversized ]`. These trailing fields are left out
	 * from the last one that has a value, so a browser that reads none of
	 * them reads the row as it did before.
	 *
	 * @since n.e.x.t
	 */
	const KEY_FACTOR_ROW_FIELD_COUNT = 5;

	/**
	 * The decimal places a share of the site's change keeps. Every other number
	 * the format carries is an integer, except the bounds of the expected range.
	 *
	 * @since 1.191.0
	 * @since n.e.x.t Names the bounds of the expected range as the other numbers with decimals.
	 */
	const SHARE_DECIMAL_PLACES = 1;

	/**
	 * The decimal places each bound of a day's expected range keeps.
	 *
	 * @since n.e.x.t
	 */
	const EXPECTED_RANGE_DECIMAL_PLACES = 1;
}
