<?php
/**
 * OptimizeTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Optimize;
use Google\Site_Kit\Modules\Optimize\Settings;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Owner_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class OptimizeTest extends TestCase {
	use Module_With_Settings_ContractTests;
	use Module_With_Owner_ContractTests;

	public function test_register() {
		remove_all_filters( 'googlesitekit_gtag_opt' );
		remove_all_actions( 'wp_footer' );
		remove_all_actions( 'amp_post_template_footer' );
		remove_all_filters( 'amp_post_template_data' );
		$optimize = new Optimize( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$optimize->register();

		$this->assertTrue( has_filter( 'googlesitekit_gtag_opt' ) );
		$this->assertTrue( has_action( 'wp_footer' ) );
		$this->assertTrue( has_action( 'amp_post_template_footer' ) );
		$this->assertTrue( has_filter( 'amp_post_template_data' ) );
	}

	public function test_is_connected() {
		$optimize = new Optimize( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertFalse( $optimize->is_connected() );

		$optimize->get_settings()->merge( array( 'optimizeID' => 'GTM-XXXXX' ) );

		$this->assertTrue( $optimize->is_connected() );
	}

	public function test_on_deactivation() {
		$optimize = new Optimize( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options  = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options->set( Settings::OPTION, 'test-value' );

		$optimize->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
	}

	public function test_get_datapoints() {
		$optimize = new Optimize( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(),
			$optimize->get_datapoints()
		);
	}

	/**
	 * @return Module_With_Settings
	 */
	protected function get_module_with_settings() {
		return new Optimize( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Owner
	 */
	protected function get_module_with_owner() {
		return new Optimize( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}
}
