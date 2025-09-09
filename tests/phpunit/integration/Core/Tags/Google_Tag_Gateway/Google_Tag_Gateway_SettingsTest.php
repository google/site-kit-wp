<?php
/**
 * Google_Tag_Gateway_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tags\Google_Tag_Gateway
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tags\Google_Tag_Gateway;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Settings;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

class Google_Tag_Gateway_SettingsTest extends SettingsTestCase {

	/**
	 * Google Tag Gateway Settings instance.
	 *
	 * @var Google_Tag_Gateway_Settings
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
		$this->settings = new Google_Tag_Gateway_Settings( $options );
		$this->settings->register();
	}

	protected function get_option_name() {
		return Google_Tag_Gateway_Settings::OPTION;
	}

	public function test_get_default() {
		$default_settings = get_option( $this->get_option_name() );
		$this->assertEqualSetsWithIndex(
			array(
				'isEnabled'             => false,
				'isGTGHealthy'          => null,
				'isScriptAccessEnabled' => null,
			),
			$default_settings
		);
	}

	public function data_google_tag_gateway_settings() {
		return array(
			'all properties false'  => array(
				array(
					'isEnabled'             => false,
					'isGTGHealthy'          => false,
					'isScriptAccessEnabled' => false,
				),
				array(
					'isEnabled'             => false,
					'isGTGHealthy'          => false,
					'isScriptAccessEnabled' => false,
				),
			),
			'empty settings'        => array(
				array(),
				array(
					'isEnabled'             => false,
					'isGTGHealthy'          => null,
					'isScriptAccessEnabled' => null,
				),
			),
			'all properties true'   => array(
				array(
					'isEnabled'             => true,
					'isGTGHealthy'          => true,
					'isScriptAccessEnabled' => true,
				),
				array(
					'isEnabled'             => true,
					'isGTGHealthy'          => true,
					'isScriptAccessEnabled' => true,
				),
			),
			'only isEnabled false'  => array(
				array(
					'isEnabled' => false,
				),
				array(
					'isEnabled'             => false,
					'isGTGHealthy'          => null,
					'isScriptAccessEnabled' => null,
				),
			),
			'only isEnabled true'   => array(
				array(
					'isEnabled' => true,
				),
				array(
					'isEnabled'             => true,
					'isGTGHealthy'          => null,
					'isScriptAccessEnabled' => null,
				),
			),
			'isEnabled non-boolean' => array(
				array(
					'isEnabled' => 123,
				),
				array(
					'isEnabled'             => true,
					'isGTGHealthy'          => null,
					'isScriptAccessEnabled' => null,
				),
			),
		);
	}

	/**
	 * @dataProvider data_google_tag_gateway_settings
	 *
	 * @param mixed $input    Values to pass to the `set()` method.
	 * @param array $expected The expected sanitized array.
	 */
	public function test_get_sanitize_callback( $input, $expected ) {
		$this->settings->set( $input );
		$this->assertEqualSetsWithIndex( $expected, $this->settings->get() );
	}

	public function test_merge() {
		$original_settings = array(
			'isEnabled'             => false,
			'isGTGHealthy'          => false,
			'isScriptAccessEnabled' => false,
		);

		$changed_settings = array(
			'isEnabled'             => true,
			'isGTGHealthy'          => true,
			'isScriptAccessEnabled' => true,
		);

		// Make sure settings can be updated even without having them set initially.
		$this->settings->merge( $original_settings );
		$this->assertEqualSetsWithIndex( $original_settings, $this->settings->get() );

		// Make sure invalid keys aren't set.
		$this->settings->merge( array( 'test_key' => 'test_value' ) );
		$this->assertEqualSetsWithIndex( $original_settings, $this->settings->get() );

		// Make sure that we can update settings partially.
		$this->settings->set( $original_settings );
		$this->settings->merge( array( 'isGTGHealthy' => true ) );
		$this->assertEqualSetsWithIndex(
			array(
				'isEnabled'             => false,
				'isGTGHealthy'          => true,
				'isScriptAccessEnabled' => false,
			),
			$this->settings->get()
		);

		// Make sure that we can update all settings at once.
		$this->settings->set( $original_settings );
		$this->settings->merge( $changed_settings );
		$this->assertEqualSetsWithIndex( $changed_settings, $this->settings->get() );

		// Make sure that we can't set null for the isGTGHealthy property.
		$this->settings->set( $original_settings );
		$this->settings->merge( array( 'isGTGHealthy' => null ) );
		$this->assertEqualSetsWithIndex( $original_settings, $this->settings->get() );

		// Make sure that we can't set null for the isScriptAccessEnabled property.
		$this->settings->set( $original_settings );
		$this->settings->merge( array( 'isScriptAccessEnabled' => null ) );
		$this->assertEqualSetsWithIndex( $original_settings, $this->settings->get() );

		// Make sure that we can't set null for the isEnabled property.
		$this->settings->set( $original_settings );
		$this->settings->merge( array( 'isEnabled' => null ) );
		$this->assertEqualSetsWithIndex( $original_settings, $this->settings->get() );
	}

	public function test_is_google_tag_gateway_active() {
		// By default, GTG should be inactive.
		$this->assertFalse( $this->settings->is_google_tag_gateway_active(), 'Google tag gateway should be inactive by default.' );

		// GTG should be inactive if only isEnabled is true.
		$this->settings->set(
			array(
				'isEnabled'             => true,
				'isGTGHealthy'          => false,
				'isScriptAccessEnabled' => false,
			)
		);
		$this->assertFalse( $this->settings->is_google_tag_gateway_active(), 'Google tag gateway should be inactive unless all settings are true.' );

		// GTG should be inactive if only isEnabled and isGTGHealthy are true.
		$this->settings->set(
			array(
				'isEnabled'             => true,
				'isGTGHealthy'          => true,
				'isScriptAccessEnabled' => false,
			)
		);
		$this->assertFalse( $this->settings->is_google_tag_gateway_active(), 'Google tag gateway should be inactive unless all settings are true.' );

		// GTG should be inactive if only isEnabled and isScriptAccessEnabled are true.
		$this->settings->set(
			array(
				'isEnabled'             => true,
				'isGTGHealthy'          => false,
				'isScriptAccessEnabled' => true,
			)
		);
		$this->assertFalse( $this->settings->is_google_tag_gateway_active(), 'Google tag gateway should be inactive unless all settings are true.' );

		// GTG should be active if all settings are true.
		$this->settings->set(
			array(
				'isEnabled'             => true,
				'isGTGHealthy'          => true,
				'isScriptAccessEnabled' => true,
			)
		);
		$this->assertTrue( $this->settings->is_google_tag_gateway_active(), 'Google tag gateway should be active when all settings are true.' );
	}
}
