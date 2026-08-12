<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Subscribed_Users_Query
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;
use WP_User;
use WP_User_Query;

/**
 * Retrieves users subscribed to email reports for a given frequency.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Subscribed_Users_Query {

	use User_Role_Trait;

	/**
	 * Default number of subscribed users returned per page.
	 *
	 * @since 1.185.0
	 * @var int
	 */
	const PER_PAGE = 20;

	/**
	 * Maximum number of subscribed users that may be requested per page.
	 *
	 * @since 1.185.0
	 * @var int
	 */
	const MAX_PER_PAGE = 100;

	/**
	 * Role slug reported for network super admins, who hold no role on the site itself.
	 *
	 * @since 1.185.0
	 * @var string
	 */
	const ROLE_SUPER_ADMIN = 'super-admin';

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

		if ( is_multisite() ) {
			$user_ids = array_merge( $user_ids, $this->query_super_admins() );
		}

		$user_ids = array_unique( array_map( 'intval', $user_ids ) );

		return $this->filter_subscribed_user_ids( $user_ids, $frequency, $meta_key );
	}

	/**
	 * Gets the number of subscribed users across all frequencies.
	 *
	 * @since 1.166.0
	 * @since 1.185.0 Counts subscribed super admins who are not members of the current site.
	 *
	 * @return int
	 */
	public function get_subscriber_count() {
		$meta_key = $this->email_reporting_settings->get_meta_key();

		$query_args = array(
			'fields'   => 'ids',
			'meta_key' => $meta_key, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'compare'  => 'EXISTS',
		);

		if ( is_multisite() ) {
			// Subscribers are already narrowed down by the subscription meta, and super
			// admins are not necessarily members of the current site. Without an explicit
			// network-wide blog ID, WP_User_Query adds a site-membership capabilities
			// clause that would undercount subscribers who still receive reports.
			$query_args['blog_id'] = 0;
		}

		$user_query = new WP_User_Query( $query_args );

		$subscribers = 0;

		foreach ( $user_query->get_results() as $user_id ) {
			$settings = get_user_meta( $user_id, $meta_key, true );

			if ( User_Email_Reporting_Settings::is_subscribed( $settings ) ) {
				++$subscribers;
			}
		}

		return $subscribers;
	}

	/**
	 * Retrieves a paginated, searchable list of subscribed users.
	 *
	 * @since 1.185.0
	 *
	 * @param array $args {
	 *     Optional. Arguments to filter and paginate subscribed users.
	 *
	 *     @type int    $page     Current page number. Default 1.
	 *     @type int    $per_page Results per page. Default self::PER_PAGE.
	 *     @type string $search   Search term for display name, email or role. Default ''.
	 * }
	 * @return array {
	 *     Shaped subscribed users and the total number of matches.
	 *
	 *     @type array[] $users Shaped users, each with `id`, `displayName`, `email`, `role` and `roleDisplayName` keys.
	 *     @type int     $total Total number of matching subscribed users.
	 * }
	 */
	public function get_subscribed_users( array $args = array() ) {
		$page     = isset( $args['page'] ) ? max( 1, (int) $args['page'] ) : 1;
		$per_page = isset( $args['per_page'] ) ? max( 1, min( self::MAX_PER_PAGE, (int) $args['per_page'] ) ) : self::PER_PAGE;
		$search   = isset( $args['search'] ) ? sanitize_text_field( (string) $args['search'] ) : '';

		$users = $this->get_matching_subscribed_users( $search );

		// Paginate after merging/deduplicating admin, shared-role and super-admin results
		// (and subscription/access filtering) so page boundaries and totals are based on
		// the final subscribed-user set.
		$offset      = ( $page - 1 ) * $per_page;
		$paged_users = array_slice( $users, $offset, $per_page );

		return array(
			'users' => array_map( array( $this, 'map_user_to_listing' ), $paged_users ),
			'total' => count( $users ),
		);
	}

	/**
	 * Gets all subscribed users matching the given search term.
	 *
	 * @since 1.185.0
	 *
	 * @param string $search Search term for display name, email or role.
	 * @return WP_User[] Matching subscribed users, ordered by display name.
	 */
	private function get_matching_subscribed_users( $search ) {
		$meta_key = $this->email_reporting_settings->get_meta_key();

		$user_ids = array_merge(
			$this->query_admins( $meta_key ),
			$this->query_shared_roles( $meta_key )
		);

		if ( is_multisite() ) {
			$user_ids = array_merge( $user_ids, $this->query_super_admins() );
		}

		$user_ids = array_values( array_unique( array_map( 'intval', $user_ids ) ) );

		if ( empty( $user_ids ) ) {
			return array();
		}

		// get_users() primes the user meta cache for the returned users, so the
		// subscription meta below is read from cache rather than per-user queries.
		$user_args = array(
			'include' => $user_ids,
			// Order by ID as well so users sharing a display name keep a stable
			// position across paginated requests.
			'orderby' => array(
				'display_name' => 'ASC',
				'ID'           => 'ASC',
			),
		);

		if ( is_multisite() ) {
			// The candidate IDs above are already scoped, and super admins are not
			// necessarily members of the current site. Without an explicit network-wide
			// blog ID, WP_User_Query adds a site-membership capabilities clause that
			// would silently drop them from the listing while they keep receiving reports.
			$user_args['blog_id'] = 0;
		}

		$users = get_users( $user_args );

		return array_values(
			array_filter(
				$users,
				function ( WP_User $user ) use ( $meta_key, $search ) {
					if ( ! $this->user_has_email_reporting_access( $user->ID ) ) {
						return false;
					}

					$settings = get_user_meta( $user->ID, $meta_key, true );

					if ( ! User_Email_Reporting_Settings::is_subscribed( $settings ) ) {
						return false;
					}

					return $this->user_matches_search( $user, $search );
				}
			)
		);
	}

	/**
	 * Checks whether a user matches the given search term.
	 *
	 * @since 1.185.0
	 *
	 * @param WP_User $user   User object.
	 * @param string  $search Search term for display name, email or role.
	 * @return bool True if the user matches the search term, false otherwise.
	 */
	private function user_matches_search( WP_User $user, $search ) {
		$search = strtolower( trim( (string) $search ) );

		if ( '' === $search ) {
			return true;
		}

		$haystacks = array(
			(string) $user->display_name,
			(string) $user->user_email,
		);

		foreach ( (array) $user->roles as $role_slug ) {
			$haystacks[] = (string) $role_slug;
			$haystacks[] = $this->get_role_display_name( (string) $role_slug );
		}

		// Super admins are listed under their network role, so it has to be searchable too.
		$haystacks = array_unique( array_merge( $haystacks, $this->get_listed_role( $user ) ) );

		foreach ( $haystacks as $haystack ) {
			if ( '' !== $haystack && false !== strpos( strtolower( $haystack ), $search ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Maps a user to the subscribed users listing shape.
	 *
	 * @since 1.185.0
	 *
	 * @param WP_User $user User object.
	 * @return array Shaped user data.
	 */
	private function map_user_to_listing( WP_User $user ) {
		list( $role_slug, $role_display_name ) = $this->get_listed_role( $user );

		return array(
			'id'              => (int) $user->ID,
			'displayName'     => $user->display_name,
			'email'           => $user->user_email,
			'role'            => $role_slug,
			'roleDisplayName' => $role_display_name,
		);
	}

	/**
	 * Gets the role slug and display name a subscribed user is listed under.
	 *
	 * @since 1.185.0
	 *
	 * @param WP_User $user User object.
	 * @return array List containing the role slug and its display name.
	 */
	private function get_listed_role( WP_User $user ) {
		$role_slug = $this->get_primary_role( $user );

		// Super admins can be subscribed to a site's reports without holding a role on
		// that site, so list them under their network role rather than leaving it blank.
		// The label matches the one WordPress shows next to such users in Users lists.
		if ( '' === $role_slug && is_multisite() && is_super_admin( $user->ID ) ) {
			return array( self::ROLE_SUPER_ADMIN, __( 'Super Admin', 'google-site-kit' ) );
		}

		return array( $role_slug, $this->get_role_display_name( $role_slug ) );
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
	 * Queries super admins for multisite networks.
	 *
	 * @since 1.172.0
	 *
	 * @return int[] User IDs.
	 */
	private function query_super_admins() {
		if ( ! function_exists( 'get_super_admins' ) ) {
			return array();
		}

		$user_ids = array();

		foreach ( get_super_admins() as $user_login ) {
			$user = get_user_by( 'login', $user_login );

			if ( $user instanceof \WP_User ) {
				$user_ids[] = (int) $user->ID;
			}
		}

		return $user_ids;
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
			if ( ! $this->user_has_email_reporting_access( $user_id ) ) {
				continue;
			}

			$settings = get_user_meta( $user_id, $meta_key, true );

			if ( ! User_Email_Reporting_Settings::is_subscribed( $settings ) ) {
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
	 * Checks whether a user can access Site Kit dashboard for email reporting.
	 *
	 * @since 1.173.0
	 *
	 * @param int $user_id User ID.
	 * @return bool True if user has email reporting access, false otherwise.
	 */
	private function user_has_email_reporting_access( $user_id ) {
		return user_can( $user_id, Permissions::VIEW_DASHBOARD );
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
