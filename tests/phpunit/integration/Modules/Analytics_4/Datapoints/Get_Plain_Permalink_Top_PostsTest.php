<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Plain_Permalink_Top_PostsTest
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Plain_Permalink_Top_Posts;
use Google\Site_Kit\Modules\Analytics_4\Plain_Permalink_Top_Posts;
use Google\Site_Kit\Tests\Dashboard_Sharing_Trait;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData as Google_Service_AnalyticsData;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\DimensionValue;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\MetricValue;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\Row;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData\RunReportResponse;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_REST_Request;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Plain_Permalink_Top_PostsTest extends TestCase {

	use Dashboard_Sharing_Trait;

	/**
	 * Analytics_4 instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	/**
	 * Get_Plain_Permalink_Top_Posts datapoint instance.
	 *
	 * @var Get_Plain_Permalink_Top_Posts
	 */
	private $datapoint;

	/**
	 * Whether the datapoint reads the request as a view-only user's.
	 *
	 * @var bool
	 */
	private $is_shared_request = false;

	/**
	 * The last report request that reached the fake Analytics.
	 *
	 * @var Request|null
	 */
	private $report_request;

	/**
	 * Modules instance the REST route answers from.
	 *
	 * @var Modules
	 */
	private $modules;

	public function set_up() {
		parent::set_up();

		$context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options         = new Options( $context );
		$user            = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options    = new User_Options( $context, $user->ID );
		$authentication  = new Authentication( $context, $options, $user_options );
		$this->analytics = new Analytics_4( $context, $options, $user_options, $authentication );

		$this->analytics->get_client()->withDefer( true );
		$service = new Google_Service_AnalyticsData( $this->analytics->get_client() );

		$this->datapoint = new Get_Plain_Permalink_Top_Posts(
			array(
				'service'           => fn () => $service,
				'settings'          => $this->analytics->get_settings(),
				'context'           => $context,
				'is_shared_request' => fn () => $this->is_shared_request,
				'top_posts'         => new Plain_Permalink_Top_Posts( $context ),
			)
		);

		FakeHttp::fake_google_http_handler(
			$this->analytics->get_client(),
			function ( Request $request ) {
				$this->report_request = $request;

				return new FulfilledPromise( new Response( 200, array(), wp_json_encode( new RunReportResponse() ) ) );
			}
		);

		// With the `freshData` flag off, the module has no `plain-permalink-top-posts`
		// datapoint, and `merge()` ignores the products setting.
		$this->enable_feature( 'freshData' );
		$this->analytics->get_settings()->merge( array( 'propertyID' => '12345' ) );
		$this->set_permalink_structure( '' );

		wp_set_current_user( $user->ID );
	}

	public function tear_down() {
		if ( post_type_exists( 'product' ) ) {
			unregister_post_type( 'product' );
		}

		parent::tear_down();

		// Leave no REST server of `share_analytics_with_editors()` behind for the
		// next test class.
		unset( $GLOBALS['wp_rest_server'] );
	}

	/**
	 * Builds the data request of the datapoint with the given parameters.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $params The parameters of the request, such as `array( 'limit' => 3 )`.
	 * @return Data_Request The data request.
	 */
	private function build_data_request( array $params ) {
		return new Data_Request( 'GET', 'modules', 'analytics-4', 'plain-permalink-top-posts', $params );
	}

	/**
	 * Sends the report request of the datapoint to the fake Analytics, and gets the body Analytics receives.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $params The parameters of the request, such as `array( 'limit' => 3 )`.
	 * @return array The body of the report request, decoded from JSON.
	 */
	private function get_report_request_body( array $params ) {
		$request = $this->datapoint->create_request( $this->build_data_request( $params ) );

		$this->analytics->get_client()->execute( $request );

		return json_decode( (string) $this->report_request->getBody(), true );
	}

	/**
	 * Gets the product filter of a report request, the `notExpression` on `pagePathPlusQueryString`.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $body The body of the report request, decoded from JSON.
	 * @return array|null The expression, or `null` where the report has none.
	 */
	private function get_product_filter( array $body ) {
		foreach ( $body['dimensionFilter']['andGroup']['expressions'] as $expression ) {
			if ( 'pagePathPlusQueryString' === ( $expression['notExpression']['filter']['fieldName'] ?? null ) ) {
				return $expression;
			}
		}

		return null;
	}

	/**
	 * Gets whether the pattern of a product filter matches each of the given URLs.
	 *
	 * Analytics reads the pattern as RE2, and `preg_match()` matches these URLs
	 * the same way.
	 *
	 * @since n.e.x.t
	 *
	 * @param array    $product_filter The product filter, as `get_product_filter()` returns it.
	 * @param string[] $urls           The URLs, each a path with its query string, such as `/?product=hoodie`.
	 * @return array Whether the pattern matches each URL, keyed by the URL.
	 */
	private function get_product_filter_matches( array $product_filter, array $urls ) {
		$pattern = $product_filter['notExpression']['filter']['stringFilter']['value'];

		return array_combine( $urls, array_map( fn ( $url ) => 1 === preg_match( "~$pattern~", $url ), $urls ) );
	}

	/**
	 * Makes `class_exists( 'WooCommerce' )` true for the rest of the process, as an active WooCommerce does.
	 *
	 * `class_alias()` can't be undone, so each test that calls this runs in a
	 * process of its own.
	 *
	 * @since n.e.x.t
	 */
	private function activate_woocommerce() {
		class_alias( __CLASS__, 'WooCommerce' );
	}

	/**
	 * Builds a report response with the views of each URL and the total views of the report.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $views_by_url The views of each URL, most viewed first, such as `array( '/?p=123' => 10 )`.
	 * @param int   $total        The views of every URL of the report.
	 * @return RunReportResponse The report response.
	 */
	private function create_report_response( array $views_by_url, $total ) {
		$rows = array();

		foreach ( $views_by_url as $url => $views ) {
			$dimension_value = new DimensionValue();
			$dimension_value->setValue( $url );

			$metric_value = new MetricValue();
			$metric_value->setValue( (string) $views );

			$row = new Row();
			$row->setDimensionValues( array( $dimension_value ) );
			$row->setMetricValues( array( $metric_value ) );

			$rows[] = $row;
		}

		$total_value = new MetricValue();
		$total_value->setValue( (string) $total );

		$totals_row = new Row();
		$totals_row->setMetricValues( array( $total_value ) );

		$response = new RunReportResponse();
		$response->setRows( $rows );
		$response->setTotals( array( $totals_row ) );

		return $response;
	}

	/**
	 * Connects Analytics with the token `valid-token` of the given administrator, who owns it, and shares it with the Editor role.
	 *
	 * The REST route then answers from `$this->modules`, so a test calls
	 * `switch_to_user()` before each request.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $owner_id The ID of the administrator who owns Analytics.
	 */
	private function share_analytics_with_editors( $owner_id ) {
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options      = new Options( $context );
		$user_options = new User_Options( $context, $owner_id );

		$this->authenticate_user( $owner_id, array( Analytics_4::READONLY_SCOPE ) );

		$this->analytics->get_settings()->merge(
			array(
				'accountID'       => '67890',
				'webDataStreamID' => '13579',
				'measurementID'   => 'G-ABCDEF1234',
				'ownerID'         => $owner_id,
			)
		);
		$this->share_modules_with_editors( array( Analytics_4::MODULE_SLUG ) );

		$this->modules = new Modules( $context, $options, $user_options, new Authentication( $context, $options, $user_options ) );
		$options->set( Modules::OPTION_ACTIVE_MODULES, array( Analytics_4::MODULE_SLUG ) );

		$this->register_modules_rest_routes( $this->modules );
	}

	/**
	 * Makes the given user the current one, and builds that user's Analytics module and `Permissions` for the REST route.
	 *
	 * The module's reports go to a fake Analytics, which answers with the given
	 * views and saves each `Authorization` header in `$google_api_authorizations`.
	 *
	 * @since n.e.x.t
	 *
	 * @param int   $user_id      The ID of the user to switch to.
	 * @param array $views_by_url The views of each URL that the fake Analytics answers with, most viewed first, such as `array( '/?p=123' => 10 )`.
	 */
	private function switch_to_user( $user_id, array $views_by_url ) {
		wp_set_current_user( $user_id );

		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options      = new Options( $context );
		$user_options = new User_Options( $context, $user_id );
		$analytics    = new Analytics_4( $context, $options, $user_options, new Authentication( $context, $options, $user_options ) );
		$report       = wp_json_encode( $this->create_report_response( $views_by_url, array_sum( $views_by_url ) )->toSimpleObject() );

		// A module sends a request with the current user's token, or with its
		// owner's token when the current user reads a shared module.
		$this->fake_google_api(
			array( $analytics->get_client(), $analytics->get_owner_oauth_client()->get_client() ),
			fn () => new Response( 200, array(), $report )
		);

		$this->force_set_property( $this->modules, 'modules', array( Analytics_4::MODULE_SLUG => $analytics ) );

		$this->register_permissions_for_user( $user_id, $this->modules );
	}

	/**
	 * Sends a request to the `plain-permalink-top-posts` REST route for the three posts with the most views on 2026-10-21 and 2026-10-22.
	 *
	 * @since n.e.x.t
	 *
	 * @return \WP_REST_Response The response.
	 */
	private function request_top_posts() {
		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/modules/analytics-4/data/plain-permalink-top-posts' );
		$request->set_query_params(
			array(
				'startDate' => '2026-10-21',
				'endDate'   => '2026-10-22',
				'limit'     => 3,
			)
		);

		return rest_get_server()->dispatch( $request );
	}

	public function test_create_request__requests_the_1000_urls_with_the_most_views() {
		$body = $this->get_report_request_body(
			array(
				'startDate' => '2026-10-21',
				'endDate'   => '2026-10-22',
				'limit'     => 3,
			)
		);

		$this->assertEquals(
			array(
				'dateRanges' => array(
					array(
						'startDate' => '2026-10-21',
						'endDate'   => '2026-10-22',
					),
				),
				'dimensions' => array( array( 'name' => 'pagePathPlusQueryString' ) ),
				'metrics'    => array( array( 'name' => 'screenPageViews' ) ),
				'orderBys'   => array(
					array(
						'metric' => array( 'metricName' => 'screenPageViews' ),
						'desc'   => true,
					),
				),
				'limit'      => 1000,
			),
			array_intersect_key( $body, array_flip( array( 'dateRanges', 'dimensions', 'metrics', 'orderBys', 'limit' ) ) ),
			'The report should ask for the views of the 1,000 URLs with the most views over the dates, most first.'
		);
	}

	public function test_create_request__leaves_out_the_urls_with_no_views() {
		$body = $this->get_report_request_body(
			array(
				'startDate' => '2026-10-21',
				'endDate'   => '2026-10-22',
				'limit'     => 3,
			)
		);

		$this->assertFalse( $body['keepEmptyRows'], 'The report request should ask Analytics to leave out the URLs with no views.' );
	}

	public function test_create_request__sends_the_report_to_the_connected_property() {
		$request = $this->datapoint->create_request(
			$this->build_data_request(
				array(
					'startDate' => '2026-10-21',
					'endDate'   => '2026-10-22',
					'limit'     => 3,
				)
			)
		);

		$this->analytics->get_client()->execute( $request );

		$this->assertEquals( 'https://analyticsdata.googleapis.com/v1beta/properties/12345:runReport', $this->report_request->getUri(), 'The report should go to the connected Analytics property.' );
	}

	public function test_create_request__ignores_every_other_report_param_of_the_request() {
		$body = $this->get_report_request_body(
			array(
				'startDate'        => '2026-10-21',
				'endDate'          => '2026-10-22',
				'limit'            => 3,
				'dimensions'       => array( 'date' ),
				'metrics'          => array( array( 'name' => 'totalUsers' ) ),
				'dimensionFilters' => array( 'pagePathPlusQueryString' => '/?p=1&key=wc_order_a' ),
			)
		);

		$this->assertEquals(
			array(
				'dimensions' => array( array( 'name' => 'pagePathPlusQueryString' ) ),
				'metrics'    => array( array( 'name' => 'screenPageViews' ) ),
				'filters'    => array( 'hostName' ),
			),
			array(
				'dimensions' => $body['dimensions'],
				'metrics'    => $body['metrics'],
				'filters'    => array_map(
					fn ( $expression ) => $expression['filter']['fieldName'] ?? $expression['notExpression']['filter']['fieldName'],
					$body['dimensionFilter']['andGroup']['expressions']
				),
			),
			'The report should keep its own dimension and metric, and filter by the host alone, whatever else the request sends.'
		);
	}

	/**
	 * @dataProvider data_missing_params
	 *
	 * @param string $param The parameter the request leaves out.
	 */
	public function test_create_request__throws_for_a_missing_param( $param ) {
		$params = array(
			'startDate' => '2026-10-21',
			'endDate'   => '2026-10-22',
			'limit'     => 3,
		);
		unset( $params[ $param ] );

		$this->expectException( Missing_Required_Param_Exception::class );
		$this->expectExceptionMessage( "Request parameter is empty: $param." );

		$this->datapoint->create_request( $this->build_data_request( $params ) );
	}

	public function data_missing_params() {
		return array(
			'no start date' => array( 'startDate' ),
			'no end date'   => array( 'endDate' ),
			'no limit'      => array( 'limit' ),
		);
	}

	/**
	 * @dataProvider data_invalid_params
	 *
	 * @param string $param The parameter with an invalid value.
	 * @param mixed  $value The invalid value, such as `0` for `limit`.
	 */
	public function test_create_request__throws_for_an_invalid_param( $param, $value ) {
		$params = array(
			'startDate' => '2026-10-21',
			'endDate'   => '2026-10-22',
			'limit'     => 3,
		);

		$params[ $param ] = $value;

		$this->expectException( Invalid_Param_Exception::class );
		$this->expectExceptionMessage( "Invalid parameter: $param." );

		$this->datapoint->create_request( $this->build_data_request( $params ) );
	}

	public function data_invalid_params() {
		return array(
			'a start date that is no date' => array( 'startDate', 'not a date' ),
			// A query string can send a list in place of a date, such as
			// `startDate[]=2026-10-21`.
			'a start date that is a list'  => array( 'startDate', array( '2026-10-21' ) ),
			'an end date that is no date'  => array( 'endDate', '2026-13-45' ),
			'a limit of 0'                 => array( 'limit', '0' ),
			'a limit of 51'                => array( 'limit', '51' ),
			'a limit that is no number'    => array( 'limit', 'three' ),
			'a limit with a fraction'      => array( 'limit', '2.5' ),
		);
	}

	/**
	 * @dataProvider data_valid_limits
	 *
	 * @param string $limit A limit at an end of the range, such as `1`.
	 */
	public function test_create_request__accepts_a_limit_at_each_end_of_the_range( $limit ) {
		$body = $this->get_report_request_body(
			array(
				'startDate' => '2026-10-21',
				'endDate'   => '2026-10-22',
				'limit'     => $limit,
			)
		);

		$this->assertEquals( 1000, $body['limit'], "A limit of $limit posts should run the report of 1,000 URLs." );
	}

	public function data_valid_limits() {
		return array(
			'1 post'   => array( '1' ),
			'50 posts' => array( '50' ),
		);
	}

	public function test_create_request__returns_an_error_with_no_property_id() {
		$this->analytics->get_settings()->merge( array( 'propertyID' => '' ) );

		$request = $this->datapoint->create_request(
			$this->build_data_request(
				array(
					'startDate' => '2026-10-21',
					'endDate'   => '2026-10-22',
					'limit'     => 3,
				)
			)
		);

		$this->assertWPError( $request, 'The datapoint should return an error with no connected Analytics property.' );
		$this->assertSame( 'missing_required_setting', $request->get_error_code(), 'The error should be `missing_required_setting` with no connected Analytics property.' );
	}

	public function test_create_request__runs_the_report_for_a_view_only_user() {
		$this->is_shared_request = true;

		$body = $this->get_report_request_body(
			array(
				'startDate' => '2026-10-21',
				'endDate'   => '2026-10-22',
				'limit'     => 3,
			)
		);

		$this->assertEquals( array( array( 'name' => 'pagePathPlusQueryString' ) ), $body['dimensions'], 'The report request of a view-only user should have the `pagePathPlusQueryString` dimension, which no shared `GET:report` allows.' );
	}

	public function test_create_request__returns_an_error_for_a_view_only_user_where_page_views_are_not_shareable() {
		$this->is_shared_request = true;

		add_filter( 'googlesitekit_shareable_analytics_4_metrics', fn () => array( 'sessions' ) );

		$request = $this->datapoint->create_request(
			$this->build_data_request(
				array(
					'startDate' => '2026-10-21',
					'endDate'   => '2026-10-22',
					'limit'     => 3,
				)
			)
		);

		$this->assertWPError( $request, 'The datapoint should return an error for a view-only user where the site leaves `screenPageViews` out of the shareable metrics.' );
		$this->assertSame( 'Unsupported metric requested: screenPageViews', $request->get_error_message(), 'The error of a view-only user should say that `screenPageViews` is unsupported where the site leaves it out of the shareable metrics.' );
		$this->assertSame( 'invalid_analytics_4_report_metrics', $request->get_error_code(), 'The error of a view-only user should be `invalid_analytics_4_report_metrics` where `screenPageViews` is not shareable.' );
	}

	public function test_create_request__runs_the_report_for_a_user_with_their_own_access_where_page_views_are_not_shareable() {
		add_filter( 'googlesitekit_shareable_analytics_4_metrics', fn () => array( 'sessions' ) );

		$body = $this->get_report_request_body(
			array(
				'startDate' => '2026-10-21',
				'endDate'   => '2026-10-22',
				'limit'     => 3,
			)
		);

		$this->assertEquals( array( array( 'name' => 'screenPageViews' ) ), $body['metrics'], 'The report request of a user who reads with their own access should have the `screenPageViews` metric, whatever metrics are shareable.' );
	}

	public function test_create_request__sends_no_product_filter_with_woocommerce_inactive() {
		register_post_type( 'product', array( 'public' => true ) );
		$this->analytics->get_settings()->merge( array( 'freshDataIncludesWooCommerceProducts' => false ) );

		$body = $this->get_report_request_body(
			array(
				'startDate' => '2026-10-21',
				'endDate'   => '2026-10-22',
				'limit'     => 3,
			)
		);

		$this->assertNull( $this->get_product_filter( $body ), 'The report should keep the product URLs with WooCommerce inactive, because the Recent activity tab hides products only while WooCommerce is active.' );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_create_request__sends_a_product_filter_that_matches_only_the_urls_of_single_products_with_the_products_setting_off() {
		$this->activate_woocommerce();
		register_post_type( 'product', array( 'public' => true ) );
		$this->analytics->get_settings()->merge( array( 'freshDataIncludesWooCommerceProducts' => false ) );

		$body = $this->get_report_request_body(
			array(
				'startDate' => '2026-10-21',
				'endDate'   => '2026-10-22',
				'limit'     => 3,
			)
		);

		$product_filter = $this->get_product_filter( $body );
		$urls           = array(
			'/?product=hoodie',
			'/?product=hoodie&attribute_pa_color=red',
			'/?post_type=product&p=5',
			'/?p=5&post_type=product',
			'/?post_type=product&utm_source=x&p=5',
			'/?p=5&utm_source=x&post_type=product',
			'/?p=5&post_type=product&utm_source=x',
			'/?post_type=product',
			'/?s=hats&post_type=product',
			'/?post_type=product&p=hoodie',
			'/?p=hoodie&post_type=product',
			'/?p=&post_type=product',
			'/?top=5&post_type=product',
			'/?product_cat=hats',
			'/?post_type=products&p=5',
			'/?p=5&post_type=products',
			'/?featured_product=hoodie',
			'/?product=',
			'/?product=&utm_source=x',
			'/?p=5',
		);

		$this->assertSame(
			array(
				'fieldName' => 'pagePathPlusQueryString',
				'matchType' => 'PARTIAL_REGEXP',
			),
			array(
				'fieldName' => $product_filter['notExpression']['filter']['fieldName'] ?? null,
				'matchType' => $product_filter['notExpression']['filter']['stringFilter']['matchType'] ?? null,
			),
			'The product filter should leave out each URL of the report where its pattern matches any part of `pagePathPlusQueryString`, with the products setting off.'
		);
		$this->assertSame(
			array(
				'/?product=hoodie'                        => true,
				'/?product=hoodie&attribute_pa_color=red' => true,
				'/?post_type=product&p=5'                 => true,
				'/?p=5&post_type=product'                 => true,
				'/?post_type=product&utm_source=x&p=5'    => true,
				'/?p=5&utm_source=x&post_type=product'    => true,
				'/?p=5&post_type=product&utm_source=x'    => true,
				'/?post_type=product'                     => false,
				'/?s=hats&post_type=product'              => false,
				'/?post_type=product&p=hoodie'            => false,
				'/?p=hoodie&post_type=product'            => false,
				'/?p=&post_type=product'                  => false,
				'/?top=5&post_type=product'               => false,
				'/?product_cat=hats'                      => false,
				'/?post_type=products&p=5'                => false,
				'/?p=5&post_type=products'                => false,
				'/?featured_product=hoodie'               => false,
				'/?product='                              => false,
				'/?product=&utm_source=x'                 => false,
				'/?p=5'                                   => false,
			),
			$this->get_product_filter_matches( $product_filter, $urls ),
			'The product filter should match the URL of each single product, by its query var or by its post type with an ID in either order, and no shop, search, ID that is no number, query var that ends in `p`, category, other post type, product query var with no slug or plain post.'
		);
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_create_request__leaves_out_the_urls_of_the_product_post_type_and_query_var_of_the_site() {
		$this->activate_woocommerce();
		register_post_type(
			'digital_product',
			array(
				'public'    => true,
				'query_var' => 'item',
			)
		);
		add_filter( 'googlesitekit_product_post_type', fn () => 'digital_product' );
		$this->analytics->get_settings()->merge( array( 'freshDataIncludesWooCommerceProducts' => false ) );

		$body = $this->get_report_request_body(
			array(
				'startDate' => '2026-10-21',
				'endDate'   => '2026-10-22',
				'limit'     => 3,
			)
		);

		$this->assertSame(
			array(
				'/?item=ebook'                    => true,
				'/?post_type=digital_product&p=5' => true,
				'/?p=5&post_type=digital_product' => true,
				'/?product=hoodie'                => false,
				'/?post_type=product&p=5'         => false,
			),
			$this->get_product_filter_matches(
				$this->get_product_filter( $body ),
				array(
					'/?item=ebook',
					'/?post_type=digital_product&p=5',
					'/?p=5&post_type=digital_product',
					'/?product=hoodie',
					'/?post_type=product&p=5',
				)
			),
			'The product filter should match a single product by the post type and the query var of the site, such as `digital_product` and `item`, and no URL that names `product`.'
		);
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_create_request__leaves_out_a_single_product_by_its_post_type_and_id_where_the_product_post_type_has_no_query_var() {
		$this->activate_woocommerce();
		register_post_type(
			'product',
			array(
				'public'    => true,
				'query_var' => false,
			)
		);
		$this->analytics->get_settings()->merge( array( 'freshDataIncludesWooCommerceProducts' => false ) );

		$body = $this->get_report_request_body(
			array(
				'startDate' => '2026-10-21',
				'endDate'   => '2026-10-22',
				'limit'     => 3,
			)
		);

		// `/?=hoodie` has a query var with no name, which only a query var
		// alternative built from the missing query var matches.
		$this->assertSame(
			array(
				'/?post_type=product&p=5' => true,
				'/?p=5&post_type=product' => true,
				'/?product=hoodie'        => false,
				'/?=hoodie'               => false,
			),
			$this->get_product_filter_matches(
				$this->get_product_filter( $body ),
				array(
					'/?post_type=product&p=5',
					'/?p=5&post_type=product',
					'/?product=hoodie',
					'/?=hoodie',
				)
			),
			'The product filter should match a product by its post type and ID alone, and no `product` query var or query var with no name, where the product post type has no query var.'
		);
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_create_request__sends_no_product_filter_with_the_products_setting_on() {
		$this->activate_woocommerce();
		register_post_type( 'product', array( 'public' => true ) );
		$this->analytics->get_settings()->merge( array( 'freshDataIncludesWooCommerceProducts' => true ) );

		$body = $this->get_report_request_body(
			array(
				'startDate' => '2026-10-21',
				'endDate'   => '2026-10-22',
				'limit'     => 3,
			)
		);

		$this->assertNull( $this->get_product_filter( $body ), 'The report should keep the product URLs with the products setting on.' );
	}

	/**
	 * @runInSeparateProcess
	 */
	public function test_create_request__sends_no_product_filter_with_no_public_product_post_type() {
		$this->activate_woocommerce();
		register_post_type( 'product', array( 'public' => false ) );
		$this->analytics->get_settings()->merge( array( 'freshDataIncludesWooCommerceProducts' => false ) );

		$body = $this->get_report_request_body(
			array(
				'startDate' => '2026-10-21',
				'endDate'   => '2026-10-22',
				'limit'     => 3,
			)
		);

		$this->assertNull( $this->get_product_filter( $body ), 'The report should send no product filter where the product post type is not public.' );
	}

	public function test_parse_response__returns_the_posts_with_the_most_views_and_the_total() {
		$first_post_id  = $this->factory()->post->create( array( 'post_title' => 'Travel tips' ) );
		$second_post_id = $this->factory()->post->create( array( 'post_title' => 'Packing list' ) );

		$response = $this->create_report_response(
			array(
				"/?p=$first_post_id" => 30,
				'/?s=hats'           => 20,
				"/?p=$second_post_id&utm_source=newsletter" => 10,
			),
			75
		);

		$this->assertSame(
			array(
				'rows'  => array(
					array(
						'id'       => $first_post_id,
						'title'    => 'Travel tips',
						'url'      => "http://example.org/?p=$first_post_id",
						'pagePath' => "/?p=$first_post_id",
						'views'    => 30,
					),
					array(
						'id'       => $second_post_id,
						'title'    => 'Packing list',
						'url'      => "http://example.org/?p=$second_post_id",
						'pagePath' => "/?p=$second_post_id",
						'views'    => 10,
					),
				),
				'total' => 75,
			),
			$this->datapoint->parse_response(
				$response,
				$this->build_data_request(
					array(
						'startDate' => '2026-10-21',
						'endDate'   => '2026-10-22',
						'limit'     => 3,
					)
				)
			),
			'The response should have the posts that the URLs of the report show, and the views of the whole report as its total.'
		);
	}

	public function test_parse_response__returns_no_more_posts_than_the_limit() {
		$first_post_id  = $this->factory()->post->create();
		$second_post_id = $this->factory()->post->create();

		$response = $this->create_report_response(
			array(
				"/?p=$first_post_id"  => 30,
				"/?p=$second_post_id" => 10,
			),
			40
		);

		$parsed_response = $this->datapoint->parse_response(
			$response,
			$this->build_data_request(
				array(
					'startDate' => '2026-10-21',
					'endDate'   => '2026-10-22',
					'limit'     => 1,
				)
			)
		);

		$this->assertSame( array( $first_post_id ), array_column( $parsed_response['rows'], 'id' ), 'The response should have no more posts than the limit, the ones with the most views.' );
	}

	/**
	 * @dataProvider data_reports_with_no_rows
	 *
	 * @param string $report_label  What the report has besides its missing rows, for the assertion message.
	 * @param string $response_json The body of the report response, such as `{"totals":[{}]}`.
	 */
	public function test_parse_response__returns_no_posts_and_a_total_of_0_for_a_report_with_no_rows( $report_label, $response_json ) {
		// The Google client builds a response from the decoded JSON body this way.
		$response = new RunReportResponse( json_decode( $response_json, true ) );

		$this->assertSame(
			array(
				'rows'  => array(),
				'total' => 0,
			),
			$this->datapoint->parse_response(
				$response,
				$this->build_data_request(
					array(
						'startDate' => '2026-10-21',
						'endDate'   => '2026-10-22',
						'limit'     => 3,
					)
				)
			),
			"The response should have no posts and a total of 0 for a report with no rows and $report_label."
		);
	}

	public function data_reports_with_no_rows() {
		return array(
			'no totals'                          => array( 'no totals', '{}' ),
			'a totals row with no metric values' => array( 'a totals row with no metric values', '{"totals":[{}]}' ),
		);
	}

	public function test_get_data__returns_the_posts_of_the_owner_to_a_view_only_reader() {
		$owner_id     = get_current_user_id();
		$post_id      = $this->factory()->post->create( array( 'post_title' => 'Travel tips' ) );
		$views_by_url = array( "/?p=$post_id&utm_source=newsletter" => 10 );

		$this->share_analytics_with_editors( $owner_id );

		$this->switch_to_user( $owner_id, $views_by_url );
		$owner_response = $this->request_top_posts();

		$this->switch_to_user( $this->create_view_only_reader(), $views_by_url );
		$reader_response = $this->request_top_posts();

		$this->assertSame( 200, $reader_response->get_status(), 'The response to a view-only reader should have the status `200`.' );
		$this->assertSame( array( 'Bearer valid-token', 'Bearer valid-token' ), $this->google_api_authorizations['analyticsdata.googleapis.com'], 'The reports of the owner and of the reader should both run with the token of the administrator who owns Analytics.' );
		$this->assertSame(
			array(
				'rows'  => array(
					array(
						'id'       => $post_id,
						'title'    => 'Travel tips',
						'url'      => "http://example.org/?p=$post_id",
						'pagePath' => "/?p=$post_id",
						'views'    => 10,
					),
				),
				'total' => 10,
			),
			$reader_response->get_data(),
			'The response of a view-only reader should have each post with its permalink with no scheme or host as its page path, and no URL of the report.'
		);
		$this->assertSame( $owner_response->get_data(), $reader_response->get_data(), 'The response to a view-only reader should have the posts and the total of the response to the owner.' );
	}
}
