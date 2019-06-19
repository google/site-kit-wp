<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Verification
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class representing the status of whether a user is verified as an owner of the site.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Verification {

	/**
	 * User option key.
	 */
	const OPTION = 'googlesitekit_site_verified_meta';

	/**
	 * User_Options object.
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
	 * @param User_Options $user_options User Options instance.
	 */
	public function __construct( User_Options $user_options ) {
		$this->user_options = $user_options;
	}

	/**
	 * Retrieves the user verification tag.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if the user is verified, or false otherwise.
	 */
	public function get() {
		return (bool) $this->user_options->get( self::OPTION );
	}

	/**
	 * Flags the user as verified or unverified.
	 *
	 * @since 1.0.0
	 *
	 * @param bool $verified Whether to flag the user as verified or unverified.
	 * @return bool True on success, false on failure.
	 */
	public function set( $verified ) {
		if ( ! $verified ) {
			return $this->user_options->delete( self::OPTION );
		}

		return $this->user_options->set( self::OPTION, 'verified' );
	}

	/**
	 * Checks whether the user is verified.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if verified, false otherwise.
	 */
	public function has() {
		// Kind of redundant, but here for consistency.
		return $this->get();
	}
}
