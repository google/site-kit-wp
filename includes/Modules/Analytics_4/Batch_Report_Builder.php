<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Batch_Report_Builder
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Analytics_4;

/**
 * Class for building and executing batch Analytics 4 reports.
 */
class Batch_Report_Builder {

	/**
	 * Plugin context.
	 *
	 * @var Context
	 */
	protected $context;

	/**
	 * Analytics_4 module instance.
	 *
	 * @var Analytics_4
	 */
	protected $analytics_4;

	/**
	 * Default date range for reports.
	 *
	 * @var array
	 */
	protected $default_date_range;

	/**
	 * Constructor.
	 *
	 * @param Context     $context      Plugin context.
	 * @param Analytics_4 $analytics_4  Analytics_4 module instance.
	 * @param array       $date_range   Optional. Default date range. Default is last 28 days.
	 */
	public function __construct( Context $context, Analytics_4 $analytics_4, $date_range = array() ) {
		$this->context            = $context;
		$this->analytics_4        = $analytics_4;
		$this->default_date_range = $this->get_default_date_range( $date_range );
	}

	/**
	 * Gets the default date range.
	 *
	 * @param array $date_range Optional date range override.
	 * @return array Date range array.
	 */
	protected function get_default_date_range( $date_range = array() ) {
		if ( ! empty( $date_range ) ) {
			return $date_range;
		}

		return array(
			'startDate' => gmdate( 'Y-m-d', strtotime( '-28 days' ) ),
			'endDate'   => gmdate( 'Y-m-d' ),
		);
	}

	/**
	 * Gets total visitors report configuration.
	 *
	 * @param array $args Optional. Report arguments to override defaults.
	 * @return array Report configuration.
	 */
	public function get_total_visitors_report( $args = array() ) {
		return array_merge(
			array(
				'metrics'   => array( 'totalUsers' ),
				'startDate' => $this->default_date_range['startDate'],
				'endDate'   => $this->default_date_range['endDate'],
			),
			$args
		);
	}

	/**
	 * Gets new visitors with trend report configuration.
	 *
	 * @param array $args Optional. Report arguments to override defaults.
	 * @return array Report configuration.
	 */
	public function get_new_visitors_trend_report( $args = array() ) {
		return array_merge(
			array(
				'metrics'    => array( 'newUsers' ),
				'dimensions' => array( 'date' ),
				'startDate'  => $this->default_date_range['startDate'],
				'endDate'    => $this->default_date_range['endDate'],
				'orderBys'   => array(
					array(
						'dimension' => array( 'dimensionName' => 'date' ),
						'desc'      => false,
					),
				),
			),
			$args
		);
	}

	/**
	 * Gets returning visitors with trend report configuration.
	 *
	 * @param array $args Optional. Report arguments to override defaults.
	 * @return array Report configuration.
	 */
	public function get_returning_visitors_trend_report( $args = array() ) {
		return array_merge(
			array(
				'metrics'         => array( 'activeUsers' ),
				'dimensions'      => array( 'date', 'newVsReturning' ),
				'startDate'       => $this->default_date_range['startDate'],
				'endDate'         => $this->default_date_range['endDate'],
				'dimensionFilter' => array(
					'filter' => array(
						'fieldName'    => 'newVsReturning',
						'stringFilter' => array(
							'matchType' => 'EXACT',
							'value'     => 'returning',
						),
					),
				),
				'orderBys'        => array(
					array(
						'dimension' => array( 'dimensionName' => 'date' ),
						'desc'      => false,
					),
				),
			),
			$args
		);
	}

	/**
	 * Gets top 3 traffic channels with trends report configuration.
	 *
	 * @param array $args Optional. Report arguments to override defaults.
	 * @return array Report configuration.
	 */
	public function get_top_traffic_channels_trend_report( $args = array() ) {
		return array_merge(
			array(
				'metrics'    => array( 'sessions' ),
				'dimensions' => array( 'sessionDefaultChannelGroup', 'date' ),
				'startDate'  => $this->default_date_range['startDate'],
				'endDate'    => $this->default_date_range['endDate'],
				'orderBys'   => array(
					array(
						'metric' => array( 'metricName' => 'sessions' ),
						'desc'   => true,
					),
				),
				'limit'      => 3,
			),
			$args
		);
	}

