<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Measurement_Protocol;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Measurement_Protocol_Settings;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 */
class Measurement_Protocol_SettingsTest extends TestCase {

	/**
	 * Encrypted_Options instance.
	 *
	 * @var Encrypted_Options
	 */
	private $encrypted_options;

	/**
	 * Measurement_Protocol_Settings instance.
	 *
	 * @var Measurement_Protocol_Settings
	 */
	private $measurement_protocol_settings;

	public function set_up() {
		parent::set_up();

		$this->encrypted_options             = new Encrypted_Options( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$this->measurement_protocol_settings = new Measurement_Protocol_Settings( $this->encrypted_options );
	}

	public function test_set__stores_value_encrypted() {
		$this->measurement_protocol_settings->set(
			array(
				'secretValue'     => 'test-secret-value',
				'propertyID'      => '123456789',
				'webDataStreamID' => '987654321',
				'secretID'        => 'test-secret-id',
			)
		);

		$this->assertStringNotContainsString(
			'test-secret-value',
			get_option( Measurement_Protocol_Settings::OPTION ),
			'The raw option should not contain the secret value.'
		);
		$this->assertSame(
			array(
				'secretValue'     => 'test-secret-value',
				'propertyID'      => '123456789',
				'webDataStreamID' => '987654321',
				'secretID'        => 'test-secret-id',
			),
			$this->measurement_protocol_settings->get(),
			'The stored secret should be returned decrypted.'
		);
	}

	/**
	 * @dataProvider data_invalid_values
	 *
	 * @param mixed $value Invalid value.
	 */
	public function test_get__returns_default_for_invalid_value( $value ) {
		$this->assertTrue(
			$this->encrypted_options->set( Measurement_Protocol_Settings::OPTION, $value ),
			'The invalid value should be written to the option for this test.'
		);
		$this->assertSame(
			array(
				'secretValue'     => '',
				'propertyID'      => '',
				'webDataStreamID' => '',
				'secretID'        => '',
			),
			$this->measurement_protocol_settings->get(),
			'An invalid stored value should be replaced with the default.'
		);
	}

	/**
	 * @dataProvider data_invalid_values
	 *
	 * @param mixed $value Invalid value.
	 */
	public function test_set__rejects_invalid_value( $value ) {
		$this->assertFalse(
			$this->measurement_protocol_settings->set( $value ),
			'An invalid value should not be stored.'
		);
		$this->assertOptionNotExists(
			Measurement_Protocol_Settings::OPTION,
			'The option should not exist after an invalid value is rejected.'
		);
	}

	public function data_invalid_values() {
		return array(
			'not an array'        => array( 'test-secret-value' ),
			'an object'           => array(
				(object) array(
					'secretValue'     => 'test-secret-value',
					'propertyID'      => '123456789',
					'webDataStreamID' => '987654321',
					'secretID'        => 'test-secret-id',
				),
			),
			'missing secretID'    => array(
				array(
					'secretValue'     => 'test-secret-value',
					'propertyID'      => '123456789',
					'webDataStreamID' => '987654321',
				),
			),
			'non-string secretID' => array(
				array(
					'secretValue'     => 'test-secret-value',
					'propertyID'      => '123456789',
					'webDataStreamID' => '987654321',
					'secretID'        => 123,
				),
			),
		);
	}
}
