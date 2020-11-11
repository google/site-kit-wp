<?php
/**
 * Uninstallation script for the plugin.
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// Prevent execution from directly accessing the file.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Load plugin main file to bootstrap infrastructure and add hooks.
require_once dirname( __FILE__ ) . '/google-site-kit.php';

// Fire action to trigger uninstallation logic.
do_action( 'googlesitekit_uninstallation' );
