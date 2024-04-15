<?php
/**
 * REST_Prompts_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Prompts
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Prompts;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Prompts\Dismissed_Prompts;
use Google\Site_Kit\Core\Prompts\REST_Prompts_Controller;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_Prompts_ControllerTest extends TestCase {

	use RestTestTrait;

	/**
	 * Dismissed prompts instance.
	 *
	 * @var Dismissed_Prompts
	 */
	private $dismissed_prompts;

	/**
	 * Controller instance.
	 *
	 * @var REST_Prompts_Controller
	 */
	private $controller;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context                 = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options            = new User_Options( $context, $user_id );
		$this->dismissed_prompts = new Dismissed_Prompts( $user_options );
		$this->controller        = new REST_Prompts_Controller( $this->dismissed_prompts );
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

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ) );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ) );
	}

	public function test_get_dismissed_prompts() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->dismissed_prompts->add( 'foo' );
		$this->dismissed_prompts->add( 'bar', 100 );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/dismissed-prompts' );
		$response = rest_get_server()->dispatch( $request );

		$response_data = $response->get_data();
		// The asserts are split to use assertEqualsWithDelta for the time based assertion.
		$this->assertArrayHasKey( 'foo', $response_data );
		$this->assertArrayHasKey( 'bar', $response_data );
		$this->assertEquals( 0, $response_data['foo']['expires'] );
		$this->assertEquals( 1, $response_data['foo']['count'] );
		$this->assertEqualsWithDelta( time() + 100, $response_data['bar']['expires'], 2 );
		$this->assertEquals( 1, $response_data['bar']['count'] );
	}

	public function test_dismiss_new_prompt() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->dismissed_prompts->add( 'foo' );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/dismiss-prompt' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug'       => 'bar',
					'expiration' => 100,
				),
			)
		);

		$this->assertEqualSets(
			array( 'foo', 'bar' ),
			array_keys( rest_get_server()->dispatch( $request )->get_data() )
		);
	}

	public function test_dismiss_prompt_increments_count() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$this->dismissed_prompts->add( 'foo' );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/dismiss-prompt' );
		$request->set_body_params(
			array(
				'data' => array(
					'slug'       => 'foo',
					'expiration' => 100,
				),
			)
		);

		$response_data = rest_get_server()->dispatch( $request )->get_data();
		// The asserts are split to use assertEqualsWithDelta for the time based assertion.
		$this->assertArrayHasKey( 'foo', $response_data );
		$this->assertEqualsWithDelta( time() + 100, $response_data['foo']['expires'], 2 );
		$this->assertEquals( 2, $response_data['foo']['count'] );
	}

}
