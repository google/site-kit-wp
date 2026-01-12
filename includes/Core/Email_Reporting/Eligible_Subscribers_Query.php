<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Eligible_Subscribers_Query
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\User_Options;
use WP_User_Query;

/**
 * Retrieves users eligible for email reporting invitations.
 *
 * @since 1.170.0
 * @access private
 * @ignore
 */
class Eligible_Subscribers_Query {

	const QUERY_LIMIT = 1000;

	/**
	 * User options instance.
	 *
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Modules manager instance.
	 *
	 * @var Modules
	 */
	private $modules;

	/**
	 * Constructor.
	 *
	 * @since 1.170.0
	 *
	 * @param Modules      $modules      Modules instance.
	 * @param User_Options $user_options User options instance.
	 */
	public function __construct( Modules $modules, User_Options $user_options ) {
		$this->modules      = $modules;
		$this->user_options = $user_options;
	}

	/**
	 * Retrieves users eligible for email reporting invitations.
	 *
	 * @since 1.170.0
	 *
	 * @param int $exclude_user_id User ID to exclude.
	 * @return \WP_User[] List of eligible users.
	 */
	public function get_eligible_users( $exclude_user_id ) {
		$exclude_user_id = (int) $exclude_user_id;

		if ( ! $exclude_user_id ) {
			$exclude_user_id = (int) get_current_user_id();
		}

		$excluded_user_ids = $exclude_user_id ? array( $exclude_user_id ) : array();

		$eligible_users = array();

		foreach ( $this->query_admins( $excluded_user_ids ) as $user ) {
			$eligible_users[ $user->ID ] = $user;
		}

		foreach ( $this->query_shared_roles( $excluded_user_ids ) as $user ) {
			$eligible_users[ $user->ID ] = $user;
		}

		return array_values( $eligible_users );
	}

	/**
	 * Queries Site Kit administrators.
	 *
	 * @since 1.170.0
	 *
	 * @param int[] $excluded_user_ids User IDs to exclude.
	 * @return \WP_User[] List of admin users.
	 */
	private function query_admins( $excluded_user_ids ) {
		$meta_key = $this->user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN );

		$query = new WP_User_Query(
			array(
				'role'        => 'administrator',
				'number'      => self::QUERY_LIMIT,
				'count_total' => false,
				'exclude'     => $excluded_user_ids, // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_exclude -- excluding the requesting user from eligibility results.
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Limit to Site Kit authenticated administrators.
				'meta_query'  => array(
					array(
						'key'     => $meta_key,
						'compare' => 'EXISTS',
					),
				),
			)
		);

		return $query->get_results();
	}

	/**
	 * Queries users with shared roles.
	 *
	 * @since 1.170.0
	 *
	 * @param int[] $excluded_user_ids User IDs to exclude.
	 * @return \WP_User[] List of users with shared roles.
	 */
	private function query_shared_roles( $excluded_user_ids ) {
		$shared_roles = $this->modules->get_module_sharing_settings()->get_all_shared_roles();

		if ( empty( $shared_roles ) ) {
			return array();
		}

		$query = new WP_User_Query(
			array(
				'role__in'    => array_values( array_unique( $shared_roles ) ),
				'number'      => self::QUERY_LIMIT,
				'count_total' => false,
				'exclude'     => $excluded_user_ids, // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_exclude -- excluding the requesting user from eligibility results.
			)
		);

		return $query->get_results();
	}
}
