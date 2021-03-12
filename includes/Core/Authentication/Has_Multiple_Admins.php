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
 * @since n.e.x.t
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
	 * @since n.e.x.t
	 * @var Transients
	 */
	protected $transients;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Transients $transients Transients instance.
	 */
	public function __construct( Transients $transients ) {
		$this->transients = $transients;
	}

	/**
	 * Returns a flag indicating whether the current site has multiple users.
	 *
	 * @since n.e.x.t
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

			$this->transients->get( self::OPTION, $admins_count, HOUR_IN_SECONDS );
		}

		return $admins_count > 1;
	}

}
