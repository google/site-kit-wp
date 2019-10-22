<?php
/**
 * OptimizeTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Optimize;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class OptimizeTest extends TestCase {

	public function test_register() {
		$this->markTestSkipped( 'All register method implementation currently depends on get_data.' );
		$optimize = new Optimize( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$optimize->register();
	}

	public function test_is_connected() {
		$optimize = new Optimize( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Depends on get_data
		$this->assertFalse( $optimize->is_connected() );
	}

	public function test_prepare_info_for_js() {
		$optimize = new Optimize( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$info = $optimize->prepare_info_for_js();

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
			),
			array_keys( $info )
		);
		$this->assertEquals( 'optimize', $info['slug'] );
		$this->assertArrayHasKey( 'optimizeID', $info['settings'] );
		$this->assertArrayHasKey( 'ampClientIDOptIn', $info['settings'] );
		$this->assertArrayHasKey( 'ampExperimentJson', $info['settings'] );
	}

	public function test_on_deactivation() {
		$optimize = new Optimize( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options  = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options->set( Optimize::OPTION, 'test-value' );
		$this->assertEquals( 'test-value', $options->get( Optimize::OPTION ) );

		$optimize->on_deactivation();

		$this->assertFalse( $options->get( Optimize::OPTION ) );
	}

	public function test_get_datapoints() {
		$optimize = new Optimize( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'optimize-id',
				'amp-experiment-json',
				'amp-client-id-opt-in',
				'settings',
			),
			$optimize->get_datapoints()
		);
	}
}
