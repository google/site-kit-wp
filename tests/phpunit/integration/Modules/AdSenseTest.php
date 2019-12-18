<?php
/**
 * AdSenseTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Screen;
use Google\Site_Kit\Core\Modules\Module_With_Setting;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Screen_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Setting_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class AdSenseTest extends TestCase {
	use Module_With_Scopes_ContractTests;
	use Module_With_Screen_ContractTests;
	use Module_With_Setting_ContractTests;

	public function test_register() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_auth_scopes' );
		remove_all_filters( 'googlesitekit_module_screens' );

		$this->assertEmpty( apply_filters( 'googlesitekit_auth_scopes', array() ) );
		$this->assertEmpty( apply_filters( 'googlesitekit_module_screens', array() ) );

		$adsense->register();

		$this->assertNotEmpty( apply_filters( 'googlesitekit_auth_scopes', array() ) );
		$this->assertContains( $adsense->get_screen(), apply_filters( 'googlesitekit_module_screens', array() ) );
	}

	public function test_get_module_scope() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertContains(
			'https://www.googleapis.com/auth/adsense',
			$adsense->get_scopes()
		);
	}

	public function test_prepare_info_for_js() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$info = $adsense->prepare_info_for_js();

		$this->assertEqualSets(
			array(
				'slug',
				'name',
				'description',
				'cta',
				'sort',
				'homepage',
				'learnMore',
				'group',
				'feature',
				'module_tags',
				'required',
				'autoActivate',
				'internal',
				'screenID',
				'hasSettings',
				'provides',
				'settings',
				'accountURL',
				'signupURL',
				'rootURL',
			),
			array_keys( $info )
		);

		$this->assertEquals( 'adsense', $info['slug'] );
		$this->assertStringStartsWith( 'https://www.google.com/adsense/', $info['accountURL'] );
		$this->assertStringStartsWith( 'https://www.google.com/adsense/', $info['signupURL'] );
		$this->assertStringStartsWith( 'https://www.google.com/adsense/', $info['rootURL'] );
	}

	public function test_is_connected() {
		$adsense  = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options  = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$settings = $options->get( AdSense::OPTION );

		$this->assertFalse( $settings['setupComplete'] );
		$this->assertFalse( $adsense->is_connected() );

		$options->set( AdSense::OPTION, array( 'setupComplete' => true ) );
		$this->assertTrue( $adsense->is_connected() );
	}

	public function test_on_deactivation() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$options->set( AdSense::OPTION, 'test-value' );
		$this->assertOptionExists( AdSense::OPTION );

		$adsense->on_deactivation();

		$this->assertOptionNotExists( AdSense::OPTION );
	}

	public function test_get_datapoints() {
		$adsense = new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'connection',
				'account-id',
				'client-id',
				'use-snippet',
				'account-status',
				'account-url',
				'reports-url',
				'notifications',
				'accounts',
				'alerts',
				'clients',
				'urlchannels',
				'earnings',
				'setup-complete',
			),
			$adsense->get_datapoints()
		);
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module|Module_With_Screen
	 */
	protected function get_module_with_screen() {
		return new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module|Module_With_Setting
	 */
	protected function get_module_with_setting() {
		return new AdSense( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}
}
