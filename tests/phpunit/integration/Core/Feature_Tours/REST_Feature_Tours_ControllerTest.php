<?php
/**
 * Class Google\Site_Kit\Tests\Core\Feature_Tours\REST_Feature_Tours_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Feature_Tours
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Feature_Tours;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Feature_Tours\Dismissed_Tours;
use Google\Site_Kit\Core\Feature_Tours\REST_Feature_Tours_Controller;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;
use WP_REST_Response;

class REST_Feature_Tours_ControllerTest extends TestCase {

	use RestTestTrait;

	/**
	 * Dismissed tours instance.
	 *
	 * @var Dismissed_Tours
	 */
	private $dismissed_tours;

	/**
	 * Controller instance.
	 *
	 * @var REST_Feature_Tours_Controller
	 */
	private $controller;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context               = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options          = new User_Options( $context, $user_id );
		$this->dismissed_tours = new Dismissed_Tours( $user_options );
		$this->controller      = new REST_Feature_Tours_Controller( $this->dismissed_tours );
	}

	public function tear_down() {
		parent::tear_down();
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		remove_all_filters( 'googlesitekit_apifetch_preload_paths' );

		$this->controller->register();

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ), 'Controller should register feature tours REST routes.' );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ), 'Controller should register feature tours preload paths.' );
	}

	public function test_get_dismissed_tours() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();

		$this->dismissed_tours->add( 'feature_x', 'feature_y' );

		$this->register_rest_routes();

		$request = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/dismissed-tours' );

		$this->assertTrue( current_user_can( Permissions::SETUP ), 'Current user should be allowed to read dismissed tours.' );

		$response = rest_get_server()->dispatch( $request );
		/* @var WP_REST_Response $response Response instance. */

		$this->assertEqualSets(
			array( 'feature_x', 'feature_y' ),
			$response->get_data(),
			'Get dismissed tours should contain expected values.'
		);
		$this->assertMatchesRouteResourceSchema( $response->get_data(), 'core/user/data/dismissed-tours', 'Get dismissed tours response should match its resource schema.' );
	}

	public function test_post_dismiss_tour() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();

		$this->dismissed_tours->add( 'feature_x', 'feature_y' );

		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/dismiss-tour' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug' => 'feature_z',
				),
			)
		);
		$this->assertTrue( current_user_can( Permissions::SETUP ), 'Current user should be allowed to dismiss tours.' );
		$response = rest_get_server()->dispatch( $request );
		/* @var WP_REST_Response $response Response instance. */

		$this->assertEquals( 200, $response->get_status(), 'Dismiss tour endpoint should accept valid slug.' );
		$this->assertEqualSets(
			array( 'feature_x', 'feature_y', 'feature_z' ),
			$response->get_data(),
			'Dismiss tour endpoint should return updated dismissed tours.'
		);
	}

	/**
	 * @dataProvider provider_post_dismiss_tour__invalid_data
	 *
	 * @param array  $body          Request body.
	 * @param string $expected_code Expected error code.
	 */
	public function test_post_dismiss_tour__invalid_data( $body, $expected_code ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/dismiss-tour' );
		$request->set_body_params( $body );

		$this->assertRESTRequestRejected( $request, $expected_code );
		$this->assertEmpty( $this->dismissed_tours->get(), 'Dismiss tour endpoint should save no tour for invalid data.' );
	}

	public function provider_post_dismiss_tour__invalid_data() {
		return array(
			'no data'               => array(
				array(),
				'rest_missing_callback_param',
			),
			'data is not an object' => array(
				array( 'data' => 'feature_z' ),
				'rest_invalid_param',
			),
			'slug is not a string'  => array(
				array( 'data' => array( 'slug' => 123 ) ),
				'rest_invalid_param',
			),
			'data has no slug'      => array(
				array( 'data' => array() ),
				'rest_invalid_param',
			),
			'slug is empty'         => array(
				array( 'data' => array( 'slug' => '' ) ),
				'rest_invalid_param',
			),
		);
	}
}
