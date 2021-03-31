<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Profile
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class controlling the user's Google profile.
 *
 * @since 0.1.0
 */
final class Profile {

	/**
	 * Option key in options table.
	 */
	const OPTION = 'googlesitekit_profile';

	/**
	 * User_Options instance.
	 *
	 * @since 1.0.0
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param User_Options $user_options User_Options instance.
	 */
	public function __construct( User_Options $user_options ) {
		$this->user_options = $user_options;
	}

	/**
	 * Retrieves user profile data.
	 *
	 * @since 1.0.0
	 *
	 * @return array|bool Value set for the profile, or false if not set.
	 */
	public function get() {
		return $this->user_options->get( self::OPTION );
	}

	/**
	 * Saves user profile data.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data User profile data: email and photo.
	 * @return bool True on success, false on failure.
	 */
	public function set( $data ) {
		return $this->user_options->set( self::OPTION, $data );
	}

	/**
	 * Verifies if user has their profile information stored.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if profile is set, false otherwise.
	 */
	public function has() {
		$profile = (array) $this->get();

		if ( ! empty( $profile['email'] ) && ! empty( $profile['photo'] ) ) {
			return true;
		}

		return false;
	}
}
