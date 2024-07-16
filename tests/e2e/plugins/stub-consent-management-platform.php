<?php
/**
 * Plugin Name: E2E Tests Stub Consent Management Platform Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for stubbing the presence of a CMP plugin during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_filter(
	'wp_get_consent_type',
	function () {
		return 'optin';
	}
);
