<?php
/**
 * Plugin Name: E2E Tests oAuth Callback Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for bypassing oAuth during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Plugin;

/**
 * Intercept test oAuth request before Site Kit, enable auth plugin, and redirect to auth success URL.
 */
add_action(
	'admin_init',
	function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}

		$context      = Plugin::instance()->context();
		$user_options = new User_Options( $context );
		$auth         = new Authentication( $context );

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
		$plugins_to_activate = array(
			sprintf( '%s/%s-auth.php', __DIR__, $auth->credentials()->using_proxy() ? 'proxy' : 'gcp' ),
		);

		if ( ! empty( $_GET['e2e-site-verification'] ) ) {
			$plugins_to_activate[] = __DIR__ . '/site-verification.php';
		}

		if ( isset( $_GET['scope'] ) ) {
			$oauth_client = new OAuth_Client( $context );
			$scopes       = explode( ' ', $_GET['scope'] );

			if ( in_array( 'TEST_ALL_SCOPES', $scopes, true ) ) {
				$scopes = array_diff( $scopes, array( 'TEST_ALL_SCOPES' ) );
				$scopes = array_merge( $scopes, $oauth_client->get_required_scopes() );
			}

			$oauth_client->set_granted_scopes( $scopes );
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
