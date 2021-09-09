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

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\DI\DI_Container;
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

	// Define scalar entities.
	$di['MAIN_FILE'] = GOOGLESITEKIT_PLUGIN_MAIN_FILE;

	// Define service entities.
	$di['context'] = function( $di ) {
		return new Context( $di['MAIN_FILE'] );
	};

	$di->set_services(
		array(
			'plugin'              => '\\Google\\Site_Kit\\Plugin',
			'modules'             => '\\Google\\Site_Kit\\Core\\Modules\\Modules',
			'assets'              => '\\Google\\Site_Kit\\Core\\Assets\\Assets',
			'options'             => '\\Google\\Site_Kit\\Core\\Storage\\Options',
			'transients'          => '\\Google\\Site_Kit\\Core\\Storage\\Transients',
			'admin_bar'           => '\\Google\\Site_Kit\\Core\\Admin_Bar\\Admin_Bar',
			'rest_routes'         => '\\Google\\Site_Kit\\Core\\REST_API\\REST_Routes',
			'searchanalytics_api' => '\\Google\\Site_Kit\\Modules\\Search_Console\\Google_API\\Search_Analytics',
			'ideahub_saved_ideas' => '\\Google\\Site_Kit\\Modules\\Idea_Hub\\Google_API\\Saved_Ideas',
			'ideahub_new_ideas'   => '\\Google\\Site_Kit\\Modules\\Idea_Hub\\Google_API\\New_Ideas',
			'ideahub_idea_state'  => '\\Google\\Site_Kit\\Modules\\Idea_Hub\\Google_API\\Idea_State',
			'ideahub_activities'  => '\\Google\\Site_Kit\\Modules\\Idea_Hub\\Google_API\\Activities',
		)
	);

	$di['user_options'] = function( $di ) {
		return new User_Options( $di['context'] );
	};

	$di['authentication'] = function( $di ) {
		return new Authentication( $di['context'], $di['options'], $di['user_options'], $di['transients'] );
	};

	// Define protected services.
	$di->set_protected( 'PLUGIN_CLASS' );
	$di->set_protected( 'plugin' );

	// Allow hijacking DI container in the non-production mode.
	if ( function_exists( 'wp_get_environment_type' ) && 'production' !== wp_get_environment_type() ) {
		do_action( 'googlesitekit_setup_di', $di );
	}

	return $di;
}
