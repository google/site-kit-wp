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

		$this->assertEqualSets( array( $admin_weekly, $editor_weekly ), $results );
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
