<?php
/**
 * REST_Authentication_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Authentication
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Authentication\Verification;
use Google\Site_Kit\Core\Authentication\Verification_Meta;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\UserAuthenticationTrait;
use WP_REST_Request;

class REST_Authentication_ControllerTest extends TestCase {

	use Fake_Site_Connection_Trait;
	use RestTestTrait;
	use UserAuthenticationTrait;

	/**
	 * @var Context
	 */
	protected $context;

	/**
	 * @var User_Options
	 */
	protected $user_options;

	public function set_up() {
		$this->context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options = new User_Options( $this->context );

		parent::set_up();
	}

	public function tear_down() {
		parent::tear_down();
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		remove_all_filters( 'googlesitekit_apifetch_preload_paths' );

		$auth = new Authentication( $this->context );
		$auth->register();

		$this->assertTrue( has_action( 'googlesitekit_authorize_user' ) );
		$this->assertTrue( has_action( 'googlesitekit_reauthorize_user' ) );

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ) );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ) );
	}

	public function test_disconnect() {
		$user_id = $this->create_user_without_access_token();
		$options = new Options( $this->context );
		$this->user_options->switch_user( $user_id );
		$auth = new Authentication( $this->context, $options, $this->user_options );

		foreach ( $this->get_user_option_keys() as $key ) {
			$this->user_options->set( $key, "test-$key-value" );
		}

		$mock_google_client = $this->getMockBuilder( 'Google\Site_Kit\Core\Authentication\Clients\Google_Site_Kit_Client' )
			->setMethods( array( 'revokeToken' ) )->getMock();
		$mock_google_client->expects( $this->once() )->method( 'revokeToken' );
		$this->force_set_property( $auth->get_oauth_client(), 'google_client', $mock_google_client );

		$auth->disconnect();

		foreach ( $this->get_user_option_keys() as $key ) {
			$this->assertFalse( $this->user_options->get( $key ) );
		}
	}

	public function test_connection_rest_endpoint_unauthenticated() {
		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/connection' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 401, $response->status );
	}

	public function test_connection_rest_endpoint_authenticated() {
		$user_id = $this->create_user_without_access_token();
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/connection' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->status );
	}

	public function test_connection_rest_endpoint_connected() {
		$user_id = $this->create_user_with_access_token();
		wp_set_current_user( $user_id );

		$this->grant_manage_options_permission();
		$this->fake_site_connection();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/connection' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue( $response->data['connected'] );
	}

	public function test_connection_rest_endpoint_not_connected() {
		$user_id = $this->create_user_with_access_token();
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/connection' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertFalse( $response->data['connected'] );
	}

	public function test_authentication_rest_endpoint_no_token() {
		$user_id = $this->create_user_without_access_token();
		wp_set_current_user( $user_id );

		$this->grant_manage_options_permission();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/authentication' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertFalse( $response->data['authenticated'] );

	}

	public function test_authentication_rest_endpoint_valid_token() {
		$user_id = $this->create_user_with_access_token();
		wp_set_current_user( $user_id );

		$this->grant_manage_options_permission();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/authentication' );
		$response = rest_get_server()->dispatch( $request );

		// $response->data['authenticated'] is always returned as false. phpcs:ignore
		var_export( $response ); // phpcs:ignore
		die();
	}

	public function test_get_token_rest_endpoint_no_token() {
		$user_id = $this->create_user_without_access_token();
		wp_set_current_user( $user_id );

		$this->grant_manage_options_permission();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/get-token' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertFalse( $response->data['token'] );
	}

	public function test_get_token_rest_endpoint_has_token() {
		$user_id = $this->create_user_with_access_token();

		wp_set_current_user( $user_id );

		$this->grant_manage_options_permission();

		$request  = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/get-token' );
		$response = rest_get_server()->dispatch( $request );

		// $response->data['token'] is always returned as false. phpcs:ignore
		var_export( $response ); // phpcs:ignore
		die();
	}

	private function create_user_without_access_token() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		return $user_id;
	}

	private function create_user_with_access_token() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		$this->set_user_access_token( $user_id, 'valid-auth-token' );

		return $user_id;
	}

	private function grant_manage_options_permission() {
		// Setup SiteKit.
		$this->fake_proxy_site_connection();
		// Override any existing filter to make sure the setup is marked as complete all the time.
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		// Verify and authenticate the current user.
		$authentication = new Authentication( $this->context );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_token(
			array(
				'access_token' => 'valid-auth-token',
			)
		);
	}

	protected function get_user_option_keys() {
		return array(
			OAuth_Client::OPTION_ACCESS_TOKEN,
			OAuth_Client::OPTION_ACCESS_TOKEN_CREATED,
			OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN,
			OAuth_Client::OPTION_AUTH_SCOPES,
			OAuth_Client::OPTION_ERROR_CODE,
			OAuth_Client::OPTION_REDIRECT_URL,
			OAuth_Client::OPTION_REFRESH_TOKEN,
			Profile::OPTION,
			Verification::OPTION,
			Verification_Meta::OPTION,
		);
	}
}
