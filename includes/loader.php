<?php
/**
 * Plugin config.
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit;

// Define global constants.
define( 'GOOGLESITEKIT_PLUGIN_BASENAME', plugin_basename( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
define( 'GOOGLESITEKIT_PLUGIN_DIR_PATH', plugin_dir_path( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

// Autoload vendor files.
require_once GOOGLESITEKIT_PLUGIN_DIR_PATH . 'vendor/autoload.php';

// Initialize the plugin.
Plugin::load( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

/**
 * WP CLI Commands
 */
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once GOOGLESITEKIT_PLUGIN_DIR_PATH . 'bin/authentication-cli.php';
	require_once GOOGLESITEKIT_PLUGIN_DIR_PATH . 'bin/reset-cli.php';
}
