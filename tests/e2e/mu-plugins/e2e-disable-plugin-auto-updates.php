<?php
/**
 * Plugin Name: Disable Plugin auto-updates
 *
 * @package   Google\Site_Kit
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// Disable auto-updates for all plugins; this prevents the plugin from
// prompting the user with "Enable automatic updates" notification instead
// of other notifications we often test for in E2E tests.
add_filter( 'auto_update_plugin', '__return_false' );
