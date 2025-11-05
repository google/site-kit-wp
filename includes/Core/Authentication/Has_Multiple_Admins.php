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

			// Cache the count for 1 week.
			$this->transients->set( self::OPTION, $admins_count, WEEK_IN_SECONDS );
		}

		return $admins_count > 1;
	}

	/**
	 * Registers hooks to keep the cached value accurate.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		// Invalidate when a user is registered (might be an admin) or deleted.
		add_action( 'user_register', array( $this, 'invalidate' ) );
		add_action( 'deleted_user', array( $this, 'invalidate' ) );

		// Invalidate when a role changes to or from administrator.
		add_action(
			'set_user_role',
			function ( $user_id, $role, $old_roles ) {
				if ( 'administrator' === strtolower( $role ) || in_array( 'administrator', array_map( 'strtolower', (array) $old_roles ), true ) ) {
					$this->invalidate();
				}
			},
			10,
			3
		);
	}

	/**
	 * Deletes the cached admins count.
	 *
	 * @since n.e.x.t
	 * @return void
	 */
	public function invalidate() {
		$this->transients->delete( self::OPTION );
	}
}
