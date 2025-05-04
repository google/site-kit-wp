<?php
/**
 * Plugin config.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit;

// Define global constants.
define( 'GOOGLESITEKIT_PLUGIN_BASENAME', plugin_basename( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
define( 'GOOGLESITEKIT_PLUGIN_DIR_PATH', plugin_dir_path( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

/**
 * Loads generated class maps for autoloading.
 *
 * @since 1.0.0
 * @access private
 */
function autoload_classes() {
	$class_map = array_merge(
		// Site Kit classes.
		include GOOGLESITEKIT_PLUGIN_DIR_PATH . 'includes/vendor/composer/autoload_classmap.php',
		// Third-party classes.
		include GOOGLESITEKIT_PLUGIN_DIR_PATH . 'third-party/vendor/composer/autoload_classmap.php'
	);

	spl_autoload_register(
		function ( $class_instance ) use ( $class_map ) {
			if (
				// Only handle classes defined in our class maps.
				isset( $class_map[ $class_instance ] )
				// Only load Site Kit classes or others that exist (e.g. polyfills).
				&& (
					0 === strpos( $class_instance, 'Google\\Site_Kit\\' )
					|| 0 === strpos( $class_instance, 'Google\\Site_Kit_Dependencies\\' )
					|| file_exists( $class_map[ $class_instance ] )
				)
			) {
				require_once $class_map[ $class_instance ];
			}
		},
		true,
		true
	);
}
autoload_classes();

/**
 * Loads files containing functions from generated file map.
 *
 * @since 1.0.0
 * @access private
 */
function autoload_vendor_files() {
	// Third-party files.
	$files = require GOOGLESITEKIT_PLUGIN_DIR_PATH . 'third-party/vendor/autoload_files.php';
	foreach ( $files as $file_identifier => $file ) {
		require_once $file;
	}
}
autoload_vendor_files();

// Initialize the plugin.
Plugin::load( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
