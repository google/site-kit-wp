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
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;
use WP_User_Query;

/**
 * Retrieves users eligible for email reporting invitations.
 *
 * @since 1.170.0
 * @access private
 * @ignore
 */
class Eligible_Subscribers_Query {

	const PER_PAGE     = 20;
	const MAX_PER_PAGE = 100;

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
	 * Per-request in-memory cache for eligible user IDs.
	 *
	 * @since 1.175.0
	 * @var int[][]
	 */
	private $eligible_user_ids_cache = array();

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
	 * @param int   $exclude_user_id User ID to exclude.
	 * @param array $args            Optional args.
	 *                               {
	 *                                   Optional. Arguments to filter and paginate users.
	 *
	 *                                   @type int    $page     Current page number. Default 1.
	 *                                   @type int    $per_page Results per page. Default self::PER_PAGE.
	 *                                   @type string $search   Search term for display name or email. Default ''.
	 *                               }
	 * @return \WP_User[] List of eligible users.
	 */
	public function get_eligible_users( int $exclude_user_id, array $args = array() ): array {
		$page     = isset( $args['page'] ) ? max( 1, (int) $args['page'] ) : 1;
		$per_page = isset( $args['per_page'] ) ? max( 1, min( self::MAX_PER_PAGE, (int) $args['per_page'] ) ) : self::PER_PAGE;
		$search   = isset( $args['search'] ) ? sanitize_text_field( (string) $args['search'] ) : '';

		$eligible_user_ids = $this->get_eligible_user_ids( $exclude_user_id, $search );

		if ( empty( $eligible_user_ids ) ) {
			return array();
		}

		// Paginate after merging/deduplicating admin + shared-role results (and subscribed-user filtering)
		// so page boundaries and totals are based on the final eligible-user set.
		$offset         = ( $page - 1 ) * $per_page;
		$paged_user_ids = array_slice( $eligible_user_ids, $offset, $per_page );

		if ( empty( $paged_user_ids ) ) {
			return array();
		}

		return get_users(
			array(
				'include' => $paged_user_ids,
				'orderby' => 'include',
			)
		);
	}

	/**
	 * Gets the total number of eligible users matching the search term.
	 *
	 * @since 1.175.0
	 *
	 * @param int    $exclude_user_id User ID to exclude.
	 * @param string $search          Search term for display name or email.
	 * @return int Total count of matching eligible users.
	 */
	public function get_eligible_users_count( int $exclude_user_id, string $search = '' ): int {
		$search = sanitize_text_field( $search );

		return count( $this->get_eligible_user_ids( $exclude_user_id, $search ) );
	}

	/**
	 * Checks whether the user is eligible to receive an invitation.
	 *
	 * @since 1.175.0
	 *
	 * @param int $exclude_user_id User ID to exclude.
	 * @param int $user_id         User ID to check.
	 * @return bool True if the user is eligible, false otherwise.
	 */
	public function is_user_eligible( int $exclude_user_id, int $user_id ): bool {
		$eligible_user_ids = $this->get_eligible_user_ids( $exclude_user_id );

		return in_array( $user_id, $eligible_user_ids, true );
	}

	/**
	 * Gets deduplicated eligible user IDs filtered by subscription status.
	 *
	 * @since 1.175.0
	 *
	 * @param int    $exclude_user_id User ID to exclude.
	 * @param string $search          Search term for display name or email.
	 * @return int[] Eligible user IDs.
	 */
	private function get_eligible_user_ids( int $exclude_user_id, string $search = '' ): array {
		$search = sanitize_text_field( $search );

		if ( ! $exclude_user_id ) {
			$exclude_user_id = (int) get_current_user_id();
		}

		// Reuse computed IDs for repeated lookups (users + count) in the same request.
		$cache_key = $exclude_user_id . '|' . $search;
		if ( isset( $this->eligible_user_ids_cache[ $cache_key ] ) ) {
			return $this->eligible_user_ids_cache[ $cache_key ];
		}

		$excluded_user_ids = $exclude_user_id ? array( $exclude_user_id ) : array();
		$eligible_user_ids = array();

		foreach ( $this->query_admins( $excluded_user_ids, $search ) as $user_id ) {
			$eligible_user_ids[ (int) $user_id ] = (int) $user_id;
		}

		foreach ( $this->query_shared_roles( $excluded_user_ids, $search ) as $user_id ) {
			$eligible_user_ids[ (int) $user_id ] = (int) $user_id;
		}

		$this->eligible_user_ids_cache[ $cache_key ] = $this->filter_subscribed_user_ids( array_values( $eligible_user_ids ) );

		return $this->eligible_user_ids_cache[ $cache_key ];
	}

	/**
	 * Filters out users already subscribed to email reporting.
	 *
	 * @since 1.175.0
	 *
	 * @param int[] $user_ids User IDs.
	 * @return int[] Unsubscribed user IDs.
	 */
	private function filter_subscribed_user_ids( array $user_ids ): array {
		$settings_meta_key = $this->user_options->get_meta_key( User_Email_Reporting_Settings::OPTION );
		$user_ids          = array_map( 'intval', $user_ids );

		if ( empty( $user_ids ) ) {
			return array();
		}

		update_meta_cache( 'user', $user_ids );

		return array_values(
			array_filter(
				$user_ids,
				function ( int $user_id ) use ( $settings_meta_key ) {
					$settings = get_user_meta( $user_id, $settings_meta_key, true );

					return ! ( is_array( $settings ) && ! empty( $settings['subscribed'] ) );
				}
			)
		);
	}

