<?php
/**
 * Plugin Name: E2E Tests Module Setup Analytics API Mock No Account
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for mocking Analytics Setup API requests during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\E2E\Modules\AnalyticsNoAccount;

use Google\Site_Kit\Core\REST_API\REST_Routes;
use WP_Error;

add_action( 'rest_api_init', function () {

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/analytics/data/accounts-properties-profiles',
		array(
			'methods'  => 'GET',
			'callback' => function () {
				/**
				 * Returned by \Google\Site_Kit\Core\Modules\Module::exception_to_error
				 */
				return new WP_Error(
					403,
					'User does not have any Google Analytics account.',
					array(
						'status' => 500,
						'reason' => 'insufficientPermissions',
					)
				);
			}
		),
		true
	);

	register_rest_route(
		REST_Routes::REST_ROOT,
		'e2e/setup/analytics/account-created',
		array(
			'methods'  => 'POST',
			'callback' => function () {
				require_once( ABSPATH . 'wp-admin/includes/plugin.php' );

				deactivate_plugins( plugin_basename( __FILE__ ), true );
				activate_plugin( plugin_basename( __DIR__ . '/module-setup-analytics.php' ), '', false, true );

				return array( 'success' => true );
			}
		)
	);

}, 0 );
