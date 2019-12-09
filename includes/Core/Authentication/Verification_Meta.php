<?php
/**
 * Class Verification_Meta
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Storage\Transients;

/**
 * Class representing the site verification meta tag for a user.
 *
 * @since 1.1.0
 * @access private
 * @ignore
 */
final class Verification_Meta {

	/**
	 * User option key.
	 */
	const OPTION = 'googlesitekit_site_verification_meta';

	/**
	 * User_Options object.
	 *
	 * @since 1.0.0
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Transients object.
	 *
	 * @since 1.0.0
	 * @var Transients
	 */
	private $transients;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param User_Options $user_options User Options instance.
	 * @param Transients   $transients   Transients instance.
	 */
	public function __construct( User_Options $user_options, Transients $transients ) {
		$this->user_options = $user_options;
		$this->transients   = $transients;
	}

	/**
	 * Retrieves the user verification tag.
	 *
	 * @since 1.0.0
	 *
	 * @return string|bool Verification tag, or false if not set.
	 */
	public function get() {
		return $this->user_options->get( self::OPTION );
	}

	/**
	 * Saves the user verification tag.
	 *
	 * @since 1.0.0
	 *
	 * @param string $meta_tag Meta tag to store.
	 * @return bool True on success, false on failure.
	 */
	public function set( $meta_tag ) {
		$status = $this->user_options->set( self::OPTION, $meta_tag );
		if ( $status ) {
			$this->transients->delete( 'googlesitekit_verification_meta_tags' );
		}
		return $status;
	}

	/**
	 * Checks whether a verification tag for the user is present.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if verification meta tag is set, false otherwise.
	 */
	public function has() {
		$meta_tag = (string) $this->get();
		return ! empty( $meta_tag );
	}

	/**
	 * Gets all available verification tags for all users.
	 *
	 * This is a special method needed for printing all meta tags in the frontend.
	 *
	 * @since 1.0.0
	 *
	 * @return array List of verification meta tags.
	 */
	public function get_all() {
		global $wpdb;

		$meta_tags = $this->transients->get( 'googlesitekit_verification_meta_tags' );

		if ( false === $meta_tags ) {
			$meta_key = self::OPTION;
			if ( ! \Google\Site_Kit\Plugin::instance()->context()->is_network_mode() ) {
				$meta_key = $wpdb->get_blog_prefix() . $meta_key;
			}
			// phpcs:ignore WordPress.VIP.DirectDatabaseQuery
			$meta_tags = $wpdb->get_col( $wpdb->prepare( "SELECT DISTINCT meta_value FROM {$wpdb->usermeta} WHERE meta_key = %s", $meta_key ) );
			$this->transients->set( 'googlesitekit_verification_meta_tags', $meta_tags );
		}

		return (array) $meta_tags;
	}
}
