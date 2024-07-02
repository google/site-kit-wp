<?php
/**
 * View_Only_PointerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Dashboard_Sharing
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Dashboard_Sharing;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dashboard_Sharing\View_Only_Pointer;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 * @group Pointer
 */
class View_Only_PointerTest extends TestCase {

	/**
	 * Context instance.
	 * @var Context
	 */
	private $context;

	/**
	 * Dismissed_Items instance.
	 * @var Dismissed_Items
	 */
	private $dismissed_items;

	public function set_up() {
		parent::set_up();

		remove_all_filters( 'map_meta_cap' );
		remove_all_filters( 'googlesitekit_user_data' );
		remove_all_filters( 'user_has_cap' );
		remove_all_filters( 'googlesitekit_admin_pointers' );

		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$pointer = new View_Only_Pointer();
		$pointer->register();
	}

	public function test_register() {
		$this->assertTrue( has_filter( 'googlesitekit_admin_pointers' ) );

		$view_only_pointer = $this->get_registered_pointer();

		$this->assertInstanceOf( 'Google\Site_Kit\Core\Admin\Pointer', $view_only_pointer );
		$this->assertEquals( View_Only_Pointer::SLUG, $view_only_pointer->get_slug() );
	}

	public function test_active_callback__wrong_hook_suffix() {
		$view_only_pointer = $this->get_registered_pointer();

		$this->assertIsCallable( array( $view_only_pointer, 'is_active' ) );

		// Should Return false because hook suffix is not index.php
		$this->assertFalse( $view_only_pointer->is_active( 'settings.php' ) );
	}

	public function test_active_callback__can_authenticate() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		$this->register_permissions_for_user( $user_id );

		$view_only_pointer = $this->get_registered_pointer();

		// Should Return false because current user can AUTHENTICATE.
		$this->assertFalse( $view_only_pointer->is_active( 'index.php' ) );
	}

	public function test_active_callback__can_not_view_splash() {
		$user_id = $this->create_editor_user();

		$this->register_permissions_for_user( $user_id );

		$view_only_pointer = $this->get_registered_pointer();

		// Should Return false because current user can not VIEW_SPLASH.
		$this->assertFalse( $view_only_pointer->is_active( 'index.php' ) );
	}

	public function test_active_callback__splash_not_dismissed() {
		$user_id = $this->create_editor_user();

		$this->grant_editors_view_only_dashboard_access();

		$this->register_permissions_for_user( $user_id );

		$view_only_pointer = $this->get_registered_pointer();

		// Should Return true.
		$this->assertTrue( $view_only_pointer->is_active( 'index.php' ) );
	}

	public function test_active_callback__splash_dismissed() {
		$user_id = $this->create_editor_user();

		$this->grant_editors_view_only_dashboard_access();

		$this->register_permissions_for_user( $user_id );

		$view_only_pointer = $this->get_registered_pointer();

		$this->dismissed_items->add( 'shared_dashboard_splash' );

		// Should Return false because current user can no longer VIEW_SPLASH due to splash dismissal.
		$this->assertFalse( $view_only_pointer->is_active( 'index.php' ) );
	}

	public function test_active_callback__pointer_dismissed() {
		$user_id = $this->create_editor_user();

		$this->grant_editors_view_only_dashboard_access();

		$this->register_permissions_for_user( $user_id );

		$view_only_pointer = $this->get_registered_pointer();

		update_user_meta( $user_id, 'dismissed_wp_pointers', View_Only_Pointer::SLUG );

		// Should Return false because the pointer has been dismissed.
		$this->assertFalse( $view_only_pointer->is_active( 'index.php' ) );
	}

	private function get_registered_pointer() {
		$pointers = apply_filters( 'googlesitekit_admin_pointers', array() );
		return array_pop( $pointers );
	}

	private function register_permissions_for_user( $user_id ) {
		wp_set_current_user( $user_id );

		$user_options          = new User_Options( $this->context, $user_id );
		$authentication        = new Authentication( $this->context, null, $user_options );
		$modules               = new Modules( $this->context, null, $user_options, $authentication );
		$this->dismissed_items = new Dismissed_Items( $user_options );
		$permissions           = new Permissions( $this->context, $authentication, $modules, $user_options, $this->dismissed_items );

		$permissions->register();
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

	private function create_editor_user() {
		return $this->factory()->user->create( array( 'role' => 'editor' ) );
	}
}
