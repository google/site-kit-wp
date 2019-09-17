<?php
/**
 * Plugin Name: E2E Tests Module Setup AdSense API Mock
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for mocking AdSense Setup API requests during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\E2E\Modules\AdSense;

use Google\Site_Kit\Core\REST_API\REST_Routes;

add_action( 'rest_api_init', function () {

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/adsense/data/accounts',
		array(
			'callback' => function () {
				return array(
					array(
						'id' => '123456789',
						'name' => 'Test Account A',
					)
				);
			}
		),
		true
	);

}, 0 );
