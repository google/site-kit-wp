<?php
/**
 * Plugin Name: E2E Tests Proxy Credentials Plugin
 * Description: Utility plugin for forcing proxy OAuth credentials during E2E tests.
 * Text Domain: e2e-tests-proxy-credentials-plugin
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_filter(
	'googlesitekit_oauth_secret',
	function () {
		return array(
			'web' => array(
				'client_id'     => '1234567890-asdfasdfasdfasdfzxcvzxcvzxcvzxcv.apps.sitekit.withgoogle.com',
				'client_secret' => 'x_xxxxxxxxxxxxxxxxxxxxxx',
			),
		);
	}
);
