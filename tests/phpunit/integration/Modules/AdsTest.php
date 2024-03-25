<?php
/**
 * AdsTest
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Ads;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Ads
 */
class AdsTest extends TestCase {

	public function test_magic_methods() {
		$ads = new Ads( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEquals( 'ads', $ads->slug );
		$this->assertEquals( 'Ads', $ads->name );
		$this->assertEquals( 'https://google.com/ads', $ads->homepage );
	}

	public function test_is_connected_when_ads_conversion_id_is_set() {
		$ads = new Ads( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertFalse( $ads->is_connected() );

		$ads->get_settings()->set( array( 'adsConversionID' => 'AW-123456789' ) );

		$this->assertTrue( $ads->is_connected() );
	}

	public function test_settings_reset_on_deactivation() {
		$ads = new Ads( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$ads->get_settings()->set( array( 'adsConversionID' => 'AW-123456789' ) );

		$ads->on_deactivation();

		$ads_settings = $ads->get_settings()->get();

		$this->assertFalse( $ads_settings );
	}

	public function test_get_debug_fields() {
		$ads = new Ads( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$ads->get_settings()->set( array( 'adsConversionID' => 'AW-123456789' ) );

		$this->assertEqualSets(
			array(
				'ads_conversion_id',
			),
			array_keys( $ads->get_debug_fields() )
		);
	}

}
