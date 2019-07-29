<?php
/**
 * Plugin Name: E2E Tests Reset Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for resetting Site Kit during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 */

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Util\Reset;

/**
 * Trigger a full reset on Site Kit init and self-deactivate.
 */
add_action( 'googlesitekit_init', function () {
	( new Reset( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) )->all();

	require_once( ABSPATH . 'wp-admin/includes/plugin.php' );

	deactivate_plugins( plugin_basename( __FILE__ ), true );
} );
