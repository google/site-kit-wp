<?php
/**
 * Class Verification_File
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class representing the site verification file for a user.
 *
 * @since 1.0.5
 * @access private
 * @ignore
 */
final class Verification_File {

	/**
	 * User option key.
	 */
	const OPTION = 'googlesitekit_site_verification_file';

	/**
	 * User_Options object.
	 *
	 * @since 1.0.5
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Constructor.
	 *
	 * @since 1.0.5
	 *
	 * @param User_Options $user_options User Options instance.
	 */
	public function __construct( User_Options $user_options ) {
		$this->user_options = $user_options;
	}

	/**
	 * Retrieves the user verification file.
	 *
	 * @since 1.0.5
	 *
	 * @return string|bool Verification file, or false if not set.
	 */
	public function get() {
		return $this->user_options->get( self::OPTION );
	}

	/**
	 * Saves the user verification file.
	 *
	 * @since 1.0.5
	 *
	 * @param string $filename File name to store.
	 *
	 * @return bool True on success, false on failure.
	 */
	public function set( $filename ) {
		return $this->user_options->set( self::OPTION, $filename );
	}

	/**
	 * Checks whether a verification file for the user is present.
	 *
	 * @since 1.0.5
	 *
	 * @return bool True if verification file file is set, false otherwise.
	 */
	public function has() {
		return (bool) $this->get();
	}
}
