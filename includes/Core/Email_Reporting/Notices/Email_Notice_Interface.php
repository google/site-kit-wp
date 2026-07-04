<?php
/**
 * Interface Google\Site_Kit\Core\Email_Reporting\Notices\Email_Notice_Interface
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting\Notices;

use WP_User;

/**
 * Interface for in-email notice definitions.
 *
 * @since 1.175.0
 * @access private
 * @ignore
 */
interface Email_Notice_Interface {

	/**
	 * Gets the notice ID.
	 *
	 * @since 1.175.0
	 *
	 * @return string Notice ID.
	 */
	public function get_id();

	/**
	 * Gets the notice placement.
	 *
	 * @since 1.175.0
	 *
	 * @return string Placement slug.
	 */
	public function get_placement();

	/**
	 * Gets the target section key for section placement notices.
	 *
	 * Header notices should return an empty string.
	 *
	 * @since 1.175.0
	 *
	 * @return string Section key.
	 */
	public function get_section_key();

	/**
	 * Gets the dismissal slug used for prompt storage.
	 *
	 * @since 1.175.0
	 *
	 * @return string Dismissal slug.
	 */
	public function get_dismissal_slug();

	/**
	 * Determines whether the notice should be shown to a user.
	 *
	 * @since 1.175.0
	 *
	 * @param WP_User $user User.
	 * @return bool True if notice should be displayed.
	 */
	public function should_display( WP_User $user );

	/**
	 * Gets the display payload for a user.
	 *
	 * @since 1.175.0
	 *
	 * @param WP_User $user User.
	 * @return array Notice payload.
	 *               {
	 *                   @type string $title           Notice title.
	 *                   @type string $body            Notice body.
	 *                   @type string $cta_label       CTA label.
	 *                   @type string $cta_url         CTA URL.
	 *                   @type string $learn_more_label Optional learn more label.
	 *                   @type string $learn_more_url   Optional learn more URL.
	 *               }
	 */
	public function get_payload( WP_User $user );

	/**
	 * Gets redirect URL for a notice CTA click.
	 *
	 * @since 1.175.0
	 *
	 * @param WP_User $user User.
	 * @return string Redirect URL.
	 */
	public function get_redirect_url( WP_User $user );
}
