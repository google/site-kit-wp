<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Report
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Analytics_4\Report\ReportParsers;

/**
 * The base class for Analytics 4 reports.
 *
 * @since 1.99.0
 * @access private
 * @ignore
 */
class Report extends ReportParsers {

	/**
	 * Plugin context.
	 *
	 * @since 1.99.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Constructor.
	 *
	 * @since 1.99.0
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	// NOTE: The majority of this classes logic has been abstracted to
	// ReportParsers which contains the shared methods for both
	// Report and PivotReport classes.
}
