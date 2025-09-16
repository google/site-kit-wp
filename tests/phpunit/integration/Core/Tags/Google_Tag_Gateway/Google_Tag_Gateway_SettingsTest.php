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
				'isGTGDefault'          => true,
			),
			$default_settings
		);
	}

	public function data_google_tag_gateway_settings() {
		return array(
			'all properties false'     => array(
				array(
					'isEnabled'             => false,
					'isGTGHealthy'          => false,
					'isScriptAccessEnabled' => false,
					'isGTGDefault'          => false,
				),
				array(
					'isEnabled'             => false,
					'isGTGHealthy'          => false,
					'isScriptAccessEnabled' => false,
					'isGTGDefault'          => false,
				),
			),
			'empty settings'           => array(
				array(),
				array(
					'isEnabled'             => false,
					'isGTGHealthy'          => null,
					'isScriptAccessEnabled' => null,
					'isGTGDefault'          => true,
				),
			),
			'all properties true'      => array(
				array(
					'isEnabled'             => true,
					'isGTGHealthy'          => true,
					'isScriptAccessEnabled' => true,
					'isGTGDefault'          => true,
				),
				array(
					'isEnabled'             => true,
					'isGTGHealthy'          => true,
					'isScriptAccessEnabled' => true,
					'isGTGDefault'          => true,
				),
			),
			'only isEnabled false'     => array(
				array(
					'isEnabled' => false,
				),
				array(
					'isEnabled'             => false,
					'isGTGHealthy'          => null,
					'isScriptAccessEnabled' => null,
					'isGTGDefault'          => true,
				),
			),
			'only isEnabled true'      => array(
				array(
					'isEnabled' => true,
				),
				array(
					'isEnabled'             => true,
					'isGTGHealthy'          => null,
					'isScriptAccessEnabled' => null,
					'isGTGDefault'          => true,
				),
			),
			'isEnabled non-boolean'    => array(
				array(
					'isEnabled' => 123,
				),
				array(
					'isEnabled'             => true,
					'isGTGHealthy'          => null,
					'isScriptAccessEnabled' => null,
					'isGTGDefault'          => true,
				),
			),
			'only isGTGDefault false'  => array(
				array(
					'isGTGDefault' => false,
				),
				array(
					'isEnabled'             => false,
					'isGTGHealthy'          => null,
					'isScriptAccessEnabled' => null,
					'isGTGDefault'          => false,
				),
			),
			'only isGTGDefault true'   => array(
				array(
					'isGTGDefault' => true,
				),
				array(
					'isEnabled'             => false,
					'isGTGHealthy'          => null,
					'isScriptAccessEnabled' => null,
					'isGTGDefault'          => true,
				),
			),
			'isGTGDefault non-boolean' => array(
				array(
					'isGTGDefault' => 'yes',
				),
				array(
					'isEnabled'             => false,
					'isGTGHealthy'          => null,
					'isScriptAccessEnabled' => null,
					'isGTGDefault'          => true,
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
			'isGTGDefault'          => true,
		);

		$changed_settings = array(
			'isEnabled'             => true,
			'isGTGHealthy'          => true,
			'isScriptAccessEnabled' => true,
			'isGTGDefault'          => true,
		);

		// Make sure settings can be updated even without having them set initially.
		// Note: When isEnabled is set and isGTGDefault is true (default), isGTGDefault auto-updates to false.
		$this->settings->merge( $original_settings );
		$expected_after_merge                 = $original_settings;
		$expected_after_merge['isGTGDefault'] = false; // Auto-updated because isEnabled was set.
		$this->assertEqualSetsWithIndex( $expected_after_merge, $this->settings->get() );

		// Make sure invalid keys aren't set.
		$this->settings->merge( array( 'test_key' => 'test_value' ) );
		$this->assertEqualSetsWithIndex( $expected_after_merge, $this->settings->get() );

		// Make sure that we can update settings partially.
		$this->settings->set( $original_settings );
		$this->settings->merge( array( 'isGTGHealthy' => true ) );
		$this->assertEqualSetsWithIndex(
			array(
				'isEnabled'             => false,
				'isGTGHealthy'          => true,
				'isScriptAccessEnabled' => false,
				'isGTGDefault'          => true,
			),
			$this->settings->get()
		);

		// Make sure that we can update all settings at once.
		$this->settings->set( $original_settings );
		$this->settings->merge( $changed_settings );
		// Note: When isEnabled is in the merged settings and current isGTGDefault is true,
		// isGTGDefault will be auto-updated to false regardless of what's in $changed_settings.
		$expected_changed_settings                 = $changed_settings;
		$expected_changed_settings['isGTGDefault'] = false; // Auto-updated
		$this->assertEqualSetsWithIndex( $expected_changed_settings, $this->settings->get() );

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

		// Make sure that we can't set null for the isGTGDefault property.
		$this->settings->set( $original_settings );
		$this->settings->merge( array( 'isGTGDefault' => null ) );
		$this->assertEqualSetsWithIndex( $original_settings, $this->settings->get() );
	}

	public function test_merge_isGTGDefault_auto_update_logic() {
		// Test that isGTGDefault is automatically set to false when isEnabled changes and isGTGDefault is currently true.
		$this->settings->set(
			array(
				'isEnabled'             => false,
				'isGTGHealthy'          => false,
				'isScriptAccessEnabled' => false,
				'isGTGDefault'          => true,
			)
		);

		// When isEnabled changes from false to true and isGTGDefault is true, isGTGDefault should auto-update to false.
		$this->settings->merge( array( 'isEnabled' => true ) );
		$this->assertEqualSetsWithIndex(
			array(
				'isEnabled'             => true,
				'isGTGHealthy'          => false,
				'isScriptAccessEnabled' => false,
				'isGTGDefault'          => false,
			),
			$this->settings->get()
		);

		// Reset settings for next test.
		$this->settings->set(
			array(
				'isEnabled'             => true,
				'isGTGHealthy'          => false,
				'isScriptAccessEnabled' => false,
				'isGTGDefault'          => true,
			)
		);

		// When isEnabled changes from true to false and isGTGDefault is true, isGTGDefault should auto-update to false.
		$this->settings->merge( array( 'isEnabled' => false ) );
		$this->assertEqualSetsWithIndex(
			array(
				'isEnabled'             => false,
				'isGTGHealthy'          => false,
				'isScriptAccessEnabled' => false,
				'isGTGDefault'          => false,
			),
			$this->settings->get()
		);

		// Test that isGTGDefault is NOT auto-updated when isGTGDefault is already false.
		$this->settings->set(
			array(
				'isEnabled'             => false,
				'isGTGHealthy'          => false,
				'isScriptAccessEnabled' => false,
				'isGTGDefault'          => false,
			)
		);

		// When isEnabled changes and isGTGDefault is already false, isGTGDefault should remain false.
		$this->settings->merge( array( 'isEnabled' => true ) );
		$this->assertEqualSetsWithIndex(
			array(
				'isEnabled'             => true,
				'isGTGHealthy'          => false,
				'isScriptAccessEnabled' => false,
				'isGTGDefault'          => false,
			),
			$this->settings->get()
		);

		// Test that isGTGDefault is NOT auto-updated when isEnabled is not being changed.
		$this->settings->set(
			array(
				'isEnabled'             => false,
				'isGTGHealthy'          => false,
				'isScriptAccessEnabled' => false,
				'isGTGDefault'          => true,
			)
		);

		// When other settings change but not isEnabled, isGTGDefault should remain unchanged.
		$this->settings->merge( array( 'isGTGHealthy' => true ) );
		$this->assertEqualSetsWithIndex(
			array(
				'isEnabled'             => false,
				'isGTGHealthy'          => true,
				'isScriptAccessEnabled' => false,
				'isGTGDefault'          => true,
			),
			$this->settings->get()
		);

		// Test that auto-update logic takes precedence when isEnabled is changed.
		$this->settings->set(
			array(
				'isEnabled'             => false,
				'isGTGHealthy'          => false,
				'isScriptAccessEnabled' => false,
				'isGTGDefault'          => true,
			)
		);

		// When both isEnabled and isGTGDefault are set, auto-update logic takes precedence.
		// This ensures that any change to isEnabled marks the settings as "no longer default".
		$this->settings->merge(
			array(
				'isEnabled'    => true,
				'isGTGDefault' => true,
			)
		);
		$this->assertEqualSetsWithIndex(
			array(
				'isEnabled'             => true,
				'isGTGHealthy'          => false,
				'isScriptAccessEnabled' => false,
				'isGTGDefault'          => false, // Auto-updated despite explicit setting.
			),
			$this->settings->get()
		);

		// Test that isGTGDefault can be explicitly set when isEnabled is not being changed.
		$this->settings->set(
			array(
				'isEnabled'             => false,
				'isGTGHealthy'          => false,
				'isScriptAccessEnabled' => false,
				'isGTGDefault'          => false,
			)
		);

		// When only isGTGDefault is set (no isEnabled change), explicit setting should work.
		$this->settings->merge( array( 'isGTGDefault' => true ) );
		$this->assertEqualSetsWithIndex(
			array(
				'isEnabled'             => false,
				'isGTGHealthy'          => false,
				'isScriptAccessEnabled' => false,
				'isGTGDefault'          => true, // Explicit setting works when isEnabled not changed.
			),
			$this->settings->get()
		);
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
		$this->assertFalse( $this->settings->is_google_tag_gateway_active(), 'Google tag gateway should be inactive if only isEnabled is true.' );

		// GTG should be inactive if only isEnabled and isGTGHealthy are true.
		$this->settings->set(
			array(
				'isEnabled'             => true,
				'isGTGHealthy'          => true,
				'isScriptAccessEnabled' => false,
			)
		);
		$this->assertFalse( $this->settings->is_google_tag_gateway_active(), 'Google tag gateway should be inactive if only isEnabled and isGTGHealthy are true.' );

		// GTG should be inactive if only isEnabled and isScriptAccessEnabled are true.
		$this->settings->set(
			array(
				'isEnabled'             => true,
				'isGTGHealthy'          => false,
				'isScriptAccessEnabled' => true,
			)
		);
		$this->assertFalse( $this->settings->is_google_tag_gateway_active(), 'Google tag gateway should be inactive if only isEnabled and isScriptAccessEnabled are true.' );

		// GTG should be active if all settings are true.
		$this->settings->set(
			array(
				'isEnabled'             => true,
				'isGTGHealthy'          => true,
				'isScriptAccessEnabled' => true,
			)
		);
		$this->assertTrue( $this->settings->is_google_tag_gateway_active(), 'Google tag gateway should be active when all settings are true.' );

		// GTG should be active even if isGTGDefault is false, as long as operational settings are true.
		$this->settings->set(
			array(
				'isEnabled'             => true,
				'isGTGHealthy'          => true,
				'isScriptAccessEnabled' => true,
				'isGTGDefault'          => false,
			)
		);
		$this->assertTrue( $this->settings->is_google_tag_gateway_active(), 'Google tag gateway should be active regardless of isGTGDefault value.' );
	}
}
