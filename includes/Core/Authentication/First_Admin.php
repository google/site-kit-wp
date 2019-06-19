<?php
/**
 * Class Google\Site_Kit\Core\Authentication\First_Admin
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\Options;

/**
 * Class representing the first admin to verify the site.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class First_Admin {

	/**
	 * First admin option key.
	 */
	const OPTION = 'googlesitekit_first_admin';

	/**
	 * Options instance
	 *
	 * @since 1.0.0
	 * @var Options
	 */
	private $options;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Options $options Option API instance.
	 */
	public function __construct(
		Options $options
	) {
		$this->options = $options;
	}

	/**
	 * Checks whether a first admin has been set.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if the userid is not empty, false otherwise.
	 */
	public function has() {
		$userid = $this->get();
		return ! empty( $userid );
	}

	/**
	 * Retrieves the id of the first admin.
	 *
	 * @since 1.0.0
	 *
	 * @return int|bool User ID if the user is exist, or false otherwise.
	 */
	public function get() {
		return $this->options->get( self::OPTION );
	}

	/**
	 * Sets the id of the first admin.
	 *
	 * @since 1.0.0
	 *
	 * @param int $id The user id to set as first admin.
	 * @return bool True on success, false on failure.
	 */
	public function set( $id ) {
		return $this->options->set( self::OPTION, $id );
	}
}