	/**
	 * Gets top products by pageviews report configuration.
	 *
	 * @param array $args Optional. Report arguments to override defaults.
	 * @return array Report configuration.
	 */
	public function get_top_products_report( $args = array() ) {
		return array_merge(
			array(
				'metrics'         => array( 'screenPageViews' ),
				'dimensions'      => array( 'pagePath', 'pageTitle' ),
				'startDate'       => $this->default_date_range['startDate'],
				'endDate'         => $this->default_date_range['endDate'],
				'dimensionFilter' => array(
					'andGroup' => array(
						'expressions' => array(
							array(
								'filter' => array(
									'fieldName'    => 'pagePath',
									'stringFilter' => array(
										'matchType' => 'CONTAINS',
										'value'     => '/product',
									),
								),
							),
						),
					),
				),
				'orderBys'        => array(
					array(
						'metric' => array( 'metricName' => 'screenPageViews' ),
						'desc'   => true,
					),
				),
				'limit'           => 10,
			),
			$args
		);
	}

	/**
	 * Gets top 3 authors by pageviews report configuration.
	 *
	 * @param array $args Optional. Report arguments to override defaults.
	 * @return array Report configuration.
	 */
	public function get_top_authors_report( $args = array() ) {
		$custom_dimension = Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR;

		return array_merge(
			array(
				'metrics'    => array( 'screenPageViews' ),
				'dimensions' => array( "customEvent:{$custom_dimension}" ),
				'startDate'  => $this->default_date_range['startDate'],
				'endDate'    => $this->default_date_range['endDate'],
				'orderBys'   => array(
					array(
						'metric' => array( 'metricName' => 'screenPageViews' ),
						'desc'   => true,
					),
				),
				'limit'      => 3,
			),
			$args
		);
	}

	/**
	 * Gets top 3 categories by pageviews report configuration.
	 *
	 * @param array $args Optional. Report arguments to override defaults.
	 * @return array Report configuration.
	 */
	public function get_top_categories_report( $args = array() ) {
		$custom_dimension = Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES;

		return array_merge(
			array(
				'metrics'    => array( 'screenPageViews' ),
				'dimensions' => array( "customEvent:{$custom_dimension}" ),
				'startDate'  => $this->default_date_range['startDate'],
				'endDate'    => $this->default_date_range['endDate'],
				'orderBys'   => array(
					array(
						'metric' => array( 'metricName' => 'screenPageViews' ),
						'desc'   => true,
					),
				),
				'limit'      => 3,
			),
			$args
		);
	}

	/**
	 * Executes multiple reports in a batch request.
	 *
	 * @param array $report_configs Array of report configurations.
	 * @return array|WP_Error Batch report results or error.
	 */
	public function execute_batch_reports( $report_configs ) {
		if ( empty( $report_configs ) || count( $report_configs ) > 5 ) {
			return new \WP_Error(
				'invalid_batch_size',
				__( 'Batch report requests must contain 1-5 reports.', 'google-site-kit' ),
				array( 'status' => 400 )
			);
		}

		// Remove report_id from configs before sending to API.
		$api_configs = array();
		foreach ( $report_configs as $config ) {
			$api_config = $config;
			unset( $api_config['report_id'] );
			$api_configs[] = $api_config;
		}

		$batch_data = array(
			'requests' => $api_configs,
		);

		return $this->analytics_4->get_data( 'batch-report', $batch_data );
	}

	/**
	 * Gets a comprehensive dashboard report combining multiple metrics.
	 *
	 * @param array $report_ids Optional. Array of report IDs to include. Default includes common dashboard reports.
	 * @return array|WP_Error Batch report results or error.
	 */
	public function get_dashboard_reports( $report_ids = array() ) {
		$report_configs = $this->build_report_configs( $report_ids );
		return $this->execute_batch_reports( $report_configs );
	}

