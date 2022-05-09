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

	public function set_up() {
		parent::set_up();

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
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

	public function test_merge() {
		$this->enable_feature( 'dashboardSharing' );

		$admin_1 = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_1->ID );

		$initial_sharing_settings = array(
			'search-console'     => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
			'analytics'          => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',   // To test that non-owners cannot merge settings for this module.
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array(),
				'management'  => 'all_admins',
			),
		);
		$this->settings->set( $initial_sharing_settings );

		$admin_2 = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_2->ID );
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $admin_2->ID );

		// Authenticate admin_2 user to partially grant capability to manage module sharing options.
		$authentication = new Authentication( $context );
		$authentication->get_oauth_client()->set_token(
			array(
				'access_token' => 'valid-auth-token',
			)
		);

		// Re-register Permissions after enabling the dashboardSharing feature to include dashboard sharing capabilities.
		$permissions = new Permissions( $context, $authentication, new Modules( $context ), $user_options, new Dismissed_Items( $user_options ) );
		$permissions->register();

		$updated_sharing_settings = array(
			'analytics'          => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
		);

		$this->assertTrue( $this->settings->merge( $updated_sharing_settings ) );

		$expected_sharing_settings = array(
			'search-console'     => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
			'analytics'          => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'editor', 'subscriber' ),
				'management'  => 'all_admins',
			),
		);

		$this->assertEquals( $expected_sharing_settings, $this->settings->get() );

		// Make admin_2 the owner of analytics so analytics sharing settings can be updated by them.
		update_option( 'googlesitekit_analytics_settings', array( 'ownerID' => $admin_2->ID ) );
		$this->assertTrue( $this->settings->merge( $updated_sharing_settings ) );

		$expected_sharing_settings['analytics'] = array(
			'sharedRoles' => array( 'editor', 'subscriber' ),
			'management'  => 'all_admins',
		);
		$this->assertEquals( $expected_sharing_settings, $this->settings->get() );
	}

}
