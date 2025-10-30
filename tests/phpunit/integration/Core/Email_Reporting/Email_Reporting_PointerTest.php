<?php
/**
 * Email_Reporting_PointerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Pointer;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Email_Reporting_Settings as User_Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;

/**
 * @group Util
 * @group Email_Reporting
 */
class Email_Reporting_PointerTest extends TestCase {
	use Fake_Site_Connection_Trait;

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Email_Reporting_Settings instance.
	 *
	 * @var User_Email_Reporting_Settings
	 */
	private $email_reporting_settings;

	/**
	 * Dismissed_Items instance.
	 *
	 * @var Dismissed_Items
	 */
	private $dismissed_items;

	public function set_up() {
		parent::set_up();

		remove_all_filters( 'googlesitekit_admin_pointers' );

		$this->context                  = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options                   = new User_Options( $this->context );
		$this->email_reporting_settings = new User_Email_Reporting_Settings( $user_options );

		$pointer = new Email_Reporting_Pointer( $this->context, $user_options, $this->email_reporting_settings );
		$pointer->register();
	}

	public function test_register() {
		$this->assertTrue( has_filter( 'googlesitekit_admin_pointers' ), 'Email Reporting pointer should register the googlesitekit_admin_pointers filter.' );

		$pointer = $this->get_registered_pointer();

		$this->assertInstanceOf( 'Google\Site_Kit\Core\Admin\Pointer', $pointer, 'Registered pointer should be an instance of Google\Site_Kit\Core\Admin\Pointer.' );
		$this->assertEquals( Email_Reporting_Pointer::SLUG, $pointer->get_slug(), 'Registered pointer slug should match Email_Reporting_Pointer::SLUG.' );
	}

	public function test_active_callback__wrong_hook_suffix() {
		$pointer = $this->get_registered_pointer();

		$this->assertIsCallable( array( $pointer, 'is_active' ), 'Pointer is_active should be a callable method.' );

		// Should return false because hook suffix is not index.php.
		$this->assertFalse( $pointer->is_active( 'settings.php' ), 'Pointer should be inactive for non-dashboard hook suffix (settings.php).' );
	}

	public function test_active_callback__admin_access_not_subscribed_overlay_not_dismissed() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$this->register_permissions_for_user( $user_id );

		$pointer = $this->get_registered_pointer();

		$this->assertTrue( $pointer->is_active( 'index.php' ), 'Pointer should be active for admin user on index.php when not subscribed and overlay not dismissed.' );
	}

	public function test_active_callback__view_only_access() {
		$user_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $user_id );
		$this->grant_editors_view_only_dashboard_access();
		$this->register_permissions_for_user( $user_id );

		// Ensure VIEW_DASHBOARD is granted via shared dashboard for non-admins.
		$this->dismissed_items->add( 'shared_dashboard_splash', 0 );

		$this->register_permissions_for_user( $user_id );

		$pointer = $this->get_registered_pointer();

		$this->assertTrue( $pointer->is_active( 'index.php' ), 'Pointer should be active for view-only user on index.php when access granted, not subscribed, and overlay not dismissed.' );
	}

	public function test_active_callback__pointer_dismissed() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$this->register_permissions_for_user( $user_id );

		update_user_meta( $user_id, 'dismissed_wp_pointers', Email_Reporting_Pointer::SLUG );

		$pointer = $this->get_registered_pointer();

		$this->assertFalse( $pointer->is_active( 'index.php' ), 'Pointer should be inactive when the pointer was previously dismissed by the user.' );
	}

	public function test_active_callback__subscribed_user_bails() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$this->register_permissions_for_user( $user_id );

		// Mark user as subscribed at user level.
		$user_options  = new User_Options( $this->context, $user_id );
		$user_settings = new User_Email_Reporting_Settings( $user_options );
		$user_settings->merge(
			array(
				'subscribed' => true,
			)
		);

		$pointer = $this->get_registered_pointer();

		$this->assertFalse( $pointer->is_active( 'index.php' ), 'Pointer should be inactive when user is already subscribed to email reporting.' );
	}

	public function test_active_callback__overlay_dismissed_bails() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$this->register_permissions_for_user( $user_id );

		// Dismiss the email reporting overlay notification for this user.
		$user_options          = new User_Options( $this->context, $user_id );
		$this->dismissed_items = new Dismissed_Items( $user_options );
		$this->dismissed_items->add( 'email-reporting-overlay-notification' );

		$pointer = $this->get_registered_pointer();

		$this->assertFalse( $pointer->is_active( 'index.php' ), 'Pointer should be inactive when the email reporting overlay notification has been dismissed.' );
	}

	private function get_registered_pointer() {
		$pointers = apply_filters( 'googlesitekit_admin_pointers', array() );
		return array_pop( $pointers );
	}

	private function register_permissions_for_user( $user_id ) {
		$user_options          = new User_Options( $this->context, $user_id );
		$authentication        = new Authentication( $this->context, null, $user_options );
		$modules               = new Modules( $this->context, null, $user_options, $authentication );
		$this->dismissed_items = new Dismissed_Items( $user_options );
		$permissions           = new Permissions( $this->context, $authentication, $modules, $user_options, $this->dismissed_items );

		$permissions->register();

		// Provide proxy credentials so Authentication::is_setup_completed() initial check passes.
		$this->fake_proxy_site_connection();
		// Mark setup as complete for capability checks.
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		// For administrators, additionally satisfy VIEW_DASHBOARD via the authenticated dashboard path.
		if ( user_can( 'administrator', $user_id ) ) {
			$authentication->verification()->set( true );
			$authentication->get_oauth_client()->set_token(
				array(
					'access_token' => 'valid-auth-token',
				)
			);
		}
	}

	private function grant_editors_view_only_dashboard_access() {
		$settings              = new Module_Sharing_Settings( new Options( $this->context ) );
		$test_sharing_settings = array(
			'analytics-4' => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'all_admins',
			),
		);
		$settings->set( $test_sharing_settings );
	}
}
