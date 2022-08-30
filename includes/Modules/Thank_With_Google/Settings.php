<?php
/**
 * Class Google\Site_Kit\Modules\Thank_With_Google\Settings
 *
 * @package   Google\Site_Kit\Modules\Thank_With_Google
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Thank_With_Google;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Interface;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Trait;

/**
 * Class for Thank with Google settings.
 *
 * @since 1.78.0
 * @access private
 * @ignore
 */
class Settings extends Module_Settings implements Setting_With_Owned_Keys_Interface {
	use Setting_With_Owned_Keys_Trait;

	const OPTION = 'googlesitekit_thank-with-google_settings';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.78.0
	 */
	public function register() {
		parent::register();

		$this->register_owned_keys();
	}

	/**
	 * Returns keys for owned settings.
	 *
	 * @since 1.78.0
	 *
	 * @return array An array of keys for owned settings.
	 */
	public function get_owned_keys() {
		return array(
			'publicationID',
		);
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.78.0
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			'ownerID'       => '',
			'publicationID' => '',
			'colorTheme'    => '',
			'ctaPlacement'  => '',
			'ctaPostTypes'  => array( 'post' ),
		);
	}

	/**
	 * Gets the setting value.
	 *
	 * @since 1.80.0
	 *
	 * @return array
	 */
	public function get() {
		$option = parent::get();

		if ( is_array( $option ) ) {
			if ( isset( $option['ctaPostTypes'] ) ) {
				$option['ctaPostTypes'] = $this->sanitize_cta_post_types( $option['ctaPostTypes'] );
			}
		}

		return $option;
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.80.0
	 *
	 * @return callable|null
	 */
	protected function get_sanitize_callback() {
		return function( $option ) {
			if ( is_array( $option ) ) {
				if ( isset( $option['colorTheme'] ) ) {
					$option['colorTheme'] = $this->sanitize_color_theme( $option['colorTheme'] );
				}
				if ( isset( $option['ctaPlacement'] ) ) {
					$option['ctaPlacement'] = $this->sanitize_cta_placement( $option['ctaPlacement'] );
				}
				if ( isset( $option['ctaPostTypes'] ) ) {
					$option['ctaPostTypes'] = $this->sanitize_cta_post_types( $option['ctaPostTypes'] );
				}
			}
			return $option;
		};
	}

	/**
	 * Sanitizes the value of color theme.
	 *
	 * @since 1.80.0
	 *
	 * @param string $color_theme The value to sanitize.
	 * @return string The sanitized value.
	 */
	private function sanitize_color_theme( $color_theme ) {
		$allowed_colors = array(
			'blue',
			'cyan',
			'green',
			'purple',
			'pink',
			'orange',
			'brown',
			'black',
		);

		if ( in_array( $color_theme, $allowed_colors, true ) ) {
			return $color_theme;
		}
		return '';
	}

	/**
	 * Sanitizes the value of CTA placement.
	 *
	 * @since 1.80.0
	 *
	 * @param string $cta_placement The value to sanitize.
	 * @return string The sanitized value.
	 */
	private function sanitize_cta_placement( $cta_placement ) {
		if ( in_array(
			$cta_placement,
			array(
				Web_Tag::PLACEMENT_DYNAMIC_LOW,
				Web_Tag::PLACEMENT_DYNAMIC_HIGH,
				Web_Tag::PLACEMENT_STATIC_AUTO,
				Web_Tag::PLACEMENT_STATIC_ABOVE_CONTENT,
				Web_Tag::PLACEMENT_STATIC_BELOW_CONTENT,
				Web_Tag::PLACEMENT_STATIC_AFTER_1ST_P,
			),
			true
		) ) {
			return $cta_placement;
		}
		return '';
	}

	/**
	 * Sanitizes the value of CTA post types.
	 *
	 * @since 1.80.0
	 *
	 * @param array $cta_post_types The value to sanitize.
	 * @return array The sanitized value.
	 */
	private function sanitize_cta_post_types( $cta_post_types ) {
		if ( ! is_array( $cta_post_types ) ) {
			return array();
		}
		return array_intersect(
			$cta_post_types,
			array_filter(
				get_post_types(),
				function( $post_type ) {
					return is_post_type_viewable( $post_type );
				}
			)
		);
	}
}
