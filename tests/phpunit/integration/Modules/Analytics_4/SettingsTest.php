<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics\Settings as Analytics_Settings;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit\Tests\Core\Storage\Setting_With_Owned_Keys_ContractTests;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group Analytics
 */
class SettingsTest extends SettingsTestCase {

	use Setting_With_Owned_Keys_ContractTests;

	public function test_get_default() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$this->assertEqualSetsWithIndex(
			array(
				'accountID'       => '',
				'adsConversionID' => '',
				'propertyID'      => '',
				'webDataStreamID' => '',
				'measurementID'   => '',
				'useSnippet'      => true,
				'ownerID'         => 0,
			),
			get_option( Settings::OPTION )
		);
	}

	public function test_proxies_ua_settings() {
		$options     = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$ua_settings = new Analytics_Settings( $options );
		$settings    = new Settings( $options );
		$settings->register();

		$ga4_settings = get_option( Settings::OPTION );
		$this->assertEquals( '', $ga4_settings['accountID'] );
		$this->assertEquals( '', $ga4_settings['adsConversionID'] );

		$ua_settings->merge(
			array(
				'accountID'       => '12345',
				'adsConversionID' => 'AW-424242424242',
			)
		);
		$ga4_settings = get_option( Settings::OPTION );

		$this->assertEquals( '12345', $ga4_settings['accountID'] );
		$this->assertEquals( 'AW-424242424242', $ga4_settings['adsConversionID'] );

		$settings->merge(
			array(
				'accountID'       => '99999',
				'adsConversionID' => 'AW-929292929292',
			)
		);
		$ga4_settings = get_option( Settings::OPTION );

		$this->assertEquals( '12345', $ga4_settings['accountID'] );
		$this->assertEquals( 'AW-424242424242', $ga4_settings['adsConversionID'] );
	}

	protected function get_testcase() {
		return $this;
	}

	protected function get_setting_with_owned_keys() {
		return new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}
}
