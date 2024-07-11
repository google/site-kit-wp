<?php
/**
 * Conversion_Tracking_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Conversion_Tracking
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Conversion_Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking_Settings;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

class Conversion_Tracking_SettingsTest extends SettingsTestCase {

	/**
	 * Conversion Tracking Settings instance.
	 *
	 * @var Conversion_Tracking_Settings
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
		$this->settings = new Conversion_Tracking_Settings( $options );
		$this->settings->register();
	}

	protected function get_option_name() {
		return Conversion_Tracking_Settings::OPTION;
	}

	public function test_get_default() {
		$default_settings = get_option( $this->get_option_name() );
		$this->assertEqualSetsWithIndex(
			array(
				'enabled' => false,
			),
			$default_settings
		);
	}

	public function data_conversion_tracking_settings() {
		return array(
			'enabled false'     => array(
				array(
					'enabled' => false,
				),
				array(
					'enabled' => false,
				),
			),
			'enabled empty'     => array(
				array(),
				array(
					'enabled' => false,
				),
			),
			'enabled true'      => array(
				array(
					'enabled' => true,
				),
				array(
					'enabled' => true,
				),
			),
			'enabled non-empty' => array(
				array(
					'enabled' => 123,
				),
				array(
					'enabled' => true,
				),
			),
		);
	}

	/**
	 * @dataProvider data_conversion_tracking_settings
	 *
	 * @param mixed $input    Values to pass to the `set()` method.
	 * @param array $expected The expected sanitized array.
	 */
	public function test_get_sanitize_callback( $input, $expected ) {
		$this->settings->set( $input );
		$this->assertEqualSetsWithIndex( $expected, $this->settings->get() );
	}

	public function test_is_conversion_tracking_enabled() {
		$this->assertFalse( $this->settings->is_conversion_tracking_enabled() );

		$this->settings->set( array( 'enabled' => true ) );
		$this->assertTrue( $this->settings->is_conversion_tracking_enabled() );

		$this->settings->set( array( 'enabled' => false ) );
		$this->assertFalse( $this->settings->is_conversion_tracking_enabled() );
	}
}
