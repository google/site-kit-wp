<?php
/**
 * Module_Sharing_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

class Module_Sharing_SettingsTest extends SettingsTestCase {

	/**
	 * Module Sharing Settings instance.
	 *
	 * @var Module_Sharing_Settings
	 */
	private $settings;

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	public function set_up() {
		parent::set_up();

		$this->context  = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $this->context );
		$this->settings = new Module_Sharing_Settings( $options );
		$this->settings->register();
	}

	protected function get_option_name() {
		return Module_Sharing_Settings::OPTION;
	}

	public function test_get_default() {
		$default_settings = get_option( $this->get_option_name() );
		$this->assertTrue( is_array( $default_settings ) );
		$this->assertEmpty(
			$default_settings
		);
	}

	public function test_get_sanitize_callback() {
		$this->assertEmpty( get_option( $this->get_option_name() ) );

		// Test sanitizing invalid sharedRoles.
		$test_sharing_settings = array(
			'analytics'          => array(
				'sharedRoles' => array( '', 'editor', array( 'edit' ) ),
				'management'  => 'owner',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => '',
				'management'  => 'all_admins',
			),
			'search-console'     => array(
				'sharedRoles' => null,
				'management'  => 'all_admins',
			),
		);
		$expected              = array(
			'analytics'          => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array(),
				'management'  => 'all_admins',
			),
			'search-console'     => array(
				'management' => 'all_admins',
			),
		);
		$this->settings->set( $test_sharing_settings );
		// Use get_option() instead of $settings->get() to test sanitization and set() in isolation.
		$this->assertEquals( $expected, get_option( $this->get_option_name() ) );
	}

	public function test_get() {
		$defaultSettings = $this->settings->get();
		$this->assertTrue( is_array( $defaultSettings ) );
		$this->assertEmpty( $defaultSettings );

		// Test invalid settings when we get settings.
		$test_sharing_settings = array(
			'analytics'          => array(
				'sharedRoles' => '',
				'management'  => '',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => null,
				'management'  => 'all_admins',
			),
			'adsense'            => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => null,
			),
			'search-console'     => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
		);
		$expected              = array(
			'analytics'          => array(
				'sharedRoles' => array(),
				'management'  => 'owner',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array(),
				'management'  => 'all_admins',
			),
			'adsense'            => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',
			),
			'search-console'     => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
		);
		$this->settings->set( $test_sharing_settings );
		$this->assertEquals( $expected, $this->settings->get() );
	}

	public function test_unset_module() {
		$test_sharing_settings = array(
			'analytics'          => array(
				'sharedRoles' => array(),
				'management'  => 'owner',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array(),
				'management'  => 'all_admins',
			),
			'adsense'            => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',
			),
			'search-console'     => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
		);
		$expected              = array(
			'analytics'      => array(
				'sharedRoles' => array(),
				'management'  => 'owner',
			),
			'adsense'        => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',
			),
			'search-console' => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
		);
		$this->settings->set( $test_sharing_settings );
		$this->assertEquals( $test_sharing_settings, $this->settings->get() );

		$this->settings->unset_module( 'pagespeed-insights' );

		$this->assertEquals( $expected, $this->settings->get() );
	}

	public function test_get_all_shared_roles() {
		$test_sharing_settings = array(
			'analytics'          => array(
				'sharedRoles' => array( 'contributor' ),
				'management'  => '',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => null,
				'management'  => 'all_admins',
			),
			'adsense'            => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => null,
			),
			'search-console'     => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
		);
		$this->settings->set( $test_sharing_settings );
		$this->assertEqualSets( array( 'contributor', 'editor', 'subscriber' ), $this->settings->get_all_shared_roles() );
	}

	public function test_get_shared_roles() {
		$this->assertEmpty( $this->settings->get_shared_roles( 'pagespeed-insights' ) );

		$test_sharing_settings = array(
			'analytics'          => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'owner',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array(),
				'management'  => 'all_admins',
			),
		);

		$this->settings->set( $test_sharing_settings );
		$this->assertEquals( array( 'editor', 'subscriber' ), $this->settings->get_shared_roles( 'analytics' ) );
		$this->assertEmpty( $this->settings->get_shared_roles( 'pagespeed-insights' ) );
	}

	public function test_merge__unauthenticated_user() {
		$this->enable_feature( 'dashboardSharing' );

		update_option(
			'googlesitekit_active_modules',
			array(
				'search-console',
				'analytics',
				'pagespeed-insights',
			)
		);

		$admin_1 = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_1->ID );

		$test_sharing_settings = array(
			'search-console'     => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
			'analytics'          => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'all_admins',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'all_admins',
			),
		);

		// Current unauthenticated admin_1 cannot update any settings.
		$this->assertFalse( $this->settings->merge( $test_sharing_settings ) );
	}

	public function test_merge__authenticated_user() {
		$this->enable_feature( 'dashboardSharing' );

		update_option(
			'googlesitekit_active_modules',
			array(
				'search-console',
				'analytics',
				'pagespeed-insights',
			)
		);

		$test_sharing_settings = array(
			'search-console'     => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
			'analytics'          => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'all_admins',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'all_admins',
			),
		);

		$admin_1 = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$admin_2 = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );

		wp_set_current_user( $admin_1->ID );

		$modules = new Modules( $this->context );
		// Adds filters which insert default dashboard_sharing settings for shared_ownership_modules.
		$modules->register();

		// Authenticate current user to partially grant capability to manage module sharing options.
		$authentication = new Authentication( $this->context );
		$authentication->get_oauth_client()->set_token(
			array(
				'access_token' => 'valid-auth-token',
			)
		);

		// Re-register Permissions after enabling the dashboardSharing feature to include dashboard sharing capabilities.
		$user_options = new User_Options( $this->context );
		$permissions  = new Permissions( $this->context, $authentication, $modules, $user_options, new Dismissed_Items( $user_options ) );
		$permissions->register();

		// Add owners for search-console and analytics to test capability required to update sharing settings.
		// Pagespeed-insights (shared ownership module) does not require an owner as its sharing settings
		// can always be managed by any authenticated admin.
		update_option( 'googlesitekit_search-console_settings', array( 'ownerID' => $admin_1->ID ) );
		update_option( 'googlesitekit_analytics_settings', array( 'ownerID' => $admin_2->ID ) );

		// In the absence of dashboard sharing settings in the DB to begin with, admin_1 can only update
		// search-console (as an owner) and pagespeed-insights (set to "all_admins" by default).
		$this->assertTrue( $this->settings->merge( $test_sharing_settings ) );
		$expected_sharing_settings = array(
			'search-console'     => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'all_admins',
			),
		);
		$this->assertEquals( $expected_sharing_settings, $this->settings->get() );

		wp_set_current_user( $admin_2->ID );

		$updated_sharing_settings = array(
			'search-console'     => array(
				'sharedRoles' => array( 'subscriber' ),
				'management'  => 'all_admins',
			),
			'analytics'          => array(
				'sharedRoles' => array( 'contributor', 'subscriber' ),
				'management'  => 'all_admins',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array(),
				'management'  => 'all_admins',
			),
		);
		// admin_2 should be able to change search-console (set to "all_admins"), analytics (not
		// already in DB but as an owner) and pagespeed-insights (as an authenticated admin).
		$this->assertTrue( $this->settings->merge( $updated_sharing_settings ) );
		$this->assertEquals( $updated_sharing_settings, $this->settings->get() );

		// Test updating partial settings changing search-console to owner only.
		$updated_sharing_settings = array(
			'search-console' => array(
				'sharedRoles' => array( 'contributor' ),
				'management'  => 'owner',
			),
		);
		$this->assertTrue( $this->settings->merge( $updated_sharing_settings ) );
		$this->assertEquals(
			array(
				'search-console'     => array(
					'sharedRoles' => array( 'contributor' ),
					'management'  => 'owner',
				),
				'analytics'          => array(
					'sharedRoles' => array( 'contributor', 'subscriber' ),
					'management'  => 'all_admins',
				),
				'pagespeed-insights' => array(
					'sharedRoles' => array(),
					'management'  => 'all_admins',
				),
			),
			$this->settings->get()
		);

		// admin_2 now cannot update search-console settings as management setting is set to "owner".
		$this->assertFalse( $this->settings->merge( $updated_sharing_settings ) );
	}

}
