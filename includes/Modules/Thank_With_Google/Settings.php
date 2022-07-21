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
			'colorTheme',
			'buttonPlacement',
			'buttonPostTypes',
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
			'ownerID'         => '',
			'publicationID'   => '',
			'colorTheme'      => '',
			'buttonPlacement' => '',
			'buttonPostTypes' => array( 'post' ),
		);
	}

	/**
	 * Gets the setting value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	public function get() {
		$option = parent::get();

		if ( is_array( $option ) ) {
			if ( isset( $option['buttonPostTypes'] ) ) {
				$option['buttonPostTypes'] = $this->sanitize_button_post_types( $option['buttonPostTypes'] );
			}
		}

		return $option;
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable|null
	 */
	protected function get_sanitize_callback() {
		return function( $option ) {
			if ( is_array( $option ) ) {
				if ( isset( $option['colorTheme'] ) ) {
					$option['colorTheme'] = $this->sanitize_color_theme( $option['colorTheme'] );
				}
				if ( isset( $option['buttonPlacement'] ) ) {
					$option['buttonPlacement'] = $this->sanitize_button_placement( $option['buttonPlacement'] );
				}
				if ( isset( $option['buttonPostTypes'] ) ) {
					$option['buttonPostTypes'] = $this->sanitize_button_post_types( $option['buttonPostTypes'] );
				}
			}
			return $option;
		};
	}

	/**
	 * Sanitizes the value of color theme.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $color_theme The value to sanitize.
	 * @return string The sanitized value.
	 */
	private function sanitize_color_theme( $color_theme ) {
		if ( in_array( $color_theme, array( 'blue' ), true ) ) {
			return $color_theme;
		}
		return '';
	}

	/**
	 * Sanitizes the value of button placement.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $button_placement The value to sanitize.
	 * @return string The sanitized value.
	 */
	private function sanitize_button_placement( $button_placement ) {
		if ( in_array(
			$button_placement,
			array(
				'dynamic_low',
				'dynamic_high',
				'static_auto',
				'static_above-content',
				'static_below-content',
				'static_below-first-paragraph',
			),
			true
		) ) {
			return $button_placement;
		}
		return '';
	}

	/**
	 * Sanitizes the value of button post types.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $button_post_types The value to sanitize.
	 * @return array The sanitized value.
	 */
	private function sanitize_button_post_types( $button_post_types ) {
		if ( ! is_array( $button_post_types ) ) {
			return array();
		}
		return array_intersect(
			$button_post_types,
			array_filter(
				get_post_types(),
				function( $post_type ) {
					return is_post_type_viewable( $post_type );
				}
			)
		);
	}
}
