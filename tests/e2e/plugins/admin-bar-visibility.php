<?php
/**
 * Plugin Name: E2E Tests Admin Bar Visibility
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for bypassing data check for a single post during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

/**
 * Bypass any filters to prevent Admin Bar from displaying.
 *
 * Does not affect initial checks regarding current screen or user capability.
 *
 * @see \Google\Site_Kit\Core\Admin_Bar\Admin_Bar::is_active
 */
add_filter( 'googlesitekit_show_admin_bar_menu', '__return_true', 999 );
