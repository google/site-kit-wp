<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Eligible_Subscribers_QueryTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Eligible_Subscribers_Query;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;

class Eligible_Subscribers_QueryTest extends TestCase {

	/**
	 * @var Context
	 */
	private $context;

	/**
	 * @var Modules
	 */
	private $modules;

	/**
	 * @var Eligible_Subscribers_Query
	 */
	private $query;

	/**
	 * @var User_Options
	 */
	private $user_options;

	private $created_user_ids = array();

	private $original_sharing_option;

	public function set_up() {
		parent::set_up();

		$this->context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->modules      = new Modules( $this->context );
		$this->user_options = new User_Options( $this->context );
		$this->query        = new Eligible_Subscribers_Query( $this->modules, $this->user_options );

		$this->original_sharing_option = get_option( Module_Sharing_Settings::OPTION );
	}

	public function tear_down() {
		foreach ( $this->created_user_ids as $user_id ) {
			( new User_Options( $this->context, $user_id ) )->delete( OAuth_Client::OPTION_ACCESS_TOKEN );
		}

		if ( false === $this->original_sharing_option ) {
			delete_option( Module_Sharing_Settings::OPTION );
		} else {
			update_option( Module_Sharing_Settings::OPTION, $this->original_sharing_option );
		}

		parent::tear_down();
	}

	public function test_get_eligible_users_excludes_current_user() {
		$current_admin = $this->create_admin_with_token();
		$other_admin   = $this->create_admin_with_token();

		wp_set_current_user( $current_admin );

		$results = $this->query->get_eligible_users( $current_admin );

		$this->assertEqualSets( array( $other_admin ), wp_list_pluck( $results, 'ID' ) );
	}

	public function test_get_eligible_users_includes_shared_roles() {
		$current_admin = $this->create_admin_with_token();
		$other_admin   = $this->create_admin_with_token();
		$editor        = self::factory()->user->create( array( 'role' => 'editor' ) );

		wp_set_current_user( $current_admin );

		$this->modules->get_module_sharing_settings()->set(
			array(
				'analytics-4' => array(
					'sharedRoles' => array( 'editor' ),
				),
			)
		);

		$results = $this->query->get_eligible_users( $current_admin );

		$this->assertEqualSets( array( $other_admin, $editor ), wp_list_pluck( $results, 'ID' ) );
	}

	public function test_get_eligible_users_excludes_pagespeed_insights_only_users() {
		$current_admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$editor        = self::factory()->user->create( array( 'role' => 'editor' ) );
		$contributor   = self::factory()->user->create( array( 'role' => 'contributor' ) );

		$this->set_user_access_token( $current_admin );
		wp_set_current_user( $current_admin );

		$this->modules->get_module_sharing_settings()->set(
			array(
				'analytics-4'        => array(
					'sharedRoles' => array( 'editor' ),
				),
				'pagespeed-insights' => array(
					'sharedRoles' => array( 'contributor' ),
				),
			)
		);

		$results    = $this->query->get_eligible_users( $current_admin );
		$result_ids = wp_list_pluck( $results, 'ID' );

		$this->assertContains( $editor, $result_ids, 'Editor with analytics-4 access should be eligible.' );
		$this->assertNotContains( $contributor, $result_ids, 'Contributor with only pagespeed-insights access should NOT be eligible.' );
	}

	public function test_get_eligible_users_includes_search_console_shared_roles() {
		$current_admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$author        = self::factory()->user->create( array( 'role' => 'author' ) );

		$this->set_user_access_token( $current_admin );
		wp_set_current_user( $current_admin );

		$this->modules->get_module_sharing_settings()->set(
			array(
				'search-console' => array(
					'sharedRoles' => array( 'author' ),
				),
			)
		);

		$results    = $this->query->get_eligible_users( $current_admin );
		$result_ids = wp_list_pluck( $results, 'ID' );

		$this->assertContains( $author, $result_ids, 'Author with search-console access should be eligible.' );
	}

	public function test_get_eligible_users_returns_empty_when_none() {
		$current_admin = $this->create_admin_with_token();
		wp_set_current_user( $current_admin );

		$results = $this->query->get_eligible_users( $current_admin );

		$this->assertSame( array(), $results, 'Expected no eligible users when only the current admin is present.' );
	}

	public function test_get_eligible_users_paginates_results() {
		$current_admin = $this->create_admin_with_token( 'admin-current' );
		$user_ids      = array();

		for ( $i = 1; $i <= 25; $i++ ) {
			$user_ids[] = $this->create_admin_with_token( sprintf( 'admin-%02d', $i ) );
		}

		wp_set_current_user( $current_admin );

		$page_1 = $this->query->get_eligible_users( $current_admin, array( 'page' => 1 ) );
		$page_2 = $this->query->get_eligible_users( $current_admin, array( 'page' => 2 ) );

		$this->assertCount( Eligible_Subscribers_Query::PER_PAGE, $page_1, 'First page should include the configured per-page count.' );
		$this->assertCount( 5, $page_2, 'Second page should include remaining users.' );
		$this->assertSame( array_slice( $user_ids, 0, Eligible_Subscribers_Query::PER_PAGE ), wp_list_pluck( $page_1, 'ID' ), 'First page should contain the first batch of eligible user IDs.' );
		$this->assertSame( array_slice( $user_ids, Eligible_Subscribers_Query::PER_PAGE ), wp_list_pluck( $page_2, 'ID' ), 'Second page should contain remaining eligible user IDs.' );
	}

