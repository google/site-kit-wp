<?php
/**
 * Module_Sharing_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Storage\Options;
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
		$this->assertTrue( is_array( $default_settings ), 'Default sharing settings should be stored as an array.' );
		$this->assertEmpty(
			$default_settings,
			'Default sharing settings should not include any modules.'
		);
	}

	public function test_get_sanitize_callback() {
		$this->assertEmpty( get_option( $this->get_option_name() ), 'Sharing settings option should start empty.' );

		// Test sanitizing invalid sharedRoles.
		$test_sharing_settings = array(
			'analytics-4'        => array(
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
			'analytics-4'        => array(
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
			$this->assertEquals( $expected, get_option( $this->get_option_name() ), 'Sharing settings sanitizer should remove invalid roles.' );
	}

	public function test_get() {
		$defaultSettings = $this->settings->get();
		$this->assertTrue( is_array( $defaultSettings ), 'Sharing settings getter should return an array.' );
		$this->assertEmpty( $defaultSettings, 'Sharing settings getter should default to empty array.' );

		// Test invalid settings when we get settings.
		$test_sharing_settings = array(
			'analytics-4'        => array(
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
				'sharedRoles' => array( 'editor', 'author' ),
				'management'  => 'all_admins',
			),
		);
		$expected              = array(
			'analytics-4'        => array(
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
				'sharedRoles' => array( 'editor', 'author' ),
				'management'  => 'all_admins',
			),
		);
		$this->settings->set( $test_sharing_settings );
		$this->assertEquals( $expected, $this->settings->get(), 'Getter should normalize invalid sharing settings.' );
	}

	/**
	 * @dataProvider data_get_module
	 * @param array $sharing_settings
	 * @param string $module_slug
	 * @param array $expected
	 */
	public function test_get_module( $sharing_settings, $module_slug, $expected ) {
		update_option( $this->get_option_name(), $sharing_settings );

		$actual = $this->settings->get_module( $module_slug );

		$this->assertEquals( $expected, $actual, 'Module sharing getter should return saved or default settings.' );
	}

	public function data_get_module() {
		$module_slug = 'test-module';
		$defaults    = array(
			'sharedRoles' => array(),
			'management'  => 'owner',
		);

		return array(
			'no saved settings'          => array(
				array(),
				$module_slug,
				$defaults,
			),
			'non-default saved settings' => array(
				array(
					$module_slug => array(
						'sharedRoles' => array( 'editor' ),
						'management'  => 'all_admins',
					),
				),
				$module_slug,
				array(
					'sharedRoles' => array( 'editor' ),
					'management'  => 'all_admins',
				),
			),
		);
	}

	public function test_unset_module() {
		$test_sharing_settings = array(
			'analytics-4'        => array(
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
				'sharedRoles' => array( 'editor', 'author' ),
				'management'  => 'all_admins',
			),
		);
		$expected              = array(
			'analytics-4'    => array(
				'sharedRoles' => array(),
				'management'  => 'owner',
			),
			'adsense'        => array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',
			),
			'search-console' => array(
				'sharedRoles' => array( 'editor', 'author' ),
				'management'  => 'all_admins',
			),
		);
		$this->settings->set( $test_sharing_settings );
		$this->assertEquals( $test_sharing_settings, $this->settings->get(), 'Sharing settings should include module before unset.' );

		$this->settings->unset_module( 'pagespeed-insights' );

		$this->assertEquals( $expected, $this->settings->get(), 'Unsetting module should remove only selected module.' );
	}

	public function test_get_all_shared_roles() {
		$test_sharing_settings = array(
			'analytics-4'        => array(
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
				'sharedRoles' => array( 'editor', 'author' ),
				'management'  => 'all_admins',
			),
		);
		$this->settings->set( $test_sharing_settings );
		$this->assertEqualSets( array( 'contributor', 'editor', 'author' ), $this->settings->get_all_shared_roles(), 'Shared role getter should aggregate unique configured roles.' );
	}

	public function test_get_shared_roles() {
		$this->assertEmpty( $this->settings->get_shared_roles( 'pagespeed-insights' ), 'Module without sharing settings should return no shared roles.' );

		$test_sharing_settings = array(
			'analytics-4'        => array(
				'sharedRoles' => array( 'editor', 'author' ),
				'management'  => 'owner',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array(),
				'management'  => 'all_admins',
			),
		);

		$this->settings->set( $test_sharing_settings );
		$this->assertEquals( array( 'editor', 'author' ), $this->settings->get_shared_roles( 'analytics-4' ), 'Shared role getter should return roles for requested module.' );
		$this->assertEmpty( $this->settings->get_shared_roles( 'pagespeed-insights' ), 'Module with empty sharing settings should return no shared roles.' );
	}

	public function test_merge() {
		// Check there are no settings to begin with.
		$this->assertEmpty( $this->settings->get(), 'Sharing settings should start empty before merge.' );

		$this->assertTrue(
			$this->settings->merge(
				array(
					'search-console' => array(
						'sharedRoles' => array( 'contributor' ),
						'management'  => 'owner',
					),
					'analytics-4'    => array(
						'sharedRoles' => array( 'contributor', 'author' ),
						'management'  => 'all_admins',
					),
				)
			),
			'Merge should accept valid module sharing settings.'
		);

		// Modules with `null` values are ignored.
		$this->assertFalse(
			$this->settings->merge(
				array(
					'search-console' => null,
					'analytics-4'    => null,
				)
			),
			'Merge should ignore null module settings.'
		);

		// Modules with `empty` values are ignored.
		$this->assertFalse(
			$this->settings->merge(
				array(
					'search-console' => array(),
					'analytics-4'    => array(),
				)
			),
			'Merge should ignore empty module settings.'
		);

		// Merges settings with valid partials and keeps the rest.
		$test_sharing_settings = array(
			'search-console'     => array(
				'sharedRoles' => array( 'contributor', 'editor' ),
			),
			'analytics-4'        => array(
				'management' => 'owner',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'author' ),
				'management'  => 'owner',
			),
		);
		$expected              = array(
			'search-console'     => array(
				'sharedRoles' => array( 'contributor', 'editor' ),
				'management'  => 'owner',
			),
			'analytics-4'        => array(
				'sharedRoles' => array( 'contributor', 'author' ),
				'management'  => 'owner',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'author' ),
				'management'  => 'owner',
			),
		);

			$this->assertTrue( $this->settings->merge( $test_sharing_settings ), 'Merge should accept valid partial module settings.' );
			$this->assertEquals( $expected, $this->settings->get(), 'Merge should preserve omitted module setting fields.' );

		// Keeps the valid parts of partial and discards the invalid parts.
		$test_sharing_settings = array(
			'search-console'     => null,
			'analytics-4'        => array(
				'sharedRoles' => array( 'contributor' ),
				'invalid'     => array( 'invalid' ),
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'author' ),
				'management'  => null,
			),
		);
		$expected              = array(
			'search-console'     => array(
				'sharedRoles' => array( 'contributor', 'editor' ),
				'management'  => 'owner',
			),
			'analytics-4'        => array(
				'sharedRoles' => array( 'contributor' ),
				'management'  => 'owner',
			),
			'pagespeed-insights' => array(
				'sharedRoles' => array( 'author' ),
				'management'  => 'owner',
			),
		);

			$this->assertTrue( $this->settings->merge( $test_sharing_settings ), 'Merge should accept partially valid module settings.' );
			$this->assertEquals( $expected, $this->settings->get(), 'Merge should discard invalid fields and keep valid fields.' );
	}
}
