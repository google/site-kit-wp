<?php

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Setup;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Site_Verification;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;
use WPDieException;

/**
 * @group Authentication
 * @group Setup
 */
class Setup_Test extends TestCase {

	use Fake_Site_Connection_Trait;

	public function set_up() {
		parent::set_up();

		remove_all_actions( 'admin_action_' . Google_Proxy::ACTION_SETUP_START );
		remove_all_actions( 'admin_action_' . Google_Proxy::ACTION_VERIFY );
		remove_all_actions( 'admin_action_' . Google_Proxy::ACTION_EXCHANGE_SITE_CODE );
	}

	/**
	 * @dataProvider data_actions
	 */
	public function test_action_handlers_die_on_invalid_nonce( $action ) {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$setup   = new Setup( $context, new User_Options( $context ), new Authentication( $context ) );
		$setup->register();

		// Ensure that wp_die is called if nonce verification fails.
		$_GET['nonce'] = 'bad-nonce';

		try {
			do_action( 'admin_action_' . $action );
		} catch ( WPDieException $exception ) {
			$this->assertStringStartsWith(
				'The link you followed has expired',
				$exception->getMessage()
			);

			return;
		}

		$this->fail( 'Expected WPDieException!' );
	}

	public function data_actions() {
		return array(
			Google_Proxy::ACTION_SETUP_START        => array( Google_Proxy::ACTION_SETUP_START ),
			Google_Proxy::ACTION_VERIFY             => array( Google_Proxy::ACTION_VERIFY ),
			Google_Proxy::ACTION_EXCHANGE_SITE_CODE => array( Google_Proxy::ACTION_EXCHANGE_SITE_CODE ),
		);
	}

	public function test_handle_action_setup_start__dies_if_insufficient_permissions() {
		$user_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $user_id );
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$setup   = new Setup( $context, new User_Options( $context ), new Authentication( $context ) );
		$setup->register();

		$_GET['nonce'] = wp_create_nonce( Google_Proxy::ACTION_SETUP_START );

		try {
			do_action( 'admin_action_' . Google_Proxy::ACTION_SETUP_START );
		} catch ( WPDieException $exception ) {
			$this->assertStringStartsWith(
				'You have insufficient permissions to connect Site Kit',
				$exception->getMessage()
			);

			return;
		}