	/**
	 * Queries Site Kit administrators.
	 *
	 * @since 1.170.0
	 *
	 * @param int[]  $excluded_user_ids User IDs to exclude.
	 * @param string $search            Search term for display name or email.
	 * @return int[] List of admin user IDs.
	 */
	private function query_admins( array $excluded_user_ids, string $search = '' ): array {
		$meta_key = $this->user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN );
		$args     = array(
			'role'        => 'administrator',
			'fields'      => 'ID',
			'count_total' => false,
			'exclude'     => $excluded_user_ids, // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_exclude -- excluding the requesting user from eligibility results.
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- Limit to Site Kit authenticated administrators.
			'meta_query'  => array(
				array(
					'key'     => $meta_key,
					'compare' => 'EXISTS',
				),
			),
		);

		if ( '' === $search ) {
			return $this->query_user_ids( $args );
		}

		$users_by_name_or_email_args = $this->with_name_or_email_search( $args, $search );
		$users_by_name_or_email      = $this->query_user_ids( $users_by_name_or_email_args );

		$users_by_role = array();
		$matched_roles = $this->get_matched_role_slugs( $search );

		if ( in_array( 'administrator', $matched_roles, true ) ) {
			$users_by_role = $this->query_user_ids( $args );
		}

		return array_values( array_unique( array_merge( $users_by_name_or_email, $users_by_role ) ) );
	}

	/**
	 * Queries users with shared roles.
	 *
	 * @since 1.170.0
	 *
	 * @param int[]  $excluded_user_ids User IDs to exclude.
	 * @param string $search            Search term for display name or email.
	 * @return int[] List of users with shared roles.
	 */
	private function query_shared_roles( array $excluded_user_ids, string $search = '' ): array {
		$sharing_settings = $this->modules->get_module_sharing_settings();

		$shared_roles = array_unique(
			array_merge(
				$sharing_settings->get_shared_roles( 'analytics-4' ),
				$sharing_settings->get_shared_roles( 'search-console' )
			)
		);

		if ( empty( $shared_roles ) ) {
			return array();
		}

		$args = array(
			'role__in'    => array_values( $shared_roles ),
			'fields'      => 'ID',
			'count_total' => false,
			'exclude'     => $excluded_user_ids, // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_exclude -- excluding the requesting user from eligibility results.
		);

		if ( '' === $search ) {
			return $this->query_user_ids( $args );
		}

		$users_by_name_or_email_args = $this->with_name_or_email_search( $args, $search );
		$users_by_name_or_email      = $this->query_user_ids( $users_by_name_or_email_args );

		$matched_role_slugs = $this->get_matched_role_slugs( $search );
		$matched_shared     = array_values( array_intersect( $shared_roles, $matched_role_slugs ) );
		$users_by_role      = array();

		if ( ! empty( $matched_shared ) ) {
			$users_by_role_args             = $args;
			$users_by_role_args['role__in'] = $matched_shared;
			$users_by_role                  = $this->query_user_ids( $users_by_role_args );
		}

		return array_values( array_unique( array_merge( $users_by_name_or_email, $users_by_role ) ) );
	}

	/**
	 * Adds name/email search parameters to user query args.
	 *
	 * @since 1.177.0
	 *
	 * @param array  $args   User query args.
	 * @param string $search Search term.
	 * @return array User query args with search params.
	 */
	private function with_name_or_email_search( array $args, string $search ): array {
		$args['search']         = '*' . $search . '*';
		$args['search_columns'] = array( 'display_name', 'user_email' );

		return $args;
	}

	/**
	 * Runs a user query and returns user IDs.
	 *
	 * @since 1.177.0
	 *
	 * @param array $args User query args.
	 * @return array User IDs.
	 */
	private function query_user_ids( array $args ): array {
		return ( new WP_User_Query( $args ) )->get_results();
	}

	/**
	 * Gets role slugs matching a search term.
	 *
	 * @since 1.177.0
	 *
	 * @param string $search Search term.
	 * @return string[] Matched role slugs.
	 */
	private function get_matched_role_slugs( string $search ): array {
		$search = strtolower( trim( sanitize_text_field( $search ) ) );

		if ( '' === $search ) {
			return array();
		}

		$wp_roles = wp_roles();

		if ( ! isset( $wp_roles->roles ) || ! is_array( $wp_roles->roles ) ) {
			return array();
		}

		$matched_roles = array();

		foreach ( $wp_roles->roles as $role_slug => $role_data ) {
			$normalized_slug = strtolower( $role_slug );
			$role_label      = isset( $role_data['name'] ) ? strtolower( sanitize_text_field( $role_data['name'] ) ) : '';

			if ( false !== strpos( $normalized_slug, $search ) || ( '' !== $role_label && false !== strpos( $role_label, $search ) ) ) {
				$matched_roles[] = $normalized_slug;
			}
		}

		return array_values( array_unique( $matched_roles ) );
	}
}
