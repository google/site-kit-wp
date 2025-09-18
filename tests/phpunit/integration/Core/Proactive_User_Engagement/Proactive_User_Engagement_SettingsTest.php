<?php
/**
 * Class Google\Site_Kit\Tests\Core\Proactive_User_Engagement\Proactive_User_Engagement_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Proactive_User_Engagement
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Proactive_User_Engagement;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Proactive_User_Engagement\Proactive_User_Engagement_Settings;
use Google\Site_Kit\Tests\TestCase;

class Proactive_User_Engagement_SettingsTest extends TestCase {

	/**
	 * @var Proactive_User_Engagement_Settings
	 */
	private $settings;

	public function set_up() {
		parent::set_up();
		$options        = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->settings = new Proactive_User_Engagement_Settings( $options );
		$this->settings->register();
	}

	public function tear_down() {
		parent::tear_down();
		delete_option( Proactive_User_Engagement_Settings::OPTION );
	}

	public function test_get_default() {
		$this->assertEquals(
			array(
				'enabled' => true,
			),
			$this->settings->get(),
			'Default value should be correct'
		);
	}

	public function test_is_proactive_user_engagement_enabled() {
		$this->assertTrue( $this->settings->is_proactive_user_engagement_enabled(), 'Should be enabled by default' );

		$this->settings->set( array( 'enabled' => false ) );
		$this->assertFalse( $this->settings->is_proactive_user_engagement_enabled(), 'Should be disabled after setting to false' );
	}

	public function test_sanitize_callback() {
		// Test with a valid value.
		$this->settings->set( array( 'enabled' => false ) );
		$this->assertEquals( array( 'enabled' => false ), $this->settings->get(), 'Should be able to set a valid value' );

		// Test with an invalid value.
		$this->settings->set( array( 'enabled' => 'invalid' ) );
		$this->assertEquals( array( 'enabled' => true ), $this->settings->get(), 'Should fall back to default for an invalid value' );

		// Test with a missing value.
		$this->settings->set( array() );
		$this->assertEquals( array( 'enabled' => true ), $this->settings->get(), 'Should fall back to default for a missing value' );

		// Test with a non-array value.
		$this->settings->set( 'invalid' );
		$this->assertEquals( array( 'enabled' => true ), $this->settings->get(), 'Should fall back to default for a non-array value' );
	}
}
