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

/**
 * Loads Site Kit classes by their PSR-4 path.
 *
 * @since n.e.x.t
 * @access private
 */
function autoload_classes_psr4() {
	spl_autoload_register(
		function ( $class_instance ) {
			$prefix = 'Google\\Site_Kit\\';
			if ( 0 !== strpos( $class_instance, $prefix ) ) {
				return;
			}

			$file = GOOGLESITEKIT_PLUGIN_DIR_PATH . 'includes/' . str_replace( '\\', '/', substr( $class_instance, strlen( $prefix ) ) ) . '.php';
			if ( file_exists( $file ) ) {
				require_once $file;
			}
		},
		true,
		true
	);
}

/**
 * Loads generated class maps for autoloading.
 *
 * In a source checkout, Site Kit classes are loaded via PSR-4 instead of the
 * generated class map, so new classes load without regenerating it and classes
 * that do not follow PSR-4 fail during development rather than only in the
 * release build.
 *
 * @since 1.0.0
 * @since n.e.x.t Loads Site Kit classes via PSR-4 in a source checkout.
 * @access private
 */
function autoload_classes() {
	// Third-party classes.
	$class_map = include GOOGLESITEKIT_PLUGIN_DIR_PATH . 'third-party/vendor/composer/autoload_classmap.php';

	// Release builds do not include composer.json.
	if ( file_exists( GOOGLESITEKIT_PLUGIN_DIR_PATH . 'composer.json' ) ) {
		autoload_classes_psr4();
	} else {
		// Site Kit classes.
		$class_map = array_merge(
			include GOOGLESITEKIT_PLUGIN_DIR_PATH . 'includes/vendor/composer/autoload_classmap.php',
			$class_map
		);
	}

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
