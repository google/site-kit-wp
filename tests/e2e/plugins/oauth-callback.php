<?php
/**
 * Plugin Name: E2E Tests oAuth Callback Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for bypassing oAuth during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Plugin;

/**
 * Intercept test oAuth request before Site Kit, enable auth plugin, and redirect to auth success URL.
 */
add_action(
	'init',
	function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		$context      = Plugin::instance()->context();
		$user_options = new User_Options( $context );

		if ( filter_input( INPUT_GET, 'googlesitekit_connect', FILTER_VALIDATE_BOOLEAN ) ) {
			$redirect_url = '';
			if ( ! empty( $_GET['redirect'] ) ) {
				$redirect_url = esc_url_raw( wp_unslash( $_GET['redirect'] ) );
			}

			$auth_client = new OAuth_Client( $context );
			// User is trying to authenticate, but access token hasn't been set.
			wp_safe_redirect( $auth_client->get_authentication_url( $redirect_url ) );
			exit();
		}

		if (
		empty( $_GET['oauth2callback'] )
		|| empty( $_GET['code'] )
		|| 'valid-test-code' !== $_GET['code']
		) {
			return;
		}

		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		$redirect_url        = $user_options->get( OAuth_Client::OPTION_REDIRECT_URL );
		$success_redirect    = $redirect_url ?: $context->admin_url( 'splash', array( 'notification' => 'authentication_success' ) );
		$plugins_to_activate = array( __DIR__ . '/auth.php' );

		if ( ! empty( $_GET['e2e-site-verification'] ) ) {
			$plugins_to_activate[] = __DIR__ . '/site-verification.php';
		}

		if ( isset( $_GET['scope'] ) ) {
			if ( 'TEST_ALL_SCOPES' === $_GET['scope'] ) {
				$scopes = ( new OAuth_Client( $context ) )->get_required_scopes();
			} else {
				$scopes = explode( ' ', $_GET['scope'] );
			}
			$user_options->set( OAuth_Client::OPTION_AUTH_SCOPES, $scopes );
		}

		activate_plugins(
			$plugins_to_activate,
			'',
			false,
			true
		);

		wp_safe_redirect( esc_url_raw( $success_redirect ) );
		exit;
	},
	0
);
