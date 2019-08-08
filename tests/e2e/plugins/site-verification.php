<?php
/**
 * Plugin Name: E2E Tests Site Verification Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for bypassing site verification during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 */

/**
 * Fake a verified site state.
 */
add_filter( 'get_user_option_googlesitekit_site_verified_meta', function () {
	return 'verified';
} );
