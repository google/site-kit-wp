<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Plain_Permalink_Top_Posts
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Util\Product_Post_Type;
use Google\Site_Kit\Core\Validation\Exception\Invalid_Report_Metrics_Exception;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Plain_Permalink_Top_Posts;
use Google\Site_Kit\Modules\Analytics_4\Report\Request as Analytics_4_Report_Request;
use Google\Site_Kit\Modules\Analytics_4\Report\RequestHelpers;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportResponse as Google_Service_AnalyticsData_RunReportResponse;
use WP_Error;
use WP_Post_Type;

/**
 * Class for the datapoint of the most viewed posts on a site with plain permalinks, where the query string tells posts apart, such as `/?p=123`.
 *
 * `pagePath` leaves out the query string, so the datapoint runs a report of
 * views by `pagePathPlusQueryString` and returns the posts its URLs show.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Plain_Permalink_Top_Posts extends Shareable_Datapoint implements Executable_Datapoint {

	/**
	 * Module settings instance.
	 *
	 * @since n.e.x.t
	 * @var Settings
	 */
	private $settings;

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Closure that returns whether the current request is for shared data.
	 *
	 * @since n.e.x.t
	 * @var \Closure
	 */
	private $is_shared_request;

	/**
	 * Service that finds the post each URL of the report shows, and adds up the views of each post.
	 *
	 * @since n.e.x.t
	 * @var Plain_Permalink_Top_Posts
	 */
	private $top_posts;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->settings          = $definition['settings'];
		$this->context           = $definition['context'];
		$this->is_shared_request = $definition['is_shared_request'];
		$this->top_posts         = $definition['top_posts'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 * @throws Missing_Required_Param_Exception Thrown when `startDate`, `endDate` or `limit` is missing.
	 * @throws Invalid_Param_Exception Thrown when `startDate` or `endDate` isn't a date that `strtotime()` reads, or `limit` isn't a whole number from 1 to `Plain_Permalink_Top_Posts::MAX_PAGE_PATHS`.
	 */
	public function create_request( Data_Request $data_request ) {
		if ( empty( $data_request['startDate'] ) ) {
			throw new Missing_Required_Param_Exception( 'startDate' );
		}

		if ( empty( $data_request['endDate'] ) ) {
			throw new Missing_Required_Param_Exception( 'endDate' );
		}

		// A `limit` of `0` is invalid, not missing, so we check for `null` rather
		// than use `empty()`.
		if ( null === $data_request['limit'] ) {
			throw new Missing_Required_Param_Exception( 'limit' );
		}

		if ( ! $this->is_report_date( $data_request['startDate'] ) ) {
			throw new Invalid_Param_Exception( 'startDate' );
		}

		if ( ! $this->is_report_date( $data_request['endDate'] ) ) {
			throw new Invalid_Param_Exception( 'endDate' );
		}

		$limit_options = array(
			'options' => array(
				'min_range' => 1,
				// The posts come from at most this many page paths, so no request
				// can get more posts than that.
				'max_range' => Plain_Permalink_Top_Posts::MAX_PAGE_PATHS,
			),
		);

		if ( false === filter_var( $data_request['limit'], FILTER_VALIDATE_INT, $limit_options ) ) {
			throw new Invalid_Param_Exception( 'limit' );
		}

		$settings = $this->settings->get();

		if ( empty( $settings['propertyID'] ) ) {
			return new WP_Error(
				'missing_required_setting',
				__( 'No connected Google Analytics property ID.', 'google-site-kit' ),
				array( 'status' => 500 )
			);
		}

		$report_request = ( new Analytics_4_Report_Request( $this->context ) )->create_request(
			$this->get_report_data_request( $data_request['startDate'], $data_request['endDate'] ),
			// Passing `true` would reject `pagePathPlusQueryString`, which isn't a
			// shareable dimension, so we check only the metrics of a shared request.
			false
		);

		if ( is_wp_error( $report_request ) ) {
			return $report_request;
		}

		if ( ( $this->is_shared_request )( $this ) ) {
			try {
				( new RequestHelpers( $this->context ) )->validate_shared_metrics( $report_request->getMetrics() );
			} catch ( Invalid_Report_Metrics_Exception $exception ) {
				return new WP_Error( 'invalid_analytics_4_report_metrics', $exception->getMessage() );
			}
		}

		$property_id = Analytics_4::normalize_property_id( $settings['propertyID'] );
		$report_request->setProperty( $property_id );

		return $this->get_service()->properties->runReport( $property_id, $report_request );
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param Google_Service_AnalyticsData_RunReportResponse $response Request response.
	 * @param Data_Request                                   $data     Data request object.
	 * @return array The posts that `Plain_Permalink_Top_Posts::get()` returns as `rows`, and the views of the whole report as `total`.
	 */
	public function parse_response( $response, Data_Request $data ) {
		$url_rows = array_map(
			fn( $row ) => array(
				'url'   => $row->getDimensionValues()[0]->getValue(),
				'views' => (int) $row->getMetricValues()[0]->getValue(),
			),
			(array) $response->getRows()
		);

		// The total counts every URL of the report, past its 1,000 rows too. A
		// report with no rows has a totals row with no metric values.
		$totals              = (array) $response->getTotals();
		$total_metric_values = empty( $totals ) ? array() : $totals[0]->getMetricValues();

		return array(
			'rows'  => $this->top_posts->get( $url_rows, (int) $data['limit'] ),
			'total' => empty( $total_metric_values ) ? 0 : (int) $total_metric_values[0]->getValue(),
		);
	}

	/**
	 * Checks whether a date parameter is a date the report reads, such as `2026-10-21`.
	 *
	 * `ReportParsers::parse_dateranges()` reports on the last 28 days in place of
	 * a date that `strtotime()` can't read.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value The date parameter, as the request sent it.
	 * @return bool True where the report reads the parameter as a date, false otherwise.
	 */
	private function is_report_date( $value ) {
		return is_string( $value ) && strtotime( $value );
	}

	/**
	 * Gets the data request of the report of views by URL, most first.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $start_date The first day of the report, such as `2026-10-21`.
	 * @param string $end_date   The last day of the report, such as `2026-10-22`.
	 * @return Data_Request The data request.
	 */
	private function get_report_data_request( $start_date, $end_date ) {
		$report_data = array(
			'startDate'     => $start_date,
			'endDate'       => $end_date,
			'dimensions'    => array( 'pagePathPlusQueryString' ),
			'metrics'       => array( array( 'name' => 'screenPageViews' ) ),
			'orderby'       => array(
				array(
					'metric' => array( 'metricName' => 'screenPageViews' ),
					'desc'   => true,
				),
			),
			// Many URLs can show one post, and some show no single post, so the
			// report asks for many more URLs than posts.
			'limit'         => 1000,
			// The report keeps rows with no views by default, which would list
			// posts with 0 views.
			'keepEmptyRows' => false,
		);

		$product_type = Product_Post_Type::get();
		$settings     = $this->settings->get();

		// Leave product URLs out of the report, so their views count in neither
		// the posts nor the total.
		if ( $product_type && class_exists( 'WooCommerce' ) && empty( $settings[ Settings::FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ] ) ) {
			$report_data['dimensionFilters'] = array(
				'pagePathPlusQueryString' => array(
					'filterType'    => 'stringFilter',
					'matchType'     => 'PARTIAL_REGEXP',
					'value'         => $this->get_product_query_string_pattern( $product_type ),
					'notExpression' => true,
				),
			);
		}

		return new Data_Request( 'GET', 'modules', Analytics_4::MODULE_SLUG, 'report', $report_data );
	}

	/**
	 * Gets the pattern that matches the query string of a single product's URL, such as `?product=hoodie`, and not the shop's `?post_type=product`.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_Post_Type $product_type The site's product post type, whose name and query var the pattern matches.
	 * @return string The pattern.
	 */
	private function get_product_query_string_pattern( WP_Post_Type $product_type ) {
		// Analytics reads the pattern as RE2, which has no lookahead, so each
		// order of `post_type` and `p` is an alternative of its own. WordPress
		// limits post type names and query vars to characters RE2 reads as plain
		// text, so neither needs escaping.
		$alternatives = array(
			'post_type=' . $product_type->name . '&(?:[^&]*&)*p=[0-9]',
			'p=[0-9]+&(?:[^&]*&)*post_type=' . $product_type->name . '(?:&|$)',
		);

		if ( $product_type->query_var ) {
			array_unshift( $alternatives, $product_type->query_var . '=[^&]' );
		}

		return '[?&](?:' . implode( '|', $alternatives ) . ')';
	}
}
