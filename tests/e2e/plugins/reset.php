<?php
/**
 * Plugin Name: E2E Tests Reset Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for resetting Site Kit during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Util\Reset;

register_activation_hook(
	__FILE__,
	static function () {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			wp_die( 'Site Kit must be active to reset! Check the error log.' );
		}

		( new Reset( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) )->all();
	} 
);
