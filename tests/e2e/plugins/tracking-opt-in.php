<?php
/**
 * Plugin Name: E2E Tests User Tracking Opt-in
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for faking user tracking opt-in during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

add_filter(
	'get_user_option_googlesitekit_tracking_optin',
	'__return_true'
);
