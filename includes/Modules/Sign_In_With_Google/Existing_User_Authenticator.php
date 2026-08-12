<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Existing_User_Authenticator
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google;

use Google\Site_Kit\Core\Util\Input;
use WP_User;

/**
 * Authenticator used when a signed-in user initiates Sign in with Google
 * from their own profile page to link an existing WordPress account to a
 * Google account.
 *
 * @since 1.182.0
 * @access private
 * @ignore
 */
class Existing_User_Authenticator extends Authenticator {

	/**
	 * Error code surfaced when the Google account is already linked to another user.
	 *
	 * @since 1.182.0
	 */
	const ERROR_ACCOUNT_ALREADY_CONNECTED = 'googlesitekit_auth_account_already_connected';

	/**
	 * Query argument that holds the error code for the existing-user link
	 * flow.
	 *
	 * We use our own namespaced argument instead of WordPress core's
	 * `?error=` on `wp-admin/profile.php` and `wp-admin/user-edit.php`. Those
	 * pages show an error notice for any `?error=` value, but only fill in
	 * the text for codes they know (like `new-email`). Our code isn't one of
	 * those, so reusing `?error=` would show the user an empty error box next
	 * to our own error.
	 *
	 * @since 1.182.0
	 */
	const ERROR_QUERY_ARG = 'googlesitekit_error';

	/**
	 * Authenticates the current WordPress user against the provided Google
	 * credential and stores the hashed Google user ID against their profile.
	 *
	 * Differences from the base `Authenticator`:
	 *
	 * - The currently authenticated WordPress user is the target, regardless
	 *   of the Google account's email address.
	 * - A new user is never created. Open registration is irrelevant.
	 * - If the Google account is already linked to another WordPress user,
	 *   an error is triggered.
	 *
	 * @since 1.182.0
	 *
	 * @param Input $input Input instance.
	 * @return string Redirect URL.
	 */
	public function authenticate_user( Input $input ): string {
		$current_user = wp_get_current_user();
		if ( ! $current_user instanceof WP_User || empty( $current_user->ID ) ) {
			return $this->get_error_redirect_url( self::ERROR_INVALID_REQUEST );
		}

		// Tie the link request to the current WordPress session so the
		// user's auth cookie alone can't validate a cross-site request.
		$nonce = $input->filter( INPUT_POST, 'connect_nonce' );
		if ( ! wp_verify_nonce( $nonce, self::CONNECT_EXISTING_USER_NONCE_ACTION ) ) {
			return $this->get_error_redirect_url( self::ERROR_INVALID_REQUEST );
		}

		$credential = $input->filter( INPUT_POST, 'credential' );
		$payload    = $this->profile_reader->get_profile_data( $credential );

		if ( is_wp_error( $payload ) ) {
			return $this->get_error_redirect_url( self::ERROR_INVALID_REQUEST );
		}

		$google_user_hashed_id = $this->get_hashed_google_user_id( $payload );

		// Check to see if the Google user ID for the Google Account we signed in
		// with is already in use (eg. registered to another user on the site).
		//
		// If this is the case, we'll trigger an error instead of associating
		// this Google Account with the current user.
		$existing_user = get_users(
			array(
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_key'   => $this->user_options->get_meta_key( Hashed_User_ID::OPTION ),
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'meta_value' => $google_user_hashed_id,
				'number'     => 1,
				'exclude'    => array( $current_user->ID ),
				'fields'     => 'ID',
			)
		);

		if ( ! empty( $existing_user ) ) {
			return $this->get_error_redirect_url( self::ERROR_ACCOUNT_ALREADY_CONNECTED );
		}

		// Link the Google account by writing the hashed user ID to the current user.
		$this->user_options->set( Hashed_User_ID::OPTION, $google_user_hashed_id );

		return get_edit_user_link( $current_user->ID );
	}

	/**
	 * Builds the redirect URL used when an error needs to be surfaced.
	 *
	 * The base `Authenticator` redirects to `wp-login.php` for error display,
	 * but the existing-user link flow lives in the WordPress admin, so we
	 * redirect back to the user's edit profile page with the error appended
	 * as a query argument.
	 *
	 * @since 1.182.0
	 *
	 * @param string $code Error code.
	 * @return string Redirect URL.
	 */
	protected function get_error_redirect_url( $code ): string {
		$user_id = get_current_user_id();
		$target  = $user_id ? get_edit_user_link( $user_id ) : admin_url( 'profile.php' );

		// Do not use `error=` as the query arg here. On
		// `wp-admin/profile.php` and `wp-admin/user-edit.php`, the user would
		// see an empty error box for any `?error=` value core doesn't know.
		return add_query_arg( self::ERROR_QUERY_ARG, $code, $target );
	}
}
