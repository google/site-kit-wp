<?php
/**
 * Pending_Intent_CheckTest
 *
 * @package   Google\Site_Kit\Tests\Core\Intents
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Intents;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Intents\Pending_Intent_Check;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Plugin_Version;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_Error;

/**
 * @group Intents
 */
class Pending_Intent_CheckTest extends TestCase {

	use Fake_Site_Connection_Trait;

	/**
	 * Plugin context.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * User_Options instance.
	 *
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Authentication instance.
	 *
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Arguments of the requests the Service received.
	 *
	 * @var array[]
	 */
	private $requests;

	/**
	 * Server variables as they were before this class ran.
	 *
	 * @var array
	 */
	private static $server_data = array();

	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$server_data = $_SERVER;
	}

	public function set_up() {
		parent::set_up();

		$this->context  = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$this->options  = new Options( $this->context );
		$this->requests = array();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$this->user_options   = new User_Options( $this->context, $user_id );
		$this->authentication = new Authentication( $this->context, $this->options, $this->user_options );

		$this->options->set( Plugin_Version::OPTION, '1.2.3' );

		$_SERVER['REQUEST_METHOD'] = 'GET';

		// The plugin registered its own check at bootstrap, which would run before the test's.
		remove_all_actions( 'admin_init' );
	}

	public function tear_down() {
		parent::tear_down();

		$_SERVER = self::$server_data;
	}

	/**
	 * Connects the site and the current user to the Site Kit Service.
	 */
	private function connect_to_service() {
		$this->fake_proxy_site_connection();
		$this->authentication->get_oauth_client()->set_token( array( 'access_token' => 'test-access-token' ) );
	}

	/**
	 * Answers the pending intent request with the given response.
	 *
	 * @param array|WP_Error $response Response body, or a WP_Error for a failing request.
	 */
	private function mock_pending_intent_response( $response ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $response ) {
				if ( false === strpos( $url, Google_Proxy::INTENT_PENDING_URI ) ) {
					return $preempt;
				}

				$this->requests[] = $args;

				if ( is_wp_error( $response ) ) {
					return $response;
				}

				return array(
					'headers'  => array(),
					'body'     => wp_json_encode( $response ),
					'response' => array(
						'code'    => 200,
						'message' => get_status_header_desc( 200 ),
					),
					'cookies'  => array(),
				);
			},
			10,
			3
		);
	}

	/**
	 * Registers the check and runs it through the admin_init action.
	 */
	private function run_check() {
		$pending_intent_check = new Pending_Intent_Check(
			$this->context,
			$this->options,
			$this->user_options,
			$this->authentication
		);
		$pending_intent_check->register();

		do_action( 'admin_init' );
	}

	public function test_admin_init__redirects_to_the_intent_the_service_is_holding() {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->connect_to_service();
		$this->mock_pending_intent_response(
			array(
				'has_intent'  => true,
				'intent'      => 'ads-conversion-tracking',
				'intent_code' => 'abc123',
			)
		);

		try {
			$this->run_check();
			$this->fail( 'Expected RedirectException!' );
		} catch ( RedirectException $redirect ) {
			$this->assertEquals(
				$this->context->admin_url(
					'dashboard',
					array(
						'intent'      => 'ads-conversion-tracking',
						'intent_code' => 'abc123',
					)
				),
				$redirect->get_location(),
				'The user should land on the dashboard with the intent the Service returned.'
			);
		}

		$this->assertCount( 1, $this->requests, 'The Service should be asked once.' );
		$this->assertEquals( '1.2.3', $this->user_options->get( Pending_Intent_Check::CHECKED_VERSION_USER_OPTION ), 'The check should record the plugin version it ran for.' );
	}

	public function test_admin_init__does_not_ask_again_after_a_redirect() {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->connect_to_service();
		$this->mock_pending_intent_response(
			array(
				'has_intent'  => true,
				'intent'      => 'ads-conversion-tracking',
				'intent_code' => 'abc123',
			)
		);

		try {
			$this->run_check();
		} catch ( RedirectException $redirect ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Ignore the first redirect, this test checks the next page load.
		}

		remove_all_actions( 'admin_init' );
		$this->run_check();

		$this->assertCount( 1, $this->requests, 'The page the user lands on should not ask the Service again.' );
	}

	public function data_responses_without_an_intent() {
		return array(
			'no intent waiting'              => array( array( 'has_intent' => false ) ),
			'a stale intent'                 => array(
				array(
					'has_intent'  => false,
					'intent'      => 'ads-conversion-tracking',
					'intent_code' => 'abc123',
				),
			),
			'a failing request'              => array( new WP_Error( 'http_request_failed', 'Service unreachable.' ) ),
			'no intent named'                => array(
				array(
					'has_intent'  => true,
					'intent_code' => 'abc123',
				),
			),
			'no code named'                  => array(
				array(
					'has_intent' => true,
					'intent'     => 'ads-conversion-tracking',
				),
			),
			'an intent that is not a string' => array(
				array(
					'has_intent'  => true,
					'intent'      => array( 'ads-conversion-tracking' ),
					'intent_code' => 'abc123',
				),
			),
		);
	}

	/**
	 * @dataProvider data_responses_without_an_intent
	 * @param array|WP_Error $response Response from the Service.
	 */
	public function test_admin_init__stays_on_the_page( $response ) {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->connect_to_service();
		$this->mock_pending_intent_response( $response );

		$this->run_check();

		$this->assertCount( 1, $this->requests, 'The Service should be asked once.' );
	}

	public function test_admin_init__asks_the_service_once_per_plugin_version() {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->connect_to_service();
		$this->mock_pending_intent_response( array( 'has_intent' => false ) );

		$this->run_check();
		remove_all_actions( 'admin_init' );
		$this->run_check();

		$this->assertCount( 1, $this->requests, 'A user who was not redirected should not ask the Service again.' );
	}

	public function test_admin_init__asks_the_service_again_after_the_next_update() {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->connect_to_service();
		$this->mock_pending_intent_response( array( 'has_intent' => false ) );

		$this->run_check();
		$this->options->set( Plugin_Version::OPTION, '1.3.0' );
		remove_all_actions( 'admin_init' );
		$this->run_check();

		$this->assertCount( 2, $this->requests, 'A newer plugin version should be checked again.' );
	}

	public function test_admin_init__skips_the_check_during_an_ajax_request() {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->connect_to_service();
		$this->mock_pending_intent_response( array( 'has_intent' => false ) );

		add_filter( 'wp_doing_ajax', '__return_true' );

		$this->run_check();

		$this->assertCount( 0, $this->requests, 'An AJAX request should not ask the Service.' );
	}

	public function test_admin_init__skips_the_check_for_a_form_submission() {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->connect_to_service();
		$this->mock_pending_intent_response( array( 'has_intent' => false ) );

		$_SERVER['REQUEST_METHOD'] = 'POST';

		$this->run_check();

		$this->assertCount( 0, $this->requests, 'A POST request should not ask the Service.' );
	}

	public function test_admin_init__asks_the_service_with_a_refreshed_access_token() {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->connect_to_service();

		$oauth_client = $this->authentication->get_oauth_client();
		$oauth_client->set_token(
			array(
				'access_token'  => 'test-access-token',
				'refresh_token' => 'test-refresh-token',
				// Expires within five minutes, so Site Kit refreshes it.
				'expires_in'    => 60,
			)
		);

		FakeHttp::fake_google_http_handler(
			$oauth_client->get_client(),
			function () {
				return new FulfilledPromise(
					new Response(
						200,
						array(),
						wp_json_encode(
							array(
								'access_token' => 'new-test-access-token',
								'expires_in'   => 3599,
								'token_type'   => 'Bearer',
							)
						)
					)
				);
			}
		);

		$this->mock_pending_intent_response( array( 'has_intent' => false ) );

		$this->run_check();

		$this->assertEquals(
			'Bearer new-test-access-token',
			$this->requests[0]['headers']['Authorization'],
			'The Service should be asked with a token that has not expired.'
		);
	}

	public function test_admin_init__asks_the_service_where_the_request_method_cannot_be_read() {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->connect_to_service();
		$this->mock_pending_intent_response( array( 'has_intent' => false ) );

		unset( $_SERVER['REQUEST_METHOD'] );

		$this->run_check();

		$this->assertCount( 1, $this->requests, 'A host that reports no request method should still ask the Service.' );
	}

	public function test_admin_init__skips_the_check_while_the_feature_flag_is_off() {
		$this->connect_to_service();
		$this->mock_pending_intent_response( array( 'has_intent' => false ) );

		$this->run_check();

		$this->assertCount( 0, $this->requests, 'The Service should not be asked while the feature flag is off.' );
	}

	public function test_admin_init__skips_the_check_for_an_unauthenticated_user() {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->fake_proxy_site_connection();
		$this->mock_pending_intent_response( array( 'has_intent' => false ) );

		$this->run_check();

		$this->assertCount( 0, $this->requests, 'A user without a token should not ask the Service.' );
	}

	public function test_admin_init__skips_the_check_on_a_site_that_is_not_connected_to_the_service() {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->fake_site_connection();
		$this->authentication->get_oauth_client()->set_token( array( 'access_token' => 'test-access-token' ) );
		$this->mock_pending_intent_response( array( 'has_intent' => false ) );

		$this->run_check();

		$this->assertCount( 0, $this->requests, 'A site connected without the Service should not ask it.' );
	}

	public function test_admin_init__skips_the_check_for_a_user_who_cannot_set_up_site_kit() {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->connect_to_service();
		$this->mock_pending_intent_response( array( 'has_intent' => false ) );

		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'editor' ) ) );

		$this->run_check();

		$this->assertCount( 0, $this->requests, 'A user who cannot set up Site Kit should not ask the Service.' );
	}
}
