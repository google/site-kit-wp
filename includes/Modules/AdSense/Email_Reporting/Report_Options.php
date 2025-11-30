<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Email_Reporting\Report_Options
 *
 * @package   Google\Site_Kit\Modules\AdSense\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\AdSense\Email_Reporting;

use Google\Site_Kit\Core\Email_Reporting\Report_Options\Report_Options as Base_Report_Options;

/**
 * Builds AdSense-focused report option payloads for email reporting.
 *
 * This leverages Analytics 4 linked AdSense data (totalAdRevenue/adSourceName).
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Report_Options extends Base_Report_Options {

	/**
	 * Linked AdSense account ID.
	 *
	 * @since 1.167.0
	 *
	 * @var string
	 */
	private $account_id;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
	 *
	 * @param array|null $date_range    Current period range array.
	 * @param array      $compare_range Optional. Compare period range array.
	 * @param string     $account_id    Optional. Connected AdSense account ID. Default empty.
	 */
	public function __construct( $date_range, $compare_range = array(), $account_id = '' ) {
		parent::__construct( $date_range, $compare_range );
		$this->account_id = $account_id;
	}

	/**
	 * Gets report options for total AdSense earnings.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_total_earnings_options() {
		$options = array(
			'metrics' => array(
				array( 'name' => 'totalAdRevenue' ),
			),
		);

		$ad_source_filter = $this->get_ad_source_filter();
		if ( $ad_source_filter ) {
			$options['dimensionFilters'] = array(
				'adSourceName' => $ad_source_filter,
			);
		}

		return $this->with_current_range( $options, true );
	}

	/**
	 * Builds the AdSense ad source filter value.
	 *
	 * @since 1.167.0
	 *
	 * @return string Human-readable filter label referencing the linked AdSense account.
	 */
	private function get_ad_source_filter() {
		if ( empty( $this->account_id ) ) {
			return '';
		}

		return sprintf( 'Google AdSense account (%s)', $this->account_id );
	}
}
