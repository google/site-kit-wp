<?php
/**
 * Plugin Name: E2E Tests oAuth Callback Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for bypassing oAuth during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 */

use Google\Site_Kit\Plugin;

/**
 * Intercept test oAuth request before Site Kit, enable auth plugin, and redirect to auth success URL.
 */
add_action( 'init', function () {
	if (
		empty( $_GET['oauth2callback'] )
		|| empty( $_GET['code'] )
		|| 'valid-test-code' !== $_GET['code']
	) {
		return;
	}

	require_once( ABSPATH . 'wp-admin/includes/plugin.php' );

	$success_redirect = Plugin::instance()->context()->admin_url(
		'splash',
		array(
			'notification' => 'authentication_success',
		)
	);

	$plugins_to_activate = array( __DIR__ . '/auth.php' );

	if ( $_GET['e2e-site-verification'] ) {
		$plugins_to_activate[] = __DIR__ . '/site-verification.php';
	}

	activate_plugins(
		$plugins_to_activate,
		$success_redirect,
		false,
		true
	);

	exit;
}, 0 );