	/**
	 * Gets content performance reports (authors and categories).
	 *
	 * @param array $report_ids Optional. Array of report IDs to include. Default includes both authors and categories.
	 * @return array|WP_Error Batch report results or error.
	 */
	public function get_content_performance_reports( $report_ids = array() ) {
		// Default reports if none specified.
		if ( empty( $report_ids ) ) {
			$report_ids = array(
				'top_authors',
				'top_categories',
			);
		}

		$report_configs = $this->build_report_configs( $report_ids );
		return $this->execute_batch_reports( $report_configs );
	}

	/**
	 * Gets and processes dashboard reports in one call with proper report IDs as keys.
	 *
	 * @param array $report_ids Optional. Array of report IDs to include. Default includes common dashboard reports.
	 * @return array|WP_Error Processed batch results with report IDs as keys, or error.
	 */
	public function get_processed_dashboard_reports( $report_ids = array() ) {
		// Step 1: Get report configs with report_id.
		$report_configs = $this->build_report_configs( $report_ids );

		// Step 2: Execute batch (removes report_id before API call).
		$batch_results = $this->execute_batch_reports( $report_configs );

		if ( is_wp_error( $batch_results ) ) {
			return $batch_results;
		}

		// Step 3: Process with original configs to get proper keys.
		$processor = new Batch_Report_Processor();
		return $processor->process_batch_results( $batch_results, $report_configs );
	}

	/**
	 * Gets and processes content performance reports in one call with proper report IDs as keys.
	 *
	 * @param array $report_ids Optional. Array of report IDs to include. Default includes both authors and categories.
	 * @return array|WP_Error Processed batch results with report IDs as keys, or error.
	 */
	public function get_processed_content_reports( $report_ids = array() ) {
		// Default reports if none specified.
		if ( empty( $report_ids ) ) {
			$report_ids = array(
				'top_authors',
				'top_categories',
			);
		}

		return $this->get_processed_dashboard_reports( $report_ids );
	}

	/**
	 * Builds report configurations with report IDs (helper method).
	 *
	 * @param array $report_ids Array of report IDs to build.
	 * @return array Array of report configurations.
	 */
	protected function build_report_configs( $report_ids = array() ) {
		// Default reports if none specified.
		if ( empty( $report_ids ) ) {
			$report_ids = array(
				'total_visitors',
				'new_visitors_trend',
				'returning_visitors_trend',
				'traffic_channels_trend',
			);
		}

		// Map report IDs to their corresponding method calls.
		$report_methods = array(
			'total_visitors'           => 'get_total_visitors_report',
			'new_visitors_trend'       => 'get_new_visitors_trend_report',
			'returning_visitors_trend' => 'get_returning_visitors_trend_report',
			'traffic_channels_trend'   => 'get_top_traffic_channels_trend_report',
			'top_products'             => 'get_top_products_report',
			'top_authors'              => 'get_top_authors_report',
			'top_categories'           => 'get_top_categories_report',
		);

		$reports = array();

		foreach ( $report_ids as $report_id ) {
			if ( ! isset( $report_methods[ $report_id ] ) ) {
				continue; // Skip invalid report IDs.
			}

			$method = $report_methods[ $report_id ];
			if ( ! method_exists( $this, $method ) ) {
				continue; // Skip if method doesn't exist.
			}

			$report              = $this->$method();
			$report['report_id'] = $report_id;
			$reports[]           = $report;
		}

		return $reports;
	}

	/**
	 * Checks if custom dimensions are available for content reports.
	 *
	 * @return bool True if custom dimensions are available.
	 */
	public function has_custom_dimensions_available() {
		$settings             = $this->analytics_4->get_settings()->get();
		$available_dimensions = $settings['availableCustomDimensions'] ?? array();

		return ! empty( $available_dimensions ) &&
				( in_array( Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR, $available_dimensions, true ) ||
				in_array( Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES, $available_dimensions, true ) );
	}

	/**
	 * Checks if the site appears to have product pages.
	 *
	 * @return bool True if product pages are detected.
	 */
	public function has_products_available() {
		$test_report = $this->get_top_products_report( array( 'limit' => 1 ) );
		$result      = $this->analytics_4->get_data( 'report', $test_report );

		if ( is_wp_error( $result ) ) {
			return false;
		}

		return ! empty( $result['rows'] );
	}
}