	public function test_get_eligible_users_search_filters_by_display_name_and_email() {
		$current_admin = $this->create_admin_with_token( 'admin-current' );
		$name_match_id = $this->create_admin_with_token( 'admin-name-match', 'Display Name Match', 'name-match@example.com' );
		$mail_match_id = $this->create_admin_with_token( 'admin-mail-match', 'Not Matching Name', 'display-search@example.com' );
		$other_user_id = $this->create_admin_with_token( 'admin-other', 'Other User', 'other@example.com' );

		wp_set_current_user( $current_admin );

		$name_results = $this->query->get_eligible_users( $current_admin, array( 'search' => 'display name' ) );
		$mail_results = $this->query->get_eligible_users( $current_admin, array( 'search' => 'display-search' ) );

		$this->assertEqualSets( array( $name_match_id ), wp_list_pluck( $name_results, 'ID' ) );
		$this->assertEqualSets( array( $mail_match_id ), wp_list_pluck( $mail_results, 'ID' ) );
		$this->assertNotContains( $other_user_id, wp_list_pluck( $name_results, 'ID' ), 'Search results should exclude non-matching users.' );
	}

	public function test_get_eligible_users_count_returns_total_matching_users() {
		$current_admin = $this->create_admin_with_token( 'admin-current' );
		$this->create_admin_with_token( 'alpha-1', 'Alpha One', 'alpha-one@example.com' );
		$this->create_admin_with_token( 'alpha-2', 'Alpha Two', 'alpha-two@example.com' );
		$this->create_admin_with_token( 'beta-1', 'Beta One', 'beta-one@example.com' );

		wp_set_current_user( $current_admin );

		$this->assertSame( 3, $this->query->get_eligible_users_count( $current_admin ), 'Total count should include all matching eligible users by default.' );
		$this->assertSame( 2, $this->query->get_eligible_users_count( $current_admin, 'alpha' ), 'Filtered count should include only matching users.' );
		$this->assertSame( 0, $this->query->get_eligible_users_count( $current_admin, 'not-found' ), 'Filtered count should be zero when nothing matches.' );
	}

	public function test_get_eligible_users_combines_search_and_pagination() {
		$current_admin = $this->create_admin_with_token( 'admin-current' );
		$match_ids     = array();

		for ( $i = 1; $i <= 25; $i++ ) {
			$match_ids[] = $this->create_admin_with_token(
				sprintf( 'search-user-%02d', $i ),
				sprintf( 'Search User %02d', $i ),
				sprintf( 'search-user-%02d@example.com', $i )
			);
		}

		$this->create_admin_with_token( 'non-match-user', 'Other User', 'other@example.com' );

		wp_set_current_user( $current_admin );

		$page_2_results = $this->query->get_eligible_users(
			$current_admin,
			array(
				'page'   => 2,
				'search' => 'search user',
			)
		);

		$this->assertCount( 5, $page_2_results, 'Second search page should include remaining matching users.' );
		$this->assertSame( array_slice( $match_ids, Eligible_Subscribers_Query::PER_PAGE ), wp_list_pluck( $page_2_results, 'ID' ), 'Second search page should contain expected matching user IDs.' );
	}

	public function test_get_eligible_users_deduplicates_admin_and_shared_roles_before_pagination() {
		$current_admin = $this->create_admin_with_token( 'admin-current' );
		$shared_admin  = $this->create_admin_with_token( 'shared-admin', 'Shared Admin', 'shared-admin@example.com' );
		$shared_editor = self::factory()->user->create(
			array(
				'role'         => 'editor',
				'user_login'   => 'shared-editor',
				'display_name' => 'Shared Editor',
				'user_email'   => 'shared-editor@example.com',
			)
		);

		$user = get_user_by( 'id', $shared_admin );
		$user->add_role( 'editor' );

		$this->modules->get_module_sharing_settings()->set(
			array(
				'analytics-4' => array(
					'sharedRoles' => array( 'editor' ),
				),
			)
		);

		wp_set_current_user( $current_admin );

		$results = $this->query->get_eligible_users(
			$current_admin,
			array(
				'per_page' => 1,
			)
		);

		$this->assertCount( 1, $results, 'Pagination should be applied after deduplication.' );
		$this->assertSame(
			2,
			$this->query->get_eligible_users_count( $current_admin ),
			'Expected admin present in both queries to be counted once.'
		);
		$this->assertEqualSets(
			array( $shared_admin, $shared_editor ),
			wp_list_pluck( $this->query->get_eligible_users( $current_admin, array( 'per_page' => 20 ) ), 'ID' )
		);
	}

	public function test_get_eligible_users_excludes_subscribed_users() {
		$current_admin     = $this->create_admin_with_token( 'admin-current' );
		$subscribed_user   = $this->create_admin_with_token( 'admin-subscribed', 'Subscribed User', 'subscribed@example.com' );
		$unsubscribed_user = $this->create_admin_with_token( 'admin-unsubscribed', 'Unsubscribed User', 'unsubscribed@example.com' );

		( new User_Email_Reporting_Settings( new User_Options( $this->context, $subscribed_user ) ) )->merge(
			array(
				'subscribed' => true,
			)
		);

		wp_set_current_user( $current_admin );

		$results = $this->query->get_eligible_users( $current_admin );

		$this->assertEqualSets( array( $unsubscribed_user ), wp_list_pluck( $results, 'ID' ) );
	}

	private function create_admin_with_token( $login = null, $display_name = null, $email = null ) {
		$user_id = self::factory()->user->create(
			array_filter(
				array(
					'role'         => 'administrator',
					'user_login'   => $login,
					'display_name' => $display_name,
					'user_email'   => $email,
				)
			)
		);

		$this->set_user_access_token( $user_id );

		return $user_id;
	}

	private function set_user_access_token( $user_id ) {
		$this->created_user_ids[] = $user_id;
		( new User_Options( $this->context, $user_id ) )->set( OAuth_Client::OPTION_ACCESS_TOKEN, 'test-token' );
	}
}