		$this->fail( 'Expected WPDieException!' );
	}

	public function test_handle_action_setup_start__dies_if_not_using_proxy() {
		$this->fake_site_connection();
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$setup   = new Setup( $context, new User_Options( $context ), new Authentication( $context ) );
		$setup->register();

		$_GET['nonce'] = wp_create_nonce( Google_Proxy::ACTION_SETUP_START );

		try {
			do_action( 'admin_action_' . Google_Proxy::ACTION_SETUP_START );
		} catch ( WPDieException $exception ) {
			$this->assertStringStartsWith(
				'Site Kit is not configured to use the authentication proxy',
				$exception->getMessage()
			);

			return;
		}

		$this->fail( 'Expected WPDieException!' );
	}

	/**
	 * @dataProvider data_conditionally_syncs_site_fields
	 */
	public function test_handle_action_setup_start__syncs_site_fields( $has_credentials ) {
		$redirect_url = 'https://sitekit.withgoogle.com/test-page';

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$setup   = new Setup( $context, new User_Options( $context ), new Authentication( $context ) );
		$setup->register();

		if ( $has_credentials ) {
			$this->fake_proxy_site_connection();
		}

		$_GET['code']  = 'test-code';
		$_GET['nonce'] = wp_create_nonce( Google_Proxy::ACTION_SETUP_START );

		// Capture URLs of all WP HTTP requests.
		$http_requests = array();
		$this->subscribe_to_wp_http_requests(
			function ( $url ) use ( &$http_requests ) {
				$http_requests[] = $url;
			},
			array(
				'response' => array( 'code' => 200 ),
				'headers'  => array( Google_Proxy::HEADER_REDIRECT_TO => $redirect_url ),
				'body'     => '{}',
			)
		);

		try {
			do_action( 'admin_action_' . Google_Proxy::ACTION_SETUP_START );
			$this->fail( 'Expected redirection to proxy setup URL!' );
		} catch ( RedirectException $redirect ) {
			$location = $redirect->get_location();
			$this->assertStringStartsWith( $redirect_url, $location );
		}

		$this->assertContains(
			( new Google_Proxy( $context ) )->url( Google_Proxy::OAUTH2_SITE_URI ),
			$http_requests
		);
	}

	/**
	 * @dataProvider data_conditionally_syncs_site_fields
	 */
	public function test_handle_action_setup_start__wp_error( $has_credentials ) {
		$redirect_url = 'https://sitekit.withgoogle.com/test-page';

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$setup   = new Setup( $context, new User_Options( $context ), new Authentication( $context ) );
		$setup->register();

		if ( $has_credentials ) {
			$this->fake_proxy_site_connection();
		}

		$_GET['code']  = 'test-code';
		$_GET['nonce'] = wp_create_nonce( Google_Proxy::ACTION_SETUP_START );

		$proxy_server_requests = array();
		// Fake a WP_Error IF a request is made to the Google Proxy server.
		add_filter(
			'pre_http_request',
			function( $preempt, $args, $url ) use ( $context, &$proxy_server_requests, $has_credentials ) {
				if ( ( new Google_Proxy( $context ) )->url( Google_Proxy::OAUTH2_SITE_URI ) !== $url ) {
					return $preempt;
				}
				// Collect any HTTP requests to the proxy server to register/sync site with the proxy server.
				$proxy_server_requests[] = $args;

				// Using the two cases for $has_credentials, we can test the error message
				// and the fallback to an error code when there is no message.
				$error_message = $has_credentials ? 'Test error message.' : null;
				return new WP_Error( 'test_error_code', $error_message );
			},
			10,
			3
		);

		try {
			do_action( 'admin_action_' . Google_Proxy::ACTION_SETUP_START );
			$this->fail( 'Expected WPDieException!' );
		} catch ( RedirectException $redirect ) {
			$this->fail( 'Expected WPDieException!' );
		} catch ( WPDieException $exception ) {
			$error = $has_credentials ? 'Test error message.' : 'test_error_code';
			$this->assertStringContainsString(
				sprintf(
					'The request to the authentication proxy has failed with an error: %s <a href="https://sitekit.withgoogle.com/support?error_id=request_to_auth_proxy_failed" target="_blank">Get help</a>.',
					$error
				),
				$exception->getMessage()
			);
		}

		$this->assertCount( 1, $proxy_server_requests );
	}

	/**
	 * @dataProvider data_conditionally_syncs_site_fields
	 */
	public function test_handle_action_setup_start__invalid_url( $has_credentials ) {
		// An invalid redirect URL (without protocol).
		$redirect_url = 'sitekit.withgoogle.com/test-page';

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$setup   = new Setup( $context, new User_Options( $context ), new Authentication( $context ) );
		$setup->register();

		if ( $has_credentials ) {
			$this->fake_proxy_site_connection();
		}

		$_GET['code']  = 'test-code';
		$_GET['nonce'] = wp_create_nonce( Google_Proxy::ACTION_SETUP_START );

		$proxy_server_requests = array();

		add_filter(
			'pre_http_request',
			function( $preempt, $args, $url ) use ( $context, &$proxy_server_requests, $redirect_url ) {
				if ( ( new Google_Proxy( $context ) )->url( Google_Proxy::OAUTH2_SITE_URI ) !== $url ) {
					return $preempt;
				}

				// Collect any HTTP requests to the proxy server to register/sync site with the proxy server.
				$proxy_server_requests[] = $args;

				return array(
					'response' => array( 'code' => 200 ),
					'headers'  => array( Google_Proxy::HEADER_REDIRECT_TO => $redirect_url ),
					'body'     => '{}',
				);
			},
			10,
			3
		);

		try {
			do_action( 'admin_action_' . Google_Proxy::ACTION_SETUP_START );
			$this->fail( 'Expected WPDieException!' );
		} catch ( RedirectException $redirect ) {
			$this->fail( 'Expected WPDieException!' );
		} catch ( WPDieException $exception ) {
			$this->assertStringContainsString(
				'The request to the authentication proxy has failed. Please, try again later. <a href="https://sitekit.withgoogle.com/support?error_id=request_to_auth_proxy_failed" target="_blank">Get help</a>.',
				$exception->getMessage()
			);
		}

		$this->assertCount( 1, $proxy_server_requests );
	}

	public function data_conditionally_syncs_site_fields() {
		return array(
			'with credentials'    => array( true ),
			'without credentials' => array( false ),
		);
	}

	/**
	 * @dataProvider data_verification_tokens
	 */
	public function test_handle_action_verify( $token ) {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$setup   = new Setup( $context, new User_Options( $context ), new Authentication( $context ) );
		$setup->register();

		$this->fake_proxy_site_connection();

		if ( $token ) {
			$_GET['googlesitekit_verification_token']      = $token;
			$_GET['googlesitekit_verification_token_type'] = Site_Verification::VERIFICATION_TYPE_FILE;
		}

		$_GET['googlesitekit_code'] = 'test-code';
		$_GET['step']               = 'test-step';
		$_GET['nonce']              = wp_create_nonce( Google_Proxy::NONCE_ACTION );

		try {
			do_action( 'admin_action_' . Google_Proxy::ACTION_VERIFY );
			$this->fail( 'Expected redirection to proxy setup URL!' );
		} catch ( RedirectException $redirect ) {
			$location = $redirect->get_location();
			$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/v2/site-management/setup/', $location );
			$this->assertStringContainsString( '?step=test-step', $location );
			$this->assertStringContainsString( '&verify=true', $location );
			$this->assertStringContainsString( '&verification_method=FILE', $location );
		} catch ( WPDieException $exception ) {
			$this->assertStringContainsString(
				'Verifying site ownership requires a token and verification method',
				$exception->getMessage()
			);
			$this->assertEmpty( $token );
		}

		if ( $token ) {
			$this->assertSame( 1, did_action( 'googlesitekit_verify_site_ownership' ) );
		} else {
			$this->assertSame( 0, did_action( 'googlesitekit_verify_site_ownership' ) );
		}
	}

	public function data_verification_tokens() {
		return array(
			'with token'    => array( 'test-verification-token' ),
			'without token' => array( null ),
		);
	}

	public function test_handle_action_verify__with_site_code() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$authentication = new Authentication( $context );
		$setup          = new Setup( $context, new User_Options( $context ), $authentication );
		$setup->register();

		$_GET['nonce']                                 = wp_create_nonce( Google_Proxy::NONCE_ACTION );
		$_GET['googlesitekit_code']                    = 'test-code';
		$_GET['googlesitekit_site_code']               = 'test-site-code';
		$_GET['googlesitekit_verification_token']      = 'test-token';
		$_GET['googlesitekit_verification_token_type'] = Site_Verification::VERIFICATION_TYPE_FILE;

		$this->assertFalse( $authentication->credentials()->has() );

		// Stub the response to the proxy oauth API.
		$this->stub_oauth2_site_request( $_GET['googlesitekit_code'], $_GET['googlesitekit_site_code'] );

		try {
			do_action( 'admin_action_' . Google_Proxy::ACTION_VERIFY );
			$this->fail( 'Expected redirection to proxy setup URL!' );
		} catch ( RedirectException $redirect ) {
			$location = $redirect->get_location();
			$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/v2/site-management/setup/', $location );
		}

		$this->assertSame( 1, did_action( 'googlesitekit_verify_site_ownership' ) );
		$this->assertTrue( $authentication->credentials()->has() );
	}

	/**
	 * @param string $code
	 * @param string $site_code
	 * @dataProvider data_code_site_code
	 */
	public function test_handle_action_exchange_site_code( $code, $site_code ) {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$authentication = new Authentication( $context );
		$setup          = new Setup( $context, new User_Options( $context ), $authentication );
		$setup->register();

		$_GET['googlesitekit_code']      = $code;
		$_GET['googlesitekit_site_code'] = $site_code;
		$_GET['nonce']                   = wp_create_nonce( Google_Proxy::NONCE_ACTION );
		$_GET['step']                    = 'test-step';

		$http_requests = array();
		$this->subscribe_to_wp_http_requests(
			function ( $url, $args ) use ( &$http_requests ) {
				$http_requests[ $url ] = $args;
			}
		);
		$sync_url = ( new Google_Proxy( $context ) )->url( Google_Proxy::OAUTH2_SITE_URI );

		// Stub the response to the proxy oauth API.
		$this->stub_oauth2_site_request( $code, $site_code );

		$this->assertFalse( $authentication->credentials()->has() );

		try {
			do_action( 'admin_action_' . Google_Proxy::ACTION_EXCHANGE_SITE_CODE );
			$this->fail( 'Expected redirection to proxy setup URL!' );
		} catch ( WPDieException $exception ) {
			$this->assertStringContainsString(
				'Invalid request',
				$exception->getMessage()
			);
			$no_code      = empty( $code );
			$no_site_code = empty( $site_code );
			// Ensure one or both were missing.
			$this->assertTrue( $no_code ?: $no_site_code );
		} catch ( RedirectException $redirect ) {
			$location = $redirect->get_location();
			$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/v2/site-management/setup/', $location );
			$this->assertStringContainsString( '&step=test-step', $location );
			$this->assertArrayHasKey( $sync_url, $http_requests );
			$sync_request = $http_requests[ $sync_url ];
			$this->assertEquals( $code, $sync_request['body']['code'] );
			$this->assertEquals( $site_code, $sync_request['body']['site_code'] );
			$this->assertTrue( $authentication->credentials()->has() );
		}
	}

	public function data_code_site_code() {
		return array(
			'code + site_code' => array(
				'test-code',
				'test-site-code',
			),
			'code only'        => array(
				'test-code',
				'',
			),
			'neither code'     => array(
				'',
				'',
			),
		);
	}

	/**
	 * @param $code
	 * @param $site_code
	 */
	public function stub_oauth2_site_request( $code, $site_code ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $code, $site_code ) {
				if ( false === strpos( $url, Google_Proxy::OAUTH2_SITE_URI ) ) {
					return $preempt;
				}
				// Fail the request if no code or site_code were given.
				if ( empty( $args['body']['code'] ) || empty( $args['body']['site_code'] ) ) {
					return array(
						'headers'  => array(),
						'response' => array(
							'code'    => 400,
							'message' => get_status_header_desc( 400 ),
						),
						'body'     => '',
					);
				}

				list( $site_id, $site_secret ) = $this->get_fake_proxy_credentials();

				return array(
					'headers'       => array(),
					'body'          => json_encode(
						compact( 'site_id', 'site_secret' )
					),
					'response'      => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'cookies'       => array(),
					'http_response' => null,
				);
			},
			10,
			3
		);
	}

}
