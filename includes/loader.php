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

use Google\Site_Kit\Core\Util\Build_Mode;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\JSON_File;

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
		function ( $class ) use ( $class_map ) {
			if ( isset( $class_map[ $class ] ) && 'Google\\Site_Kit' === substr( $class, 0, 15 ) ) {
				require_once $class_map[ $class ];
			}
		},
		true,
		true
	);
}

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

/**
 * Sets up feature flags and build mode.
 *
 * @since n.e.x.t
 * @access private
 */
function setup_feature_flags() {
	$config = new JSON_File( GOOGLESITEKIT_PLUGIN_DIR_PATH . 'dist/config.json' );
	Build_Mode::set_mode( $config['buildMode'] );
	Feature_Flags::set_features( (array) $config['features'] );
}

autoload_classes();
autoload_vendor_files();
setup_feature_flags();

// Initialize the plugin.
setup_di_container()
	->get( 'plugin' )
	->register();
