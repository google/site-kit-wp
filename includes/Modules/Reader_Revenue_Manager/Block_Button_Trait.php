<?php
/**
 * Trait Google\Site_Kit\Modules\Reader_Revenue_Manager\Block_Button_Trait
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

/**
 * Trait for shared RRM block button functionality.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Block_Button_Trait {

	/**
	 * Gets the sanitized button class attribute string.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $attributes Block attributes.
	 * @return string HTML class attribute string, or empty string.
	 */
	protected function get_button_class_attribute( $attributes ) {
		if ( ! is_array( $attributes ) || empty( $attributes['buttonClassName'] ) || ! is_string( $attributes['buttonClassName'] ) ) {
			return '';
		}

		$classes = array_filter(
			array_map(
				'sanitize_html_class',
				preg_split( '/\s+/', trim( $attributes['buttonClassName'] ) )
			)
		);

		if ( empty( $classes ) ) {
			return '';
		}

		return sprintf( ' class="%s"', esc_attr( implode( ' ', $classes ) ) );
	}
}
