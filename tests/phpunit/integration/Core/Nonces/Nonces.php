<?php
/**
 * Class Google\Site_Kit\Tests\Core\Nonces\NoncesTest
 *
 * @package   Google\Site_Kit\Tests\Core\Nonces
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Nonces;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Nonces\Nonces;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @group Nonces
 */
class NoncesTest extends TestCase {

	/**
	 * @var Context
	 */
	private $context;

	public function set_up() {
		parent::set_up();

		// Unhook all actions and filters added during Nonces::register
		// to avoid interference with "main" instance setup during plugin bootstrap.
		remove_all_filters( 'googlesitekit_rest_routes' );

		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
	}

	public function tear_down() {
		parent::tear_down();
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
	}

	public function test_register() {
		$nonces = new Nonces( $this->context );
		$nonces->register();

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ) );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ) );
	}

	public function test_nonces_route__unauthorized_request() {
		$nonces = new Nonces( $this->context );
		$nonces->register();

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/user/data/nonces' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 401, $response->get_status() );
	}

	public function test_nonces_route__success() {
		$nonces = new Nonces( $this->context );
		$nonces->register();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/' . REST_Routes::REST_ROOT . '/core/user/data/nonces' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEqualSetsWithIndex( $data, $nonces->get_nonces() );
	}
}
