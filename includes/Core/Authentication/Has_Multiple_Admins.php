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
use WP_User_Query;

/**
 * Has_Multiple_Admins class.
 *
 * @since 1.29.0
 * @access private
 * @ignore
 */
class Has_Multiple_Admins {

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
	 * @since n.e.x.t
	 */
	public function register() {
		// We skip clearing the transient cache, only if we are sure that the user
		// being deleted is not an admin. The $user parameter is only available
		// in WP 5.5+, so we do not rely on it.
		add_action(
			'deleted_user',
			function ( $user_id, $reassign, $user = null ) {
				if ( isset( $user->roles ) && is_array( $user->roles ) && ! in_array( 'administrator', $user->roles, true ) ) {
					return;
				}
				$this->transients->delete( self::OPTION );
			},
			10,
			3
		);

		// We skip clearing the transient cache, only if we are sure that the role
		// change does not involve an admin role.
		add_action(
			'set_user_role',
			function ( $user_id, $role, $old_roles ) {
				if ( ! in_array( 'administrator', (array) $old_roles, true ) && 'administrator' !== $role ) {
					return;
				}
				$this->transients->delete( self::OPTION );
			},
			10,
			3
		);
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
	 * @since n.e.x.t
	 *
	 * @param int     $user_id User ID.
	 * @param bool    $reassign Whether the user's posts are being reassigned.
	 * @param WP_User $user    User object.
	 *
	 * @return void
	 */
	public function handle_user_deletion( $user_id, $reassign, $user = null ) {
		if ( isset( $user->roles ) && is_array( $user->roles ) && ! in_array( 'administrator', $user->roles, true ) ) {
			return;
		}
		$this->transients->delete( self::OPTION );
	}
}
