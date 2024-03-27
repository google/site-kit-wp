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
use Google\Site_Kit\Core\Tags\GTag;
use Google\Site_Kit\Modules\Ads;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
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

	/**
	 * @dataProvider template_redirect_data_provider
	 *
	 * @param array $settings
	 */
	public function test_template_redirect( $settings ) {
		$ads = new Ads( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		remove_all_actions( 'wp_enqueue_scripts' );
		( new GTag() )->register();

		wp_scripts()->registered = array();
		wp_scripts()->queue      = array();
		wp_scripts()->done       = array();

		remove_all_actions( 'template_redirect' );
		$ads->register();
		$ads->get_settings()->set( $settings );

		do_action( 'template_redirect' );

		$head_html = $this->capture_action( 'wp_head' );
		$this->assertNotEmpty( $head_html );

		if ( empty( $settings['adsConversionID'] ) ) {
			$this->assertFalse( has_action( 'googlesitekit_setup_gtag' ) );
			$this->assertStringNotContainsString(
				'gtag("config", "AW-123456789")',
				$head_html
			);
		} else {
			$this->assertTrue( has_action( 'googlesitekit_setup_gtag' ) );
			$this->assertStringContainsString(
				'gtag("config", "AW-123456789")',
				$head_html
			);
		}
	}

	public function template_redirect_data_provider() {
		return array(
			'empty ads conversion ID' => array( array( 'adsConversionID' => '' ) ),
			'valid ads conversion ID' => array( array( 'adsConversionID' => 'AW-123456789' ) ),
		);
	}

}
