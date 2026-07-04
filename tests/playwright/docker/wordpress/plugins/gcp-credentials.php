<?php
/**
 * Plugin Name: E2E Tests GCP Credentials Plugin
 * Description: Utility plugin for forcing legacy Google Cloud Project OAuth credentials during E2E tests.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

/**
 * Provide placeholder client configuration, normally provided in step 1 of the set up.
 */
add_filter(
	'googlesitekit_oauth_secret',
	function () {
		return array(
			'web' => array(
				'client_id'     => '1234567890-asdfasdfasdfasdfzxcvzxcvzxcvzxcv.apps.googleusercontent.com',
				'client_secret' => 'x_xxxxxxxxxxxxxxxxxxxxxx',
			),
		);
	}
);
