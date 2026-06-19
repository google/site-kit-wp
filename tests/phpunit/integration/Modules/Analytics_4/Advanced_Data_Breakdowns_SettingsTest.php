<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Advanced_Data_Breakdowns_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4\Advanced_Data_Breakdowns_Settings;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

class Advanced_Data_Breakdowns_SettingsTest extends SettingsTestCase {

	/**
	 * @var Advanced_Data_Breakdowns_Settings
	 */
	private Advanced_Data_Breakdowns_Settings $settings;

	/**
	 * @var Options
	 */
	private Options $options;

	public function set_up(): void {
		parent::set_up();

		$this->options  = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->settings = new Advanced_Data_Breakdowns_Settings( $this->options );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name(): string {
		return Advanced_Data_Breakdowns_Settings::OPTION;
	}

	public function test_get_default(): void {
		$this->settings->register();

		$this->assertEqualSetsWithIndex(
			array(),
			$this->settings->get_default(),
			'The default value should be an empty property map.'
		);
	}

	public function test_get_type(): void {
		$this->settings->register();

		$this->assertEquals( 'object', $this->settings->get_type(), 'The setting should be registered as an object.' );
	}

	public function test_get_view_only_keys(): void {
		$this->settings->register();

		$this->settings->merge(
			array(
				'123456789' => true,
				'987654321' => false,
			)
		);

		$this->assertEqualSets(
			array( '123456789', '987654321' ),
			$this->settings->get_view_only_keys(),
			'View-only users should read every stored property ID.'
		);
	}

	public function test_sanitize__casts_each_property_value_to_boolean(): void {
		$this->settings->register();

		$this->options->set(
			$this->get_option_name(),
			array(
				'123456789' => 'yes',
				'987654321' => 0,
			)
		);

		$this->assertSame(
			array(
				'123456789' => true,
				'987654321' => false,
			),
			$this->settings->get(),
			'Each property value should sanitize to a boolean.'
		);
	}

	public function test_sanitize__keeps_existing_value_when_input_is_not_array(): void {
		$this->settings->register();

		$this->settings->merge( array( '123456789' => true ) );

		$this->options->set( $this->get_option_name(), 'invalid' );

		$this->assertSame(
			array( '123456789' => true ),
			$this->settings->get(),
			'A non-array input should leave the existing value untouched.'
		);
	}

	public function test_is_enabled__returns_the_stored_state_for_the_given_property(): void {
		$this->settings->register();

		$this->assertFalse(
			$this->settings->is_enabled( '123456789' ),
			'A property with no stored state should be disabled.'
		);

		$this->settings->merge(
			array(
				'123456789' => true,
				'987654321' => false,
			)
		);

		$this->assertTrue(
			$this->settings->is_enabled( '123456789' ),
			'`is_enabled()` should return true for the enabled property.'
		);
		$this->assertFalse(
			$this->settings->is_enabled( '987654321' ),
			'`is_enabled()` should return false for the disabled property.'
		);
	}

	public function test_merge__keeps_other_properties_states(): void {
		$this->settings->register();

		$this->settings->merge( array( '123456789' => true ) );

		$merged = $this->settings->merge( array( '987654321' => true ) );

		$this->assertSame(
			array(
				'123456789' => true,
				'987654321' => true,
			),
			$merged,
			'Merging a new property should keep the other properties\' states.'
		);

		$updated = $this->settings->merge( array( '123456789' => false ) );

		$this->assertSame(
			array(
				'123456789' => false,
				'987654321' => true,
			),
			$updated,
			'Merging should overwrite the given property and keep the others.'
		);
	}
}
