<?php
/**
 * Class Google\Site_Kit\Modules\Idea_Hub\Post_Idea_Topics
 *
 * @package   Google\Site_Kit\Modules\Idea_Hub
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Idea_Hub;

use Google\Site_Kit\Core\Storage\Post_Meta_Setting;

/**
 * Class for Idea Hub topics setting.
 *
 * @since 1.33.0
 * @access private
 * @ignore
 */
class Post_Idea_Topics extends Post_Meta_Setting {

	const META_KEY = 'googlesitekitpersistent_idea_topics';

	/**
	 * Gets the setting type.
	 *
	 * @since 1.33.0
	 *
	 * @return string The array type.
	 */
	protected function get_type() {
		return 'array';
	}

	/**
	 * Returns a sanitize callback.
	 *
	 * @since 1.33.0
	 *
	 * @return callable Sanitize callback function.
	 */
	protected function get_sanitize_callback() {
		return function ( $option ) {
			$sanitized = array();
			if ( ! is_array( $option ) ) {
				return $sanitized;
			}

			foreach ( $option as $mid => $display_name ) {
				if ( is_string( $mid ) && is_string( $display_name ) ) {
					$sanitized[ sanitize_text_field( $mid ) ] = sanitize_text_field( $display_name );
				}
			}

			return $option;
		};
	}

}
