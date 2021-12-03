<?php

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\Setup_V1;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Exception\RedirectException;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\MutableInput;
use Google\Site_Kit\Tests\TestCase;
use WPDieException;

/**
 * @group Authentication
 * @group Setup
 */
class Setup_V1Test extends TestCase {
	use Fake_Site_Connection_Trait;

	public function test_verify_proxy_setup_nonce() {
		$setup_proxy_admin_action = 'admin_action_' . Google_Proxy::ACTION_SETUP;
		remove_all_actions( $setup_proxy_admin_action );
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$user_options = new User_Options( $context, $user_id );
		$auth         = new Authentication( $context );
		$setup        = new Setup_V1( $context, $user_options, $auth );
		$setup->register();

		// Ensure that wp_die is called if nonce verification fails.
		$_GET['nonce'] = 'bad-nonce';

		try {
			do_action( $setup_proxy_admin_action );
		} catch ( WPDieException $exception ) {
			$this->assertEquals( 'The link you followed has expired.</p><p><a href="http://example.org/wp-admin/admin.php?page=googlesitekit-splash">Please try again.</a>', $exception->getMessage() );
			return;
		}

		$this->fail( 'Expected WPDieException!' );
	}

	public function test_handle_site_code_and_redirect_to_proxy() {
		remove_all_actions( 'admin_action_googlesitekit_proxy_setup' );
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$credentials  = new Credentials( new Encrypted_Options( new Options( $context ) ) );
		$user_options = new User_Options( $context, $user_id );
		$auth         = new Authentication( $context );
		$setup        = new Setup_V1( $context, $user_options, $auth );
		$google_proxy = $auth->get_google_proxy();

		$setup->register();

		$this->assertTrue( has_action( 'admin_action_googlesitekit_proxy_setup' ) );
		$this->assertFalse( $credentials->has() );

		// For site code to be processed, the code and nonce must be present.
		$_GET['googlesitekit_code']      = 'test-code';
		$_GET['googlesitekit_site_code'] = 'test-site-code';

		// Stub the response to the proxy oauth API.
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $google_proxy ) {
				if ( $google_proxy->url( Google_Proxy::OAUTH2_SITE_URI ) !== $url ) {
					return $preempt;
				}

				return array(
					'headers'       => array(),
					'body'          => json_encode(
						array(
							'site_id'     => 'test-site-id.apps.sitekit.withgoogle.com',
							'site_secret' => 'test-site-secret',
						)
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

		$_GET['nonce'] = wp_create_nonce( 'googlesitekit_proxy_setup' );

		try {
			do_action( 'admin_action_googlesitekit_proxy_setup' );
			$this->fail( 'Expected redirection to proxy setup URL!' );
		} catch ( RedirectException $redirect ) {
			$location = $redirect->get_location();
			$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/site-management/setup/', $location );
			$parsed = wp_parse_url( $location );
			parse_str( $parsed['query'], $query_args );
			$this->assertEquals( 'test-site-id.apps.sitekit.withgoogle.com', $query_args['site_id'] );
			$this->assertEquals( 'test-code', $query_args['code'] );
		}

		$saved_creds = $credentials->get();
		$this->assertEquals( 'test-site-id.apps.sitekit.withgoogle.com', $saved_creds['oauth2_client_id'] );
		$this->assertEquals( 'test-site-secret', $saved_creds['oauth2_client_secret'] );
	}

	public function test_handle_sync_site_fields() {
		remove_all_actions( 'admin_action_' . Google_Proxy::ACTION_SETUP );

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$options        = new Options( $context );
		$user_options   = new User_Options( $context );
		$authentication = new Authentication( $context, $options, $user_options );
		$setup          = new Setup_V1( $context, $user_options, $authentication );
		$setup->register();

		// Emulate credentials.
		list( $site_id ) = $this->fake_proxy_site_connection();

		// Ensure admin user has Permissions::SETUP cap regardless of authentication.
		add_filter(
			'user_has_cap',
			function( $caps ) {
				$caps[ Permissions::SETUP ] = true;
				return $caps;
			}
		);

		$_GET['nonce']              = wp_create_nonce( Google_Proxy::ACTION_SETUP );
		$_GET['googlesitekit_code'] = 'test-code';

		try {
			do_action( 'admin_action_' . Google_Proxy::ACTION_SETUP );
			$this->fail( 'Expected redirection to proxy setup URL!' );
		} catch ( RedirectException $redirect ) {
			$location = $redirect->get_location();
			$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/site-management/setup/', $location );

			$parsed = wp_parse_url( $location );
			parse_str( $parsed['query'], $query_args );

			$this->assertEquals( $site_id, $query_args['site_id'] );
			$this->assertEquals( 'test-code', $query_args['code'] );
		}
	}
}
