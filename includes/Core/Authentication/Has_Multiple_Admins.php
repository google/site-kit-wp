<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Has_Multiple_Admins
 *
 * @package   Google\Site_Kit\Core\Authentication
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use WP_User;
use WP_User_Query;

/**
 * Has_Multiple_Admins class.
 *
 * @since 1.29.0
 * @access private
 * @ignore
 */
class Has_Multiple_Admins {

	use Method_Proxy_Trait;

	/**
	 * The option_name for this transient.
	 */
	const OPTION = 'googlesitekit_has_multiple_admins';

	/**
	 * Transients instance.
	 *
	 * @since 1.29.0
	 * @var Transients
	 */
	protected $transients;

	/**
	 * Constructor.
	 *
	 * @since 1.29.0
	 *
	 * @param Transients $transients Transients instance.
	 */
	public function __construct( Transients $transients ) {
		$this->transients = $transients;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.166.0
	 */
	public function register() {
		add_action( 'deleted_user', $this->get_method_proxy( 'handle_user_deletion' ), 10, 3 );
		add_action( 'set_user_role', $this->get_method_proxy( 'handle_set_user_role' ), 10, 3 );
		add_action( 'add_user_role', $this->get_method_proxy( 'handle_add_remove_role' ), 10, 2 );
		add_action( 'remove_user_role', $this->get_method_proxy( 'handle_add_remove_role' ), 10, 2 );
	}

	/**
	 * Returns a flag indicating whether the current site has multiple users.
	 *
	 * @since 1.29.0
	 *
	 * @return boolean TRUE if the site kit has multiple admins, otherwise FALSE.
	 */
	public function get() {
		$admins_count = $this->transients->get( self::OPTION );
		if ( false === $admins_count ) {
			$user_query_args = array(
				'number'      => 1,
				'role__in'    => array( 'Administrator' ),
				'count_total' => true,
			);

			$user_query   = new WP_User_Query( $user_query_args );
			$admins_count = $user_query->get_total();

			$this->transients->set( self::OPTION, $admins_count, WEEK_IN_SECONDS );
		}

		return $admins_count > 1;
	}

	/**
	 * Handles user deletion.
	 *
	 * Executed by the `deleted_user` hook.
	 * We skip clearing the transient cache, only if we are sure that the user
	 * being deleted is not an admin. The $user parameter is only available
	 * in WP 5.5+, so we do not rely on it.
	 *
	 * @since 1.166.0
	 *
	 * @param int     $user_id User ID.
	 * @param bool    $reassign Whether the user's posts are being reassigned.
	 * @param WP_User $user    User object.
	 * @return void
	 */
	protected function handle_user_deletion( $user_id, $reassign, $user = null ) {
		if ( $user instanceof WP_User && ! in_array( 'administrator', $user->roles, true ) ) {
			return;
		}
		$this->transients->delete( self::OPTION );
	}

	/**
	 * Clears transient cache when a user is added or updated
	 *
	 * Executed by the `set_user_role` hook. `WP_User::set_role()` is used when
	 * adding a new user as well as updating an existing user's profile (so we do not
	 * have to specifically hook into `user_register` or `profile_update` hooks).
	 * Furthermore, `WP_User::set_role()` calls `remove_role()` and `add_role()` internally,
	 * but only after WordPress 6.0. So we still have to hook into `set_user_role` to cover
	 * all versions before it.
	 * We skip clearing the transient cache only if we are sure that we aren't
	 * changing a role from or to the 'administrator' role.
	 *
	 * @since 1.166.0
	 *
	 * @param int    $user_id   User ID.
	 * @param string $role      New role.
	 * @param array  $old_roles Old roles.
	 * @return void
	 */
	protected function handle_set_user_role( $user_id, $role, $old_roles = array() ) {
		if ( ! in_array( 'administrator', (array) $old_roles, true ) && 'administrator' !== $role ) {
			return;
		}
		$this->transients->delete( self::OPTION );
	}

	/**
	 * Handles user role changes.
	 *
	 * Executed by the `add_user_role` and `remove_user_role` hooks. These hooks
	 * are called internally by `WP_User::add_role()` and `WP_User::remove_role()`
	 * respectively. From WordPress 6.0, these hooks are always called even
	 * when the more generic `WP_User::set_role()` is used when adding or updating
	 * a user. However, for backwards compatibility with earlier versions, we still
	 * have to clear the cache and hook into `set_user_role` separately.
	 * We skip clearing the transient cache only if we are sure that
	 * the role being added/removed is 'administrator'.
	 *
	 * @since 1.166.0
	 *
	 * @param int    $user_id User ID.
	 * @param string $role    Role being added/removed.
	 * @return void
	 */
	protected function handle_add_remove_role( $user_id, $role ) {
		if ( 'administrator' !== $role ) {
			return;
		}
		$this->transients->delete( self::OPTION );
	}
}
