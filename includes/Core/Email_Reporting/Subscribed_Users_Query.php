<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Subscribed_Users_Query
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;
use WP_User_Query;

/**
 * Retrieves users subscribed to email reports for a given frequency.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Subscribed_Users_Query {

	/**
	 * User email reporting settings.
	 *
	 * @var User_Email_Reporting_Settings
	 */
	private $email_reporting_settings;

	/**
	 * Modules manager instance.
	 *
	 * @var Modules
	 */
	private $modules;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
	 *
	 * @param User_Email_Reporting_Settings $email_reporting_settings User settings instance.
	 * @param Modules                       $modules Modules instance.
	 */
	public function __construct( User_Email_Reporting_Settings $email_reporting_settings, Modules $modules ) {
		$this->email_reporting_settings = $email_reporting_settings;
		$this->modules                  = $modules;
	}

	/**
	 * Retrieves user IDs subscribed for a given frequency.
	 *
	 * @since 1.167.0
	 *
	 * @param string $frequency Frequency slug.
	 * @return int[] List of user IDs.
	 */
	public function for_frequency( $frequency ) {
		$meta_key = $this->email_reporting_settings->get_meta_key();

		$user_ids = array_merge(
			$this->query_admins( $meta_key ),
			$this->query_shared_roles( $meta_key )
		);

		$user_ids = array_unique( array_map( 'intval', $user_ids ) );

		return $this->filter_subscribed_user_ids( $user_ids, $frequency, $meta_key );
	}

	/**
	 * Queries administrators with the email reporting meta set.
	 *
	 * @since 1.167.0
	 *
	 * @param string $meta_key User meta key.
	 * @return int[] User IDs.
	 */
	private function query_admins( $meta_key ) {
		$query = new WP_User_Query(
			array(
				'role'       => 'administrator',
				'fields'     => 'ID',
				'meta_query' => array( $this->get_meta_clause( $meta_key ) ), // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
			)
		);

		return $query->get_results();
	}

	/**
	 * Queries shared role users with the email reporting meta set.
	 *
	 * @since 1.167.0
	 *
	 * @param string $meta_key User meta key.
	 * @return int[] User IDs.
	 */
	private function query_shared_roles( $meta_key ) {
		$shared_roles = $this->modules->get_module_sharing_settings()->get_all_shared_roles();

		if ( empty( $shared_roles ) ) {
			return array();
		}

		$query = new WP_User_Query(
			array(
				'role__in'   => array_values( array_unique( $shared_roles ) ),
				'fields'     => 'ID',
				'meta_query' => array( $this->get_meta_clause( $meta_key ) ), // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
			)
		);

		return $query->get_results();
	}

	/**
	 * Filters user IDs by subscription meta values.
	 *
	 * @since 1.167.0
	 *
	 * @param int[]  $user_ids  Candidate user IDs.
	 * @param string $frequency Target frequency.
	 * @param string $meta_key  User meta key.
	 * @return int[] Filtered user IDs.
	 */
	private function filter_subscribed_user_ids( $user_ids, $frequency, $meta_key ) {
		$filtered = array();

		foreach ( $user_ids as $user_id ) {
			$settings = get_user_meta( $user_id, $meta_key, true );

			if ( ! is_array( $settings ) || empty( $settings['subscribed'] ) ) {
				continue;
			}

			$user_frequency = isset( $settings['frequency'] ) ? (string) $settings['frequency'] : User_Email_Reporting_Settings::FREQUENCY_WEEKLY;

			if ( $user_frequency !== $frequency ) {
				continue;
			}

			$filtered[] = (int) $user_id;
		}

		return array_values( $filtered );
	}

	/**
	 * Builds the meta query clause to ensure the subscription meta exists.
	 *
	 * @since 1.167.0
	 *
	 * @param string $meta_key Meta key.
	 * @return array Meta query clause.
	 */
	private function get_meta_clause( $meta_key ) {
		return array(
			'key'     => $meta_key,
			'compare' => 'EXISTS',
		);
	}
}
