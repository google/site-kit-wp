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
		$this->assertEmpty(
			get_option( $this->get_option_name() )
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

}
