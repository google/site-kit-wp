<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Subscribed_Users_QueryTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Email_Reporting\Subscribed_Users_Query;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

class Subscribed_Users_QueryTest extends TestCase {

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

	public function set_up() {
		parent::set_up();

		$this->context       = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->modules       = new Modules( $this->context );
		$this->user_settings = new User_Email_Reporting_Settings( new User_Options( $this->context ) );
		$this->query         = new Subscribed_Users_Query( $this->user_settings, $this->modules );

		$this->original_sharing_option = get_option( Module_Sharing_Settings::OPTION );
	}

	public function tear_down() {
		$meta_key = $this->user_settings->get_meta_key();

		foreach ( $this->created_user_ids as $user_id ) {
			delete_user_meta( $user_id, $meta_key );
		}

		if ( false === $this->original_sharing_option ) {
			delete_option( Module_Sharing_Settings::OPTION );
		} else {
			update_option( Module_Sharing_Settings::OPTION, $this->original_sharing_option );
		}

		parent::tear_down();
	}

	public function test_for_frequency_returns_matching_users() {
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

		$results = $this->query->for_frequency( 'weekly' );

		$this->assertEqualSets( array( $admin_weekly, $editor_weekly ), $results );
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

		$results = $this->query->for_frequency( 'weekly' );

		$this->assertSame( array( $user_id ), $results, 'User ID should appear only once even if multiple roles match.' );
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
}
