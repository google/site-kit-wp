<?php
/**
 * Plugin Name: E2E Tests oAuth Callback Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for bypassing oAuth during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 */

use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Plugin;

/**
 * Intercept test oAuth request before Site Kit, enable auth plugin, and redirect to auth success URL.
 */
add_action( 'init', function () {
	if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
		return;
	}

	$context      = Plugin::instance()->context();
	$user_options = new User_Options( $context );

	if ( filter_input( INPUT_GET, 'googlesitekit_connect' ) ) {
		$redirect_url = '';
		if ( ! empty( $_GET['redirect'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
			$redirect_url = esc_url_raw( wp_unslash( $_GET['redirect'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
		}

		status_header( 302 );
		$auth_client = new OAuth_Client( $context );
		// User is trying to authenticate, but access token hasn't been set.
		header( 'Location: ' . filter_var( $auth_client->get_authentication_url( $redirect_url ), FILTER_SANITIZE_URL ) );
		exit();
	}

	if (
		empty( $_GET['oauth2callback'] )
		|| empty( $_GET['code'] )
		|| 'valid-test-code' !== $_GET['code']
	) {
		return;
	}

	require_once( ABSPATH . 'wp-admin/includes/plugin.php' );

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

	wp_redirect( esc_url( $success_redirect ) );
	exit;
}, 0 );
