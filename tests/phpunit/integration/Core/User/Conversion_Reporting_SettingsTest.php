<?php
/**
 * Class Google\Site_Kit\Tests\Core\User\Conversion_Reporting_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\User;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User\Conversion_Reporting_Settings;
use Google\Site_Kit\Tests\TestCase;

class Conversion_Reporting_SettingsTest extends TestCase {

	/**
	 * Conversion_Reporting_Settings instance.
	 *
	 * @var Conversion_Reporting_Settings
	 */
	private $conversion_reporting_settings;

	public function set_up() {
		parent::set_up();
		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );
		$meta_key     = $user_options->get_meta_key( Conversion_Reporting_Settings::OPTION );

		unregister_meta_key( 'user', $meta_key );
		// Needed to unregister the instance registered during plugin bootstrap.
		remove_all_filters( "sanitize_user_meta_{$meta_key}" );

		$this->conversion_reporting_settings = new Conversion_Reporting_Settings( $user_options );

		$this->conversion_reporting_settings->register();
	}

	public function test_get_default() {
		$this->assertEquals(
			array(
				'newEventsCalloutDismissedAt'  => 0,
				'lostEventsCalloutDismissedAt' => 0,
			),
			$this->conversion_reporting_settings->get()
		);
	}

	public function data_conversion_reporting_settings() {
		return array(
			'empty by default' => array(
				null,
				array(),
			),
			'non-array - bool' => array(
				false,
				array(),
			),
			'non-array - int'  => array(
				123,
				array(),
			),
			'non integer for newEventsCalloutDismissedAt and null lostEventsCalloutDismissedAt' => array(
				array(
					'newEventsCalloutDismissedAt'  => 'string',
					'lostEventsCalloutDismissedAt' => null,
				),
				array(
					'newEventsCalloutDismissedAt'  => 0,
					'lostEventsCalloutDismissedAt' => 0,
				),
			),
			'integer for both lostEventsCalloutDismissedAt and newEventsCalloutDismissedAt' => array(
				array(
					'newEventsCalloutDismissedAt'  => 1734519924,
					'lostEventsCalloutDismissedAt' => 1734519928,
				),
				array(
					'newEventsCalloutDismissedAt'  => 1734519924,
					'lostEventsCalloutDismissedAt' => 1734519928,
				),
			),
		);
	}

	/**
	 * @dataProvider data_conversion_reporting_settings
	 *
	 * @param mixed $input    Values to pass to the `set()` method.
	 * @param array $expected The expected sanitized array.
	 */
	public function test_get_sanitize_callback( $input, $expected ) {
		$this->conversion_reporting_settings->set( $input );
		$this->assertEquals( $expected, $this->conversion_reporting_settings->get() );
	}

	public function test_merge() {
		$original_settings = array(
			'newEventsCalloutDismissedAt'  => 0,
			'lostEventsCalloutDismissedAt' => 0,
		);

		$changed_settings = array(
			'newEventsCalloutDismissedAt'  => 1734519924,
			'lostEventsCalloutDismissedAt' => 0,
		);

		// Make sure settings can be updated even without having them set initially
		$this->conversion_reporting_settings->merge( $original_settings );
		$this->assertEqualSetsWithIndex( $original_settings, $this->conversion_reporting_settings->get() );

		// Make sure invalid keys aren't set
		$this->conversion_reporting_settings->merge( array( 'test_key' => 'test_value' ) );
		$this->assertEqualSetsWithIndex( $original_settings, $this->conversion_reporting_settings->get() );

		// Make sure that we can update settings partially
		$this->conversion_reporting_settings->set( $original_settings );
		$this->conversion_reporting_settings->merge( array( 'newEventsCalloutDismissedAt' => 1734519924 ) );
		$this->assertEqualSetsWithIndex(
			array(
				'newEventsCalloutDismissedAt'  => 1734519924,
				'lostEventsCalloutDismissedAt' => $original_settings['lostEventsCalloutDismissedAt'],
			),
			$this->conversion_reporting_settings->get()
		);

		// Make sure that we can update all settings at once
		$this->conversion_reporting_settings->set( $original_settings );
		$this->conversion_reporting_settings->merge( $changed_settings );
		$this->assertEqualSetsWithIndex( $changed_settings, $this->conversion_reporting_settings->get() );

		// Make sure that we can't set wrong format for the newEventsCalloutDismissedAt property
		$this->conversion_reporting_settings->set( $original_settings );
		$this->conversion_reporting_settings->merge( array( 'newEventsCalloutDismissedAt' => null ) );
		$this->assertEqualSetsWithIndex( $original_settings, $this->conversion_reporting_settings->get() );

		// Make sure that we can't set wrong format for the lostEventsCalloutDismissedAt property
		$this->conversion_reporting_settings->set( $original_settings );
		$this->conversion_reporting_settings->merge( array( 'lostEventsCalloutDismissedAt' => null ) );
		$this->assertEqualSetsWithIndex( $original_settings, $this->conversion_reporting_settings->get() );
	}
}
