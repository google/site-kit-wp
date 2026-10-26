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
	 * @since n.e.x.t Renamed the constants of members `3` and `4` from visitors to visits, and replaced members `5` and `6` with the key factor cards and their attributes.
	 */
	const MEMBER_VERSION               = 0;
	const MEMBER_STRINGS               = 1;
	const MEMBER_FIRST_DATE            = 2;
	const MEMBER_DAILY_VISITS          = 3;
	const MEMBER_VISIT_TOTALS          = 4;
	const MEMBER_KEY_FACTORS           = 5;
	const MEMBER_KEY_FACTOR_ATTRIBUTES = 6;

	/**
	 * The position each driver kind of a key factor card travels as. A kind is
	 * only ever added at the end, so a position never changes meaning.
	 *
	 * @since n.e.x.t
	 */
	const KEY_FACTOR_KINDS = array(
		'CHANNEL'        => 0,
		'CONTENT'        => 1,
		'SEARCH_KEYWORD' => 2,
		'REFERRING_SITE' => 3,
		'CAMPAIGN'       => 4,
	);

	/**
	 * The position each kind of a key factor card's attribute travels as. A
	 * kind is only ever added at the end, so a position never changes meaning.
	 *
	 * @since n.e.x.t
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
	);

	/**
	 * The dimension codes `Response_Builder` ranks, in the order it lists two
	 * dimensions with the same sum of row scores. The encoded response doesn't
	 * carry them.
	 */
	const DIMENSION_INDEXES = array(
		'CHANNELS'       => 0,
		'DEVICES'        => 1,
		'VISITOR_MIX'    => 2,
		'REFERRERS'      => 3,
		'SEARCH_QUERIES' => 4,
		'CONTENT'        => 5,
		'CATEGORIES'     => 6,
	);

	/**
	 * The `contextualData` key of each dimension code.
	 */
	const CONTEXTUAL_DATA_KEYS = array(
		'CHANNELS'       => 'channels',
		'DEVICES'        => 'devices',
		'VISITOR_MIX'    => 'visitorMix',
		'REFERRERS'      => 'referrers',
		'SEARCH_QUERIES' => 'searchQueries',
		'CONTENT'        => 'content',
		'CATEGORIES'     => 'categories',
	);

	/**
	 * The decimal places a share of the site's change keeps. Every other number
	 * the format carries is an integer.
	 *
	 * @since n.e.x.t
	 */
	const SHARE_DECIMAL_PLACES = 1;
}
