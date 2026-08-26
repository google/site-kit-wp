<?php
/**
 * Trait Google\Site_Kit\Modules\Search_Console\Datapoints\Search_Analytics_Trait
 *
 * @package   Google\Site_Kit\Modules\Search_Console\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Search_Console\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Util\Date;
use Google\Site_Kit\Core\Util\Google_URL_Normalizer;
use Google\Site_Kit\Modules\Search_Console\Settings;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\ApiDimensionFilter as Google_Service_SearchConsole_ApiDimensionFilter;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\ApiDimensionFilterGroup as Google_Service_SearchConsole_ApiDimensionFilterGroup;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\SearchAnalyticsQueryRequest as Google_Service_SearchConsole_SearchAnalyticsQueryRequest;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\SearchAnalyticsQueryResponse;

/**
 * Shared search analytics request and response handling for Search Console datapoints.
 *
 * Consuming classes are expected to extend {@see \Google\Site_Kit\Core\Modules\Datapoint}
 * so that `get_service()` resolves the Search Console service, and to populate the
 * `$settings` and `$context` properties declared here from their constructor.
 *
 * @since 1.186.0
 * @access private
 * @ignore
 */
trait Search_Analytics_Trait {

	/**
	 * Module settings instance.
	 *
	 * @since 1.186.0
	 * @var Settings
	 */
	protected $settings;

	/**
	 * Context instance.
	 *
	 * @since 1.186.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Prepares search analytics request arguments from raw request data.
	 *
	 * @since 1.186.0
	 *
	 * @param array $request_data Raw request data.
	 * @return array Prepared request arguments.
	 */
	protected function prepare_search_analytics_request_args( array $request_data ) {
		$start_date = isset( $request_data['startDate'] ) ? $request_data['startDate'] : '';
		$end_date   = isset( $request_data['endDate'] ) ? $request_data['endDate'] : '';

		if ( ! strtotime( $start_date ) || ! strtotime( $end_date ) ) {
			list ( $start_date, $end_date ) = Date::parse_date_range( 'last-28-days', 1, 1 );
		}

		$parsed_request = array(
			'start_date' => $start_date,
			'end_date'   => $end_date,
		);

		if ( ! empty( $request_data['url'] ) ) {
			$parsed_request['page'] = ( new Google_URL_Normalizer() )->normalize_url( $request_data['url'] );
		}

		if ( isset( $request_data['rowLimit'] ) ) {
			$parsed_request['row_limit'] = $request_data['rowLimit'];
		}

		if ( isset( $request_data['limit'] ) ) {
			$parsed_request['row_limit'] = $request_data['limit'];
		}

		$dimensions = $this->parse_dimensions_list( isset( $request_data['dimensions'] ) ? $request_data['dimensions'] : array() );
		if ( ! empty( $dimensions ) ) {
			$parsed_request['dimensions'] = $dimensions;
		}

		return $parsed_request;
	}

	/**
	 * Creates a new Search Console analytics request for the current site and given arguments.
	 *
	 * @since 1.186.0
	 *
	 * @param array $args {
	 *     Optional. Additional arguments.
	 *
	 *     @type array  $dimensions List of request dimensions. Default empty array.
	 *     @type string $start_date Start date in 'Y-m-d' format. Default empty string.
	 *     @type string $end_date   End date in 'Y-m-d' format. Default empty string.
	 *     @type string $page       Specific page URL to filter by. Default empty string.
	 *     @type int    $row_limit  Limit of rows to return. Default 1000.
	 * }
	 * @return mixed Search Console analytics request instance.
	 */
	protected function create_search_analytics_request( array $args = array() ) {
		$args = wp_parse_args(
			$args,
			array(
				'dimensions' => array(),
				'start_date' => '',
				'end_date'   => '',
				'page'       => '',
				'row_limit'  => 1000,
			)
		);

		$property_id = $this->get_property_id();

		$request = new Google_Service_SearchConsole_SearchAnalyticsQueryRequest();
		if ( ! empty( $args['dimensions'] ) ) {
			$request->setDimensions( (array) $args['dimensions'] );
		}
		if ( ! empty( $args['start_date'] ) ) {
			$request->setStartDate( $args['start_date'] );
		}
		if ( ! empty( $args['end_date'] ) ) {
			$request->setEndDate( $args['end_date'] );
		}

		$request->setDataState( 'all' );

		$filters = array();

		// If domain property, limit data to URLs that are part of the current site.
		if ( 0 === strpos( $property_id, 'sc-domain:' ) ) {
			$scope_site_filter = new Google_Service_SearchConsole_ApiDimensionFilter();
			$scope_site_filter->setDimension( 'page' );
			$scope_site_filter->setOperator( 'contains' );
			$scope_site_filter->setExpression( esc_url_raw( $this->context->get_reference_site_url() ) );
			$filters[] = $scope_site_filter;
		}

		// If specific URL requested, limit data to that URL.
		if ( ! empty( $args['page'] ) ) {
			$single_url_filter = new Google_Service_SearchConsole_ApiDimensionFilter();
			$single_url_filter->setDimension( 'page' );
			$single_url_filter->setOperator( 'equals' );
			$single_url_filter->setExpression( rawurldecode( esc_url_raw( $args['page'] ) ) );
			$filters[] = $single_url_filter;
		}

		// If there are relevant filters, add them to the request.
		if ( ! empty( $filters ) ) {
			$filter_group = new Google_Service_SearchConsole_ApiDimensionFilterGroup();
			$filter_group->setGroupType( 'and' );
			$filter_group->setFilters( $filters );
			$request->setDimensionFilterGroups( array( $filter_group ) );
		}

		if ( ! empty( $args['row_limit'] ) ) {
			$request->setRowLimit( $args['row_limit'] );
		}

		return $this->get_service()
			->searchanalytics
			->query( $property_id, $request );
	}

	/**
	 * Parses search analytics response rows.
	 *
	 * @since 1.186.0
	 *
	 * @param mixed $response Request response.
	 * @return mixed Response rows, or the response itself when rows are unavailable.
	 */
	protected function parse_search_analytics_rows( $response ) {
		if ( $response instanceof SearchAnalyticsQueryResponse ) {
			return $response->getRows();
		}

		if ( is_object( $response ) && method_exists( $response, 'getRows' ) ) {
			return $response->getRows();
		}

		return $response;
	}

	/**
	 * Gets the property ID.
	 *
	 * @since 1.186.0
	 *
	 * @return string Property ID URL if set, or empty string.
	 */
	protected function get_property_id() {
		$option = $this->settings->get();

		return $option['propertyID'];
	}

	/**
	 * Parses a list of dimensions into an array of non-empty strings.
	 *
	 * Mirrors {@see \Google\Site_Kit\Core\Modules\Module::parse_string_list()}, which is
	 * not available here since datapoints do not extend `Module`.
	 *
	 * @since 1.186.0
	 *
	 * @param string|array $items Items to parse.
	 * @return array An array of string items.
	 */
	private function parse_dimensions_list( $items ) {
		if ( is_string( $items ) ) {
			$items = explode( ',', $items );
		}

		if ( ! is_array( $items ) || empty( $items ) ) {
			return array();
		}

		$items = array_map(
			function ( $item ) {
				if ( ! is_string( $item ) ) {
					return false;
				}

				$item = trim( $item );
				if ( empty( $item ) ) {
					return false;
				}

				return $item;
			},
			$items
		);

		return array_values( array_filter( $items ) );
	}
}
