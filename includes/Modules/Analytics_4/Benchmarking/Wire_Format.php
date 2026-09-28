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
 * must agree: a number here is a position in the response the browser decodes.
 *
 * @since n.e.x.t
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
	 */
	const MEMBER_VERSION         = 0;
	const MEMBER_STRINGS         = 1;
	const MEMBER_FIRST_DATE      = 2;
	const MEMBER_DAILY_VISITORS  = 3;
	const MEMBER_VISITOR_TOTALS  = 4;
	const MEMBER_DIMENSION_ROWS  = 5;
	const MEMBER_DIMENSION_ORDER = 6;

	/**
	 * The position each dimension code travels as.
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
	 * The `contextualData` key each dimension code decodes to.
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
	 * The decimal places an average position keeps. Every other number the
	 * format carries is an integer.
	 */
	const POSITION_DECIMAL_PLACES = 1;
}
