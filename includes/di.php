<?php
/**
 * DI config.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit;

use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\DI\DI_Container;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Sets up a new DI container and returns it.
 *
 * @since n.e.x.t
 * @access private
 *
 * @return DI_Container DI container.
 */
function setup_di_container() {
	$di = new DI_Container();

	$di['MAIN_FILE'] = GOOGLESITEKIT_PLUGIN_MAIN_FILE;

	$di['context'] = function( $di ) {
		return new Context( $di['MAIN_FILE'] );
	};

	$di['plugin'] = function( $di ) {
		return new Plugin();
	};

	$di['options'] = function( $di ) {
		return new Options( $di['context'] );
	};

	$di['user_options'] = function( $di ) {
		return new User_Options( $di['context'] );
	};

	$di['transients'] = function( $di ) {
		return new Transients( $di['context'] );
	};

	$di['authentication'] = function( $di ) {
		return new Authentication( $di['context'], $di['options'], $di['user_options'], $di['transients'] );
	};

	$di['assets'] = function( $di ) {
		return new Assets( $di['context'] );
	};

	$di['modules'] = function() {
		return new Modules();
	};

	if ( function_exists( 'wp_get_environment_type' ) && 'production' !== wp_get_environment_type() ) {
		do_action( 'googlesitekit_setup_di', $di );
	}

	return $di;
}
