<?php
/**
 * Class Google\Site_Kit\Tests\Core\Email_Reporting\Email_Reporting_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;

class Email_Reporting_SettingsTest extends TestCase {

	/**
	 * @var Email_Reporting_Settings
	 */
	private $settings;

	public function set_up() {
		parent::set_up();
		$options        = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->settings = new Email_Reporting_Settings( $options );
		$this->settings->register();
	}

	public function tear_down() {
		parent::tear_down();
		delete_option( Email_Reporting_Settings::OPTION );
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

	public function test_is_email_reporting_enabled() {
		$this->assertTrue( $this->settings->is_email_reporting_enabled(), 'Should be enabled by default' );

		$this->settings->set( array( 'enabled' => false ) );
		$this->assertFalse( $this->settings->is_email_reporting_enabled(), 'Should be disabled after setting to false' );
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
