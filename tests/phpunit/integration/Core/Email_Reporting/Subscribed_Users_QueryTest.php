<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Subscribed_Users_QueryTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Verification;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Email_Reporting\Subscribed_Users_Query;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\UserAuthenticationTrait;

class Subscribed_Users_QueryTest extends TestCase {
	use Fake_Site_Connection_Trait;
	use UserAuthenticationTrait;

	/**
	 * @var Context
	 */
	private $context;

	/**
	 * @var Modules
	 */
	private $modules;

	/**
	 * @var User_Email_Reporting_Settings
	 */
	private $user_settings;

	/**
	 * @var Subscribed_Users_Query
	 */
	private $query;

	private $original_sharing_option;

	private $created_user_ids = array();
	private $super_admin_ids  = array();

	public function set_up() {
		parent::set_up();

		$this->context       = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->modules       = new Modules( $this->context );
		$this->user_settings = new User_Email_Reporting_Settings( new User_Options( $this->context ) );
		$this->query         = new Subscribed_Users_Query( $this->user_settings, $this->modules );

		$this->original_sharing_option = get_option( Module_Sharing_Settings::OPTION );

		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );
		$this->fake_proxy_site_connection();
	}

	public function tear_down() {
		$meta_key = $this->user_settings->get_meta_key();

		foreach ( array_unique( $this->created_user_ids ) as $user_id ) {
			delete_user_meta( $user_id, $meta_key );

			$user_options = new User_Options( $this->context, $user_id );
			$user_options->delete( OAuth_Client::OPTION_ACCESS_TOKEN );
			$user_options->delete( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED );
			$user_options->delete( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN );
			$user_options->delete( Verification::OPTION );
		}

		foreach ( $this->super_admin_ids as $user_id ) {
			if ( function_exists( 'revoke_super_admin' ) ) {
				revoke_super_admin( $user_id );
			}
		}

		if ( false === $this->original_sharing_option ) {
			delete_option( Module_Sharing_Settings::OPTION );
		} else {
			update_option( Module_Sharing_Settings::OPTION, $this->original_sharing_option );
		}

		remove_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		parent::tear_down();
	}

	public function test_for_frequency__returns_matching_users() {
		$admin_weekly   = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$admin_monthly  = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$editor_weekly  = self::factory()->user->create( array( 'role' => 'editor' ) );
		$editor_monthly = self::factory()->user->create( array( 'role' => 'editor' ) );

		$this->set_user_subscription( $admin_weekly, true, 'weekly' );
		$this->set_user_subscription( $editor_weekly, true, 'weekly' );
		$this->set_user_subscription( $admin_monthly, true, 'monthly' );
		$this->set_user_subscription( $editor_monthly, true, 'monthly' );

		$this->modules->get_module_sharing_settings()->set(
			array(
				'analytics-4' => array(
					'sharedRoles' => array( 'editor' ),
				),
			)
		);

		$this->authenticate_user_for_site_kit( $admin_weekly );
		$this->authenticate_user_for_site_kit( $admin_monthly );
		$this->grant_user_view_only_site_kit_access( $editor_weekly );
		$this->grant_user_view_only_site_kit_access( $editor_monthly );

		$results = $this->query->for_frequency( 'weekly' );

		$this->assertEqualSets(
			array( $admin_weekly, $editor_weekly ),
			$results,
			'Weekly subscribers should include admins and shared users.'
		);
	}

	public function test_for_frequency__excludes_subscribed_admin_without_site_kit_access() {
		$admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_user_subscription( $admin, true, 'weekly' );

		$results = $this->query->for_frequency( 'weekly' );

		$this->assertSame( array(), $results, 'Subscribed admin without Site Kit access should be excluded.' );
	}

	public function test_for_frequency__includes_subscribed_authenticated_admin() {
		$admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_user_subscription( $admin, true, 'weekly' );
		$this->authenticate_user_for_site_kit( $admin );

		$results = $this->query->for_frequency( 'weekly' );

		$this->assertSame( array( $admin ), $results, 'Subscribed authenticated admin should be included.' );
	}

	public function test_for_frequency__includes_subscribed_view_only_user() {
		$editor = self::factory()->user->create( array( 'role' => 'editor' ) );
		$this->set_user_subscription( $editor, true, 'weekly' );

		$this->modules->get_module_sharing_settings()->set(
			array(
				'analytics-4' => array(
					'sharedRoles' => array( 'editor' ),
				),
			)
		);
		$this->grant_user_view_only_site_kit_access( $editor );

		$results = $this->query->for_frequency( 'weekly' );

		$this->assertSame( array( $editor ), $results, 'Subscribed view-only user should be included.' );
	}

	public function test_for_frequency_deduplicates_user_ids() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		$user = get_user_by( 'id', $user_id );
		$user->add_role( 'editor' );

		$this->modules->get_module_sharing_settings()->set(
			array(
				'analytics-4' => array(
					'sharedRoles' => array( 'editor' ),
				),
			)
		);

		$this->set_user_subscription( $user_id, true, 'weekly' );
		$this->authenticate_user_for_site_kit( $user_id );

		$results = $this->query->for_frequency( 'weekly' );

		$this->assertSame( array( $user_id ), $results, 'User ID should appear only once even if multiple roles match.' );
	}

	public function test_for_frequency_includes_super_admins() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		if ( ! function_exists( 'grant_super_admin' ) ) {
			$this->markTestSkipped( 'Super admin helpers unavailable.' );
		}

		$user_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		grant_super_admin( $user_id );

		$this->super_admin_ids[] = $user_id;

		$this->set_user_subscription( $user_id, true, 'weekly' );
		$this->authenticate_user_for_site_kit( $user_id );

		$results = $this->query->for_frequency( 'weekly' );

		$this->assertContains( $user_id, $results, 'Super admins should be included when subscribed.' );
	}

	public function test_get_subscribed_users__returns_shaped_users_and_total() {
		$subscriber = $this->create_subscribed_admin( 'Alpha Subscriber', 'alpha-subscriber@example.com' );

		// An authenticated admin who never subscribed must not be listed.
		$unsubscribed = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->authenticate_user_for_site_kit( $unsubscribed );

		$results = $this->query->get_subscribed_users();

		$this->assertSame( 1, $results['total'], 'Only subscribed users should be counted in total.' );
		$this->assertSame(
			array(
				array(
					'id'              => $subscriber,
					'displayName'     => 'Alpha Subscriber',
					'email'           => 'alpha-subscriber@example.com',
					'role'            => 'administrator',
					'roleDisplayName' => 'Administrator',
				),
			),
			$results['users'],
			'Subscribed users should be returned with the expected shape.'
		);
	}

	public function test_get_subscribed_users__excludes_given_user() {
		$current_admin = $this->create_subscribed_admin( 'Current Admin', 'current-admin@example.com' );
		$other_admin   = $this->create_subscribed_admin( 'Other Admin', 'other-admin@example.com' );

		$results = $this->query->get_subscribed_users( array(), $current_admin );

		$this->assertSame( 1, $results['total'], 'Total should not count the excluded user.' );
		$this->assertSame(
			array( $other_admin ),
			wp_list_pluck( $results['users'], 'id' ),
			'Subscribed users should exclude the given user ID.'
		);
	}

	public function test_get_subscribed_users__honors_pagination() {
		$user_ids = array();

		for ( $i = 1; $i <= 5; $i++ ) {
			$user_ids[] = $this->create_subscribed_admin(
				sprintf( 'Subscriber %02d', $i ),
				sprintf( 'subscriber-%02d@example.com', $i )
			);
		}

		$first_page = $this->query->get_subscribed_users(
			array(
				'page'     => 1,
				'per_page' => 2,
			)
		);

		$this->assertSame( 5, $first_page['total'], 'Total should include every subscribed user.' );
		$this->assertSame(
			array_slice( $user_ids, 0, 2 ),
			wp_list_pluck( $first_page['users'], 'id' ),
			'First page should include the expected user IDs ordered by display name.'
		);

		$last_page = $this->query->get_subscribed_users(
			array(
				'page'     => 3,
				'per_page' => 2,
			)
		);

		$this->assertSame( 5, $last_page['total'], 'Total should remain unchanged across pages.' );
		$this->assertSame(
			array_slice( $user_ids, 4 ),
			wp_list_pluck( $last_page['users'], 'id' ),
			'Last page should include only the remaining user.'
		);

		$out_of_range_page = $this->query->get_subscribed_users(
			array(
				'page'     => 4,
				'per_page' => 2,
			)
		);

		$this->assertSame( array(), $out_of_range_page['users'], 'Page beyond the last one should return no users.' );
		$this->assertSame( 5, $out_of_range_page['total'], 'Total should remain unchanged for out-of-range pages.' );
	}

	public function test_get_subscribed_users__honors_search() {
		$alpha_name  = $this->create_subscribed_admin( 'Alpha Name', 'alpha@example.com' );
		$alpha_email = $this->create_subscribed_admin( 'No Match Name', 'alpha-mail@example.com' );
		$this->create_subscribed_admin( 'Beta Name', 'beta@example.com' );

		$results = $this->query->get_subscribed_users( array( 'search' => 'alpha' ) );

		$this->assertSame( 2, $results['total'], 'Search should only count matching users.' );
		$this->assertEqualSets(
			array( $alpha_name, $alpha_email ),
			wp_list_pluck( $results['users'], 'id' ),
			'Search should match display names and emails.'
		);

		$no_results = $this->query->get_subscribed_users( array( 'search' => 'this-will-not-match' ) );

		$this->assertSame( array(), $no_results['users'], 'Non-matching search should return no users.' );
		$this->assertSame( 0, $no_results['total'], 'Non-matching search should return total of zero.' );
	}

	public function test_get_subscribed_users__search_matches_role() {
		$editor = self::factory()->user->create(
			array(
				'role'         => 'editor',
				'display_name' => 'Editor Subscriber',
				'user_email'   => 'editor-subscriber@example.com',
			)
		);

		$this->modules->get_module_sharing_settings()->set(
			array(
				'analytics-4' => array(
					'sharedRoles' => array( 'editor' ),
				),
			)
		);

		$this->set_user_subscription( $editor, true, 'weekly' );
		$this->grant_user_view_only_site_kit_access( $editor );

		$this->create_subscribed_admin( 'Admin Subscriber', 'admin-subscriber@example.com' );

		$results = $this->query->get_subscribed_users( array( 'search' => 'Editor' ) );

		$this->assertSame( 1, $results['total'], 'Role search should only count users with a matching role.' );
		$this->assertSame(
			array( $editor ),
			wp_list_pluck( $results['users'], 'id' ),
			'Role search should match the role slug and display name.'
		);
	}

	public function test_get_subscribed_users__includes_super_admins_who_are_not_site_members() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		if ( ! function_exists( 'grant_super_admin' ) ) {
			$this->markTestSkipped( 'Super admin helpers unavailable.' );
		}

		$user_id = self::factory()->user->create(
			array(
				'role'         => 'subscriber',
				'display_name' => 'Network Super Admin',
				'user_email'   => 'network-super-admin@example.com',
			)
		);

		grant_super_admin( $user_id );
		$this->super_admin_ids[] = $user_id;

		$this->set_user_subscription( $user_id, true, 'weekly' );
		$this->authenticate_user_for_site_kit( $user_id );

		// Super admins are not necessarily members of every site in the network.
		remove_user_from_blog( $user_id, get_current_blog_id() );

		$results = $this->query->get_subscribed_users();

		$this->assertSame(
			array( $user_id ),
			wp_list_pluck( $results['users'], 'id' ),
			'Subscribed super admins should be listed even when they are not members of the current site.'
		);
		$this->assertSame( 1, $results['total'], 'Total should count subscribed super admins who are not site members.' );
		$this->assertContains(
			$user_id,
			$this->query->for_frequency( 'weekly' ),
			'The listing must not omit users that the send path still delivers reports to.'
		);

		$this->assertSame(
			Subscribed_Users_Query::ROLE_SUPER_ADMIN,
			$results['users'][0]['role'],
			'Super admins without a site role should be listed under the network role slug.'
		);
		$this->assertSame(
			'Super Admin',
			$results['users'][0]['roleDisplayName'],
			'Super admins without a site role should get a readable network role name.'
		);
	}

	public function test_get_subscribed_users__search_matches_super_admin_network_role() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		if ( ! function_exists( 'grant_super_admin' ) ) {
			$this->markTestSkipped( 'Super admin helpers unavailable.' );
		}

		$user_id = self::factory()->user->create(
			array(
				'role'         => 'subscriber',
				'display_name' => 'Network Super Admin',
				'user_email'   => 'network-super-admin@example.com',
			)
		);

		grant_super_admin( $user_id );
		$this->super_admin_ids[] = $user_id;

		$this->set_user_subscription( $user_id, true, 'weekly' );
		$this->authenticate_user_for_site_kit( $user_id );
		remove_user_from_blog( $user_id, get_current_blog_id() );

		$this->create_subscribed_admin( 'Regular Admin', 'regular-admin@example.com' );

		$results = $this->query->get_subscribed_users( array( 'search' => 'super admin' ) );

		$this->assertSame(
			array( $user_id ),
			wp_list_pluck( $results['users'], 'id' ),
			'Searching the network role name should find super admins listed under it.'
		);
	}

	public function test_get_subscribed_users__keeps_site_role_for_super_admins_who_are_site_members() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		if ( ! function_exists( 'grant_super_admin' ) ) {
			$this->markTestSkipped( 'Super admin helpers unavailable.' );
		}

		$user_id = $this->create_subscribed_admin( 'Member Super Admin', 'member-super-admin@example.com' );

		grant_super_admin( $user_id );
		$this->super_admin_ids[] = $user_id;

		$results = $this->query->get_subscribed_users();

		$this->assertSame(
			'administrator',
			$results['users'][0]['role'],
			'Super admins who hold a role on the site should keep that role, not the network one.'
		);
	}

	public function test_get_subscriber_count__counts_super_admins_who_are_not_site_members() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		if ( ! function_exists( 'grant_super_admin' ) ) {
			$this->markTestSkipped( 'Super admin helpers unavailable.' );
		}

		$user_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );

		grant_super_admin( $user_id );
		$this->super_admin_ids[] = $user_id;

		$this->set_user_subscription( $user_id, true, 'weekly' );
		$this->authenticate_user_for_site_kit( $user_id );

		// Super admins are not necessarily members of every site in the network.
		remove_user_from_blog( $user_id, get_current_blog_id() );

		$this->assertSame(
			1,
			$this->query->get_subscriber_count(),
			'Subscriber count should include super admins who are not members of the current site.'
		);
	}

	private function create_subscribed_admin( $display_name, $email ) {
		$user_id = self::factory()->user->create(
			array(
				'role'         => 'administrator',
				'display_name' => $display_name,
				'user_email'   => $email,
			)
		);

		$this->set_user_subscription( $user_id, true, 'weekly' );
		$this->authenticate_user_for_site_kit( $user_id );

		return $user_id;
	}

	private function set_user_subscription( $user_id, $subscribed, $frequency ) {
		$user_options = new User_Options( $this->context, $user_id );
		$settings     = new User_Email_Reporting_Settings( $user_options );

		$settings->merge(
			array(
				'subscribed' => $subscribed,
				'frequency'  => $frequency,
			)
		);

		$this->created_user_ids[] = $user_id;
	}

	private function authenticate_user_for_site_kit( $user_id ) {
		$this->set_user_access_token( $user_id, 'test-access-token-' . $user_id );
		( new User_Options( $this->context, $user_id ) )->set( Verification::OPTION, 'verified' );
	}

	private function grant_user_view_only_site_kit_access( $user_id ) {
		$dismissed_items = new Dismissed_Items( new User_Options( $this->context, $user_id ) );
		$dismissed_items->add( 'shared_dashboard_splash', 0 );
	}
}
