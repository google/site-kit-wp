<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Settings
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google;

use Google\Site_Kit\Core\Modules\Module_Settings;

/**
 * Class for Sign_In_With_Google settings.
 *
 * @since 1.137.0
 * @access private
 * @ignore
 */
class Settings extends Module_Settings {

	const OPTION = 'googlesitekit_sign-in-with-google_settings';

	const TEXT_CONTINUE_WITH_GOOGLE = 'continue_with';
	const TEXT_SIGN_IN              = 'signin';
	const TEXT_SIGN_IN_WITH_GOOGLE  = 'signin_with';
	const TEXT_SIGN_UP_WITH_GOOGLE  = 'signup_with';

	const THEME_LIGHT   = 'outline';
	const THEME_NEUTRAL = 'filled_blue';
	const THEME_DARK    = 'filled_black';

	const SHAPE_RECTANGULAR = 'rectangular';
	const SHAPE_PILL        = 'pill';

	/**
	 * Gets the default value.
	 *
	 * @since 1.137.0
	 *
	 * @return array An array of default settings values.
	 */
	protected function get_default() {
		return array(
			'clientID'      => '',
			'text'          => self::TEXT_SIGN_IN_WITH_GOOGLE,
			'theme'         => self::THEME_LIGHT,
			'shape'         => self::SHAPE_RECTANGULAR,
			'oneTapEnabled' => false,
		);
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.137.0
	 *
	 * @return callable|null
	 */
	protected function get_sanitize_callback() {
		return function ( $option ) {
			if ( ! is_array( $option ) ) {
				return $option;
			}

			if ( isset( $option['clientID'] ) ) {
				$option['clientID'] = (string) $option['clientID'];
			}

			if ( isset( $option['text'] ) ) {
				$text_options = array(
					self::TEXT_CONTINUE_WITH_GOOGLE,
					self::TEXT_SIGN_IN,
					self::TEXT_SIGN_IN_WITH_GOOGLE,
					self::TEXT_SIGN_UP_WITH_GOOGLE,
				);

				if ( ! in_array( $option['text'], $text_options, true ) ) {
					$option['text'] = self::TEXT_SIGN_IN_WITH_GOOGLE;
				}
			}

			if ( isset( $option['theme'] ) ) {
				$theme_options = array(
					self::THEME_LIGHT,
					self::THEME_NEUTRAL,
					self::THEME_DARK,
				);

				if ( ! in_array( $option['theme'], $theme_options, true ) ) {
					$option['theme'] = self::THEME_LIGHT;
				}
			}

			if ( isset( $option['shape'] ) ) {
				$shape_options = array(
					self::SHAPE_RECTANGULAR,
					self::SHAPE_PILL,
				);

				if ( ! in_array( $option['shape'], $shape_options, true ) ) {
					$option['shape'] = self::SHAPE_RECTANGULAR;
				}
			}

			if ( isset( $option['oneTapEnabled'] ) ) {
				$option['oneTapEnabled'] = (bool) $option['oneTapEnabled'];
			}

			return $option;
		};
	}
}
