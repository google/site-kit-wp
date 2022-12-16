<?php
/**
 * Class Google\Site_Kit\Core\User_Input\User_Specific_Answers
 *
 * @package   Google\Site_Kit\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Input;

use Closure;
use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for handling the user specific answers in User Input.
 *
 * @since 1.90.0
 * @access private
 * @ignore
 */
class User_Specific_Answers extends User_Setting {

	/**
	 * The user option name for this setting.
	 */
	const OPTION = 'googlesitekit_user_input_settings';

	/**
	 * The scope for which the questions are handled by this class.
	 */
	const SCOPE = 'user';

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.90.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'array';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.90.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.90.0
	 *
	 * @return Closure
	 */
	protected function get_sanitize_callback() {
		$questions = array_filter(
			User_Input::get_questions(),
			function ( $question ) {
				return static::SCOPE === $question['scope'];
			}
		);

		return function ( $settings ) use ( $questions ) {
			if ( ! is_array( $settings ) ) {
				return $this->get();
			}

			$results = array();

			foreach ( $settings as $setting_key => $setting_values ) {
				// Ensure all the data is valid.
				if (
					! in_array( $setting_key, array_keys( $questions ), true ) ||
					! is_array( $setting_values ) ||
					static::SCOPE !== $setting_values['scope'] ||
					! is_array( $setting_values['values'] )
				) {
					continue;
				}

				$valid_values          = array();
				$valid_values['scope'] = $setting_values['scope'];

				$valid_answers = array();

				// Verify that each answer value is a string.
				foreach ( $setting_values['values'] as $answer ) {
					if ( is_scalar( $answer ) ) {
						$valid_answers[] = $answer;
					}
				}

				$valid_values['values'] = $valid_answers;

				if ( ! empty( $valid_values ) ) {
					$results[ $setting_key ] = $valid_values;
				}
			}

			return $results;

		};
	}
}
