<?php
/**
 * Trait Google\Site_Kit\Core\Email_Reporting\User_Role_Trait
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use WP_User;

/**
 * Trait for shaping user roles in email reporting user listings.
 *
 * @since 1.185.0
 * @access private
 * @ignore
 */
trait User_Role_Trait {

	/**
	 * Gets the primary role slug of the user.
	 *
	 * @since 1.170.0
	 * @since 1.185.0 Moved from REST_Email_Reporting_Controller into this trait.
	 *
	 * @param WP_User $user User object.
	 * @return string Primary role slug, or an empty string if the user has no roles.
	 */
	private function get_primary_role( WP_User $user ) {
		if ( empty( $user->roles ) ) {
			return '';
		}

		$roles = array_values( $user->roles );

		return (string) reset( $roles );
	}

	/**
	 * Gets the translated display name for a role slug.
	 *
	 * @since 1.185.0 Extracted from REST_Email_Reporting_Controller::get_primary_role_display_name().
	 *
	 * @param string $role_slug Role slug.
	 * @return string Translated role display name.
	 */
	private function get_role_display_name( $role_slug ) {
		if ( '' === $role_slug ) {
			return '';
		}

		$role_name = wp_roles()->get_names()[ $role_slug ] ?? $role_slug;

		return translate_user_role( $role_name );
	}

	/**
	 * Gets the translated display name of the user's primary role.
	 *
	 * @since 1.178.0
	 * @since 1.185.0 Moved from REST_Email_Reporting_Controller into this trait.
	 *
	 * @param WP_User $user User object.
	 * @return string Translated role display name.
	 */
	private function get_primary_role_display_name( WP_User $user ) {
		return $this->get_role_display_name( $this->get_primary_role( $user ) );
	}
}
