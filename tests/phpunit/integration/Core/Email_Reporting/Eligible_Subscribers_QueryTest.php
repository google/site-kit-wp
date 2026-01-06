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
		$current_admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$other_admin   = self::factory()->user->create( array( 'role' => 'administrator' ) );

		$this->set_user_access_token( $current_admin );
		$this->set_user_access_token( $other_admin );

		wp_set_current_user( $current_admin );

		$results = $this->query->get_eligible_users( $current_admin );

		$this->assertEqualSets( array( $other_admin ), wp_list_pluck( $results, 'ID' ) );
	}

	public function test_get_eligible_users_includes_shared_roles() {
		$current_admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$other_admin   = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$editor        = self::factory()->user->create( array( 'role' => 'editor' ) );

		$this->set_user_access_token( $current_admin );
		$this->set_user_access_token( $other_admin );

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

	public function test_get_eligible_users_returns_empty_when_none() {
		$current_admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->set_user_access_token( $current_admin );
		wp_set_current_user( $current_admin );

		$results = $this->query->get_eligible_users( $current_admin );

		$this->assertSame( array(), $results, 'Expected no eligible users when only the current admin is present.' );
	}

	private function set_user_access_token( $user_id ) {
		$this->created_user_ids[] = $user_id;
		( new User_Options( $this->context, $user_id ) )->set( OAuth_Client::OPTION_ACCESS_TOKEN, 'test-token' );
	}
}
