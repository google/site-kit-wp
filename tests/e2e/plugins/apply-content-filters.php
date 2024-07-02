<?php
/**
 * Plugin Name: E2E Tests Apply Content Filters
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin to apply the_content filters outside of the loop
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */


/**
 * Applying the `the_content` filter outside of the loop used to cause the <amp-auto-ads> not be rendered on the single template.
 * @see https://github.com/google/site-kit-wp/issues/2114
 */
add_action(
	'wp_head',
	function () {
		apply_filters( 'the_content', '' );
	}
);
