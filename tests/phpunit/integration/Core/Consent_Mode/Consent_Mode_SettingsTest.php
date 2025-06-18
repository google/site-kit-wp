<?php
/**
 * Consent_Mode_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Consent_Mode
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760


namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Consent_Mode\Consent_Mode_Settings;
use Google\Site_Kit\Core\Consent_Mode\Regions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

class Consent_Mode_SettingsTest extends SettingsTestCase {

	/**
	 * Consent Mode Settings instance.
	 *
	 * @var Consent_Mode_Settings
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
		$this->settings = new Consent_Mode_Settings( $options );
		$this->settings->register();
	}

	protected function get_option_name() {
		return Consent_Mode_Settings::OPTION;
	}

	public function test_get_default() {
		$default_settings = get_option( $this->get_option_name() );
		$this->assertEqualSetsWithIndex(
			array(
				'enabled' => false,
				'regions' => Regions::get_regions(),
			),
			$default_settings
		);
	}

	public function data_consent_mode_settings() {
		return array(
			'enabled false'       => array(
				array(
					'enabled' => false,
				),
				array(
					'enabled' => false,
					'regions' => Regions::get_regions(),
				),
			),
			'enabled empty'       => array(
				array(),
				array(
					'enabled' => false,
					'regions' => Regions::get_regions(),
				),
			),
			'enabled true'        => array(
				array(
					'enabled' => true,
				),
				array(
					'enabled' => true,
					'regions' => Regions::get_regions(),
				),
			),
			'enabled non-empty'   => array(
				array(
					'enabled' => 123,
				),
				array(
					'enabled' => true,
					'regions' => Regions::get_regions(),
				),
			),
			'valid regions'       => array(
				array(
					'regions' => array( 'SG', 'us-as' ),
				),
				array(
					'enabled' => false,
					'regions' => array( 'SG', 'US-AS' ),
				),
			),
			'invalid region'      => array(
				array(
					'regions' => array( 'SG', 'InvalidRegionCode' ),
				),
				array(
					'enabled' => false,
					'regions' => array( 'SG' ),
				),
			),
			'all invalid regions' => array(
				array(
					'regions' => array( 'InvalidRegionCodeA', 'InvalidRegionCodeB' ),
				),
				array(
					'enabled' => false,
					'regions' => Regions::get_regions(),
				),
			),
			'empty regions'       => array(
				array(
					'regions' => array(),
				),
				array(
					'enabled' => false,
					'regions' => Regions::get_regions(),
				),
			),
			'non-array regions'   => array(
				array(
					'regions' => 123,
				),
				array(
					'enabled' => false,
					'regions' => Regions::get_regions(),
				),
			),
		);
	}

	/**
	 * @dataProvider data_consent_mode_settings
	 *
	 * @param mixed $input    Values to pass to the `set()` method.
	 * @param array $expected The expected sanitized array.
	 */
	public function test_get_sanitize_callback( $input, $expected ) {
		$this->settings->set( $input );
		$this->assertEqualSetsWithIndex( $expected, $this->settings->get() );
	}

	public function test_is_consent_mode_enabled() {
		$this->assertFalse( $this->settings->is_consent_mode_enabled() );

		$this->settings->set( array( 'enabled' => true ) );
		$this->assertTrue( $this->settings->is_consent_mode_enabled() );

		$this->settings->set( array( 'enabled' => false ) );
		$this->assertFalse( $this->settings->is_consent_mode_enabled() );
	}

	public function test_get_regions() {
		$this->assertEquals( Regions::get_regions(), $this->settings->get_regions() );

		$regions = array( 'SG', 'UA-AS' );
		$this->settings->set( array( 'regions' => $regions ) );
		$this->assertEquals( $regions, $this->settings->get_regions() );
	}
}
