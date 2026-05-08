<?php
/**
 * Class Google\Site_Kit\Core\Prompts\Dismissed_Prompts
 *
 * @package   Google\Site_Kit\Core\Prompts
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Prompts;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for representing a user's dismissed prompts.
 *
 * @since 1.121.0
 * @access private
 * @ignore
 */
class Dismissed_Prompts extends User_Setting {

	/**
	 * The user option name for this setting.
	 *
	 * @note This option is prefixed differently so that it will persist across disconnect/reset.
	 */
	const OPTION = 'googlesitekitpersistent_dismissed_prompts';

	const DISMISS_PROMPT_PERMANENTLY = 0;

	/**
	 * Adds one prompt to the list of dismissed prompts or updates the triggered count.
	 *
	 * @since 1.121.0
	 *
	 * @param string $prompt             Prompt to dismiss.
	 * @param int    $expires_in_seconds TTL for the prompt.
	 */
	public function add( $prompt, $expires_in_seconds = self::DISMISS_PROMPT_PERMANENTLY ) {
		$prompts = $this->get();

		if ( array_key_exists( $prompt, $prompts ) ) {
			$prompts[ $prompt ]['expires'] = $expires_in_seconds ? time() + $expires_in_seconds : 0;
			$prompts[ $prompt ]['count']   = $prompts[ $prompt ]['count'] + 1;
		} else {
			$prompts[ $prompt ] = array(
				'expires' => $expires_in_seconds ? time() + $expires_in_seconds : 0,
				'count'   => 1,
			);
		}

		$this->set( $prompts );
	}

	/**
	 * Removes one or more prompts from the list of dismissed prompts.
	 *
	 * @since 1.121.0
	 *
	 * @param string $prompt Item to remove.
	 */
	public function remove( $prompt ) {
		$prompts = $this->get();

		// If the prompt is not in dismissed prompts, there's nothing to do.
		if ( ! array_key_exists( $prompt, $prompts ) ) {
			return;
		}

		unset( $prompts[ $prompt ] );

		$this->set( $prompts );
	}

	/**
	 * Gets the value of the setting.
	 *
	 * @since 1.121.0
	 *
	 * @return array Value set for the option, or default if not set.
	 */
	public function get() {
		$value = parent::get();
		return is_array( $value ) ? $value : $this->get_default();
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since 1.121.0
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'array';
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.121.0
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array();
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.121.0
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $prompts ) {
			if ( ! is_array( $prompts ) ) {
				return $this->get_default();
			}

			$sanitized_prompts = array();

			foreach ( $prompts as $prompt => $data ) {
				if ( is_array( $data ) && isset( $data['expires'], $data['count'] ) && is_numeric( $data['expires'] ) && is_numeric( $data['count'] ) ) {
					$sanitized_prompts[ $prompt ] = array(
						'expires' => $data['expires'],
						'count'   => $data['count'],
					);
				}
			}

			return $sanitized_prompts;
		};
	}
}
