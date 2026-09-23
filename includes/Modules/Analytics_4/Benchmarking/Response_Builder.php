<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Response_Builder
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Benchmarking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Analytics_4;
use WP_Error;

/**
 * Assembles the benchmarking response for a pair of dates.
 *
 * Everything the Typical Traffic tab renders comes from here, so the tab makes
 * one request and has one loading state instead of eight.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Response_Builder {

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Analytics 4 module instance.
	 *
	 * @since n.e.x.t
	 * @var Analytics_4
	 */
	private $analytics_4;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context     $context     Context instance.
	 * @param Analytics_4 $analytics_4 Analytics 4 module instance, which runs the reports.
	 */
	public function __construct( Context $context, Analytics_4 $analytics_4 ) {
		$this->context     = $context;
		$this->analytics_4 = $analytics_4;
	}

	/**
	 * Builds the response for a pair of dates.
	 *
	 * The reports behind the four fields are added in #13595, so today
	 * every field comes back empty. Nothing here is written to the site: the
	 * response is assembled inside the request that asks for it.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $start_date Start date, as `YYYY-MM-DD`.
	 * @param string $end_date   End date, as `YYYY-MM-DD`.
	 * @return array|WP_Error {
	 *     The assembled response, or the error a failed report returned.
	 *
	 *     @type array $visitors       Visitor totals for the selected period and the one before it.
	 *     @type array $dailyTraffic   Daily visitor counts, oldest first.
	 *     @type array $dimensions     Dimension codes the response carries, in the order they are shown.
	 *     @type array $contextualData Ranked rows, keyed by the dimension they belong to.
	 * }
	 */
	public function build( $start_date, $end_date ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed -- The reports that read the two dates are added in #13595.
		return array(
			'visitors'       => array(),
			'dailyTraffic'   => array(),
			'dimensions'     => array(),
			'contextualData' => array(),
		);
	}
}
