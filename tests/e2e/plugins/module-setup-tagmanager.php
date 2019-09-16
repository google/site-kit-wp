<?php
/**
 * Plugin Name: E2E Tests Module Setup TagManager API Mock
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for mocking TagManager Setup API requests during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\REST_API\REST_Routes;

add_action( 'rest_api_init', function () {

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/tagmanager/data/accounts-containers',
		array(
			'callback' => function () {
				return array(
					'accounts'   => array(
						array(
							'accountId' => '123456789',
							'name'      => 'Test Account A',
						)
					),
					'containers' => array(
						array(
							'accountId'   => '123456789',
							'publicId'    => 'GTM-ABCXYZ',
							'name'        => 'Test Container X',
						)
					),
				);
			}
		),
		true
	);

}, 0 );
