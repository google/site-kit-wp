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
			array( 'enabled' => false ),
			$this->settings->get_default(),
			'The default value should disable advanced data breakdowns.'
		);
	}

	public function test_get_type(): void {
		$this->settings->register();

		$this->assertEquals( 'object', $this->settings->get_type(), 'The setting should be registered as an object.' );
	}

	public function test_get_view_only_keys(): void {
		$this->settings->register();

		$this->assertEqualSets(
			array( 'enabled' ),
			$this->settings->get_view_only_keys(),
			'View-only users should be able to read the `enabled` flag.'
		);
	}

	public function test_sanitize_casts_enabled_to_boolean(): void {
		$this->settings->register();

		$this->options->set(
			$this->get_option_name(),
			array( 'enabled' => 'yes' )
		);

		$this->assertSame(
			array( 'enabled' => true ),
			$this->settings->get(),
			'A non-empty string for `enabled` should sanitize to `true`.'
		);

		$this->options->set(
			$this->get_option_name(),
			array( 'enabled' => 0 )
		);

		$this->assertSame(
			array( 'enabled' => false ),
			$this->settings->get(),
			'A zero integer for `enabled` should sanitize to `false`.'
		);
	}

	public function test_sanitize_keeps_existing_value_when_input_is_not_array(): void {
		$this->settings->register();

		$this->settings->merge( array( 'enabled' => true ) );

		$this->options->set( $this->get_option_name(), 'invalid' );

		$this->assertSame(
			array( 'enabled' => true ),
			$this->settings->get(),
			'A non-array input should leave the existing value untouched.'
		);
	}

	public function test_is_enabled_returns_stored_state(): void {
		$this->settings->register();

		$this->assertFalse( $this->settings->is_enabled(), 'The default state should be disabled.' );

		$this->settings->merge( array( 'enabled' => true ) );

		$this->assertTrue( $this->settings->is_enabled(), '`is_enabled()` should reflect the stored value.' );
	}

	public function test_merge_partial_update(): void {
		$this->settings->register();

		$this->settings->merge( array( 'enabled' => true ) );

		$merged = $this->settings->merge( array() );

		$this->assertSame(
			array( 'enabled' => true ),
			$merged,
			'An empty merge should keep the existing value.'
		);

		$updated = $this->settings->merge( array( 'enabled' => false ) );

		$this->assertSame(
			array( 'enabled' => false ),
			$updated,
			'Merging a new value should overwrite the previous one.'
		);
	}
}
