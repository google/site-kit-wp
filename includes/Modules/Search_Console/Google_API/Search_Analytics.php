<?php
/**
 * Class Google\Site_Kit\Modules\Search_Console\Google_API\Search_Analytics
 *
 * @package   Google\Site_Kit\Modules\Search_Console\Google_API
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Search_Console\Google_API;

use Google\Site_Kit\Core\Google_API\Google_API;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\Util\Dates;
use Google\Site_Kit\Core\Util\Google_URL_Normalizer;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole as Google_Service_SearchConsole;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\ApiDimensionFilter as Google_Service_SearchConsole_ApiDimensionFilter;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\ApiDimensionFilterGroup as Google_Service_SearchConsole_ApiDimensionFilterGroup;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\SearchAnalyticsQueryRequest as Google_Service_SearchConsole_SearchAnalyticsQueryRequest;

/**
 * Class for searchanalytics API.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Search_Analytics extends Google_API {

	/**
	 * Parses request data and returns prepared arguments for the Google API call.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data Request data.
	 * @return array Arguments for the Google API call.
	 */
	public function parse_request_data( Data_Request $data ) {
		$start_date = $data['startDate'];
		$end_date   = $data['endDate'];

		if ( ! strtotime( $start_date ) || ! strtotime( $end_date ) ) {
			list ( $start_date, $end_date ) = Dates::parse_date_range(
				$data['dateRange'] ?: 'last-28-days',
				$data['compareDateRanges'] ? 2 : 1,
				1 // Offset.
			);
		}

		$data_request = array(
			'start_date' => $start_date,
			'end_date'   => $end_date,
		);

		if ( ! empty( $data['url'] ) ) {
			$data_request['page'] = ( new Google_URL_Normalizer() )->normalize_url( $data['url'] );
		}

		if ( isset( $data['limit'] ) ) {
			$data_request['row_limit'] = $data['limit'];
		}

		$dimensions = wp_parse_list( $data['dimensions'] );
		if ( is_array( $dimensions ) && ! empty( $dimensions ) ) {
			$data_request['dimensions'] = $dimensions;
		}

		return $data_request;
	}

	/**
	 * Fetches Google service API.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $params API request parameters.
	 * @return mixed API response.
	 */
	public function fetch( array $params = array() ) {
		$args = wp_parse_args(
			$params,
			array(
				'propertyID' => '',
				'dimensions' => array(),
				'start_date' => '',
				'end_date'   => '',
				'page'       => '',
				'row_limit'  => 1000,
			)
		);

		$request = new Google_Service_SearchConsole_SearchAnalyticsQueryRequest();
		$request->setDataState( 'all' );

		$filters = array();

		if ( ! empty( $args['dimensions'] ) ) {
			$request->setDimensions( (array) $args['dimensions'] );
		}

		if ( ! empty( $args['start_date'] ) ) {
			$request->setStartDate( $args['start_date'] );
		}

		if ( ! empty( $args['end_date'] ) ) {
			$request->setEndDate( $args['end_date'] );
		}

		if ( ! empty( $args['row_limit'] ) ) {
			$request->setRowLimit( $args['row_limit'] );
		}

		// If domain property, limit data to URLs that are part of the current site.
		if ( 0 === strpos( $args['propertyID'], 'sc-domain:' ) ) {
			$filters[] = $this->get_site_filter();
		}

		// If specific URL requested, limit data to that URL.
		if ( ! empty( $args['page'] ) ) {
			$filters[] = $this->get_page_filter( $args['page'] );
		}

		// If there are relevant filters, add them to the request.
		if ( ! empty( $filters ) ) {
			$filter_group = new Google_Service_SearchConsole_ApiDimensionFilterGroup();
			$filter_group->setGroupType( 'and' );
			$filter_group->setFilters( $filters );
			$request->setDimensionFilterGroups( array( $filter_group ) );
		}

		$client         = $this->authentication->get_oauth_client()->get_client();
		$search_console = new Google_Service_SearchConsole( $client );

		return $search_console->searchanalytics->query( $args['propertyID'], $request );
	}

	/**
	 * Returns site filter.
	 *
	 * @since n.e.x.t
	 *
	 * @return Google_Service_SearchConsole_ApiDimensionFilter Site filter instance.
	 */
	protected function get_site_filter() {
		$filter = new Google_Service_SearchConsole_ApiDimensionFilter();

		$filter->setDimension( 'page' );
		$filter->setOperator( 'contains' );
		$filter->setExpression( esc_url_raw( $this->context->get_reference_site_url() ) );

		return $filter;
	}

	/**
	 * Returns page filter.
	 *
	 * @since n.e.x.t
	 *
	 * @param int|string $page Page number.
	 * @return Google_Service_SearchConsole_ApiDimensionFilter Page filter instance.
	 */
	protected function get_page_filter( $page ) {
		$filter = new Google_Service_SearchConsole_ApiDimensionFilter();

		$filter->setDimension( 'page' );
		$filter->setOperator( 'equals' );
		$filter->setExpression( rawurldecode( esc_url_raw( $args['page'] ) ) );

		return $filter;
	}

}
