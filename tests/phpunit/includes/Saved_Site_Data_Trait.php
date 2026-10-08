<?php
/**
 * Trait Google\Site_Kit\Tests\Saved_Site_Data_Trait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

/**
 * Trait for testing that nothing is saved to the site.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Saved_Site_Data_Trait {

	/**
	 * Gets every row of the options, post meta, and user meta tables.
	 *
	 * WordPress stores a transient in the options table when the site has no
	 * persistent object cache, so the `options` rows include every transient.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The rows of each table, keyed by `options`, `post_meta`, and `user_meta`.
	 */
	protected function get_saved_site_data() {
		global $wpdb;

		return array(
			'options'   => $wpdb->get_results( "SELECT option_name, option_value FROM $wpdb->options ORDER BY option_name", ARRAY_A ),
			'post_meta' => $wpdb->get_results( "SELECT post_id, meta_key, meta_value FROM $wpdb->postmeta ORDER BY meta_id", ARRAY_A ),
			'user_meta' => $wpdb->get_results( "SELECT user_id, meta_key, meta_value FROM $wpdb->usermeta ORDER BY umeta_id", ARRAY_A ),
		);
	}
}
