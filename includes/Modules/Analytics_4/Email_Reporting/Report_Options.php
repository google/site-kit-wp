<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Options
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Report_Options\Report_Options as Base_Report_Options;
use Google\Site_Kit\Core\Storage\Options as Core_Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Audience_Settings as User_Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings as Module_Audience_Settings;

/**
 * Builds Analytics 4 report option payloads for email reporting.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Report_Options extends Base_Report_Options {

	/**
	 * Ecommerce conversion events.
	 *
	 * @since 1.167.0
	 *
	 * @var string[]
	 */
	private $ecommerce_events = array(
		'add_to_cart',
		'purchase',
	);

	/**
	 * Audience configuration helper.
	 *
	 * @since 1.167.0
	 *
	 * @var Audience_Config
	 */
	private $audience_config;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
	 *
	 * @param array   $date_range    Current period range array.
	 * @param array   $compare_range Compare period range array.
	 * @param Context $context       Plugin context.
	 */
	public function __construct(
		$date_range,
		$compare_range,
		Context $context
	) {
		parent::__construct( $date_range, $compare_range );
		$user_settings         = new User_Audience_Settings( new User_Options( $context ) );
		$module_settings       = new Module_Audience_Settings( new Core_Options( $context ) );
		$this->audience_config = new Audience_Config( $user_settings, $module_settings );
	}

	/**
	 * Gets report options for the total conversion events section.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_total_conversion_events_options() {
		return $this->with_current_range(
			array(
				'metrics'          => array(
					array( 'name' => 'eventCount' ),
				),
				'dimensionFilters' => array(
					'eventName' => $this->ecommerce_events,
				),
				'keepEmptyRows'    => false,
			),
			true
		);
	}

	/**
	 * Gets report options for products added to cart.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_products_added_to_cart_options() {
		return $this->with_current_range(
			array(
				'metrics'       => array(
					array( 'name' => 'addToCarts' ),
				),
				'dimensions'    => array(
					array( 'name' => 'sessionDefaultChannelGroup' ),
				),
				'orderby'       => array(
					array(
						'metric' => array( 'metricName' => 'addToCarts' ),
						'desc'   => true,
					),
				),
				'limit'         => 5,
				'keepEmptyRows' => false,
			)
		);
	}

	/**
	 * Gets report options for purchases.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_purchases_options() {
		return $this->with_current_range(
			array(
				'metrics'       => array(
					array( 'name' => 'ecommercePurchases' ),
				),
				'dimensions'    => array(
					array( 'name' => 'sessionDefaultChannelGroup' ),
				),
				'orderby'       => array(
					array(
						'metric' => array( 'metricName' => 'ecommercePurchases' ),
						'desc'   => true,
					),
				),
				'limit'         => 5,
				'keepEmptyRows' => false,
			)
		);
	}

	/**
	 * Gets report options for total visitors.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_total_visitors_options() {
		return $this->with_current_range(
			array(
				'metrics' => array(
					array( 'name' => 'totalUsers' ),
				),
			),
			true
		);
	}

	/**
	 * Gets report options for new visitors.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_new_visitors_options() {
		return $this->build_audience_report_options( 'new-visitors', 'new' );
	}

	/**
	 * Gets report options for returning visitors.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_returning_visitors_options() {
		return $this->build_audience_report_options( 'returning-visitors', 'returning' );
	}

	/**
	 * Gets report options for custom audiences (user configured).
	 *
	 * @since 1.167.0
	 *
	 * @return array Report payload, holding report options array and audience metadata.
	 */
	public function get_custom_audiences_options() {
		$audience_data = $this->audience_config->get_configured_audiences();

		if ( empty( $audience_data['resource_names'] ) ) {
			return array(
				'options'   => array(),
				'audiences' => array(),
			);
		}

		$options = $this->with_current_range(
			array(
				'metrics'          => array(
					array( 'name' => 'totalUsers' ),
				),
				'dimensions'       => array(
					array( 'name' => 'audienceResourceName' ),
				),
				'dimensionFilters' => array(
					'audienceResourceName' => $audience_data['resource_names'],
				),
				'keepEmptyRows'    => false,
			),
			true
		);

		return array(
			'options'   => $options,
			'audiences' => $audience_data['audiences'],
		);
	}

	/**
	 * Gets report options for the traffic channels by visitor count section.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_traffic_channels_options() {
		return $this->with_current_range(
			array(
				'metrics'       => array(
					array( 'name' => 'totalUsers' ),
				),
				'dimensions'    => array(
					array( 'name' => 'sessionDefaultChannelGroup' ),
				),
				'orderby'       => array(
					array(
						'metric' => array( 'metricName' => 'totalUsers' ),
						'desc'   => true,
					),
				),
				'limit'         => 3,
				'keepEmptyRows' => false,
			),
			true
		);
	}

	/**
	 * Gets report options for pages with the most pageviews.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_popular_content_options() {
		return $this->with_current_range(
			array(
				'metrics'       => array(
					array( 'name' => 'screenPageViews' ),
				),
				'dimensions'    => array(
					array( 'name' => 'pagePath' ),
				),
				'orderby'       => array(
					array(
						'metric' => array( 'metricName' => 'screenPageViews' ),
						'desc'   => true,
					),
				),
				'limit'         => 3,
				'keepEmptyRows' => false,
			)
		);
	}

	/**
	 * Gets report options for top authors by pageviews.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_top_authors_options() {
		return $this->with_current_range(
			array(
				'metrics'       => array(
					array( 'name' => 'screenPageViews' ),
				),
				'dimensions'    => array(
					array(
						'name' => sprintf(
							'customEvent:%s',
							Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR
						),
					),
				),
				'orderby'       => array(
					array(
						'metric' => array( 'metricName' => 'screenPageViews' ),
						'desc'   => true,
					),
				),
				'limit'         => 3,
				'keepEmptyRows' => false,
			)
		);
	}

	/**
	 * Gets report options for top categories by pageviews.
	 *
	 * @since 1.167.0
	 *
	 * @return array Report request options array.
	 */
	public function get_top_categories_options() {
		return $this->with_current_range(
			array(
				'metrics'       => array(
					array( 'name' => 'screenPageViews' ),
				),
				'dimensions'    => array(
					array(
						'name' => sprintf(
							'customEvent:%s',
							Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES
						),
					),
				),
				'orderby'       => array(
					array(
						'metric' => array( 'metricName' => 'screenPageViews' ),
						'desc'   => true,
					),
				),
				'limit'         => 3,
				'keepEmptyRows' => false,
			)
		);
	}

	/**
	 * Builds report options for Site Kit-created audiences, with a fallback to the core dimension if unavailable.
	 *
	 * @since 1.167.0
	 *
	 * @param string $audience_slug    Audience slug (e.g. 'new-visitors').
	 * @param string $fallback_segment Fallback segment value for newVsReturning.
	 * @return array Report request options array.
	 */
	private function build_audience_report_options( $audience_slug, $fallback_segment ) {
		$site_kit_audiences = $this->audience_config->get_site_kit_audience_map();
		$resource_name      = $site_kit_audiences[ $audience_slug ] ?? '';

		if ( $resource_name ) {
			return $this->with_current_range(
				array(
					'metrics'          => array(
						array( 'name' => 'totalUsers' ),
					),
					'dimensions'       => array(
						array( 'name' => 'audienceResourceName' ),
					),
					'dimensionFilters' => array(
						'audienceResourceName' => array(
							'value' => $resource_name,
						),
					),
					'keepEmptyRows'    => false,
				),
				true
			);
		}

		return $this->with_current_range(
			array(
				'metrics'          => array(
					array( 'name' => 'activeUsers' ),
				),
				'dimensions'       => array(
					array( 'name' => 'newVsReturning' ),
				),
				'dimensionFilters' => array(
					'newVsReturning' => array(
						'value' => $fallback_segment,
					),
				),
				'keepEmptyRows'    => false,
			),
			true
		);
	}
}
