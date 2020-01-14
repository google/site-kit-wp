<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Optimize\Settings
 *
 * @package   Google\Site_Kit\Tests\Modules\Optimize
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Optimize;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Optimize\Settings;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group Optimize
 */
class SettingsTest extends SettingsTestCase {

	public function test_get_default() {
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$this->assertEqualSetsWithIndex(
			array(
				'optimizeID'        => '',
				'ampExperimentJSON' => '',
			),
			get_option( Settings::OPTION )
		);
	}

	public function test_legacy_options() {
		$legacy_option = array(
			'AMPExperimentJson' => 'test-amp-experiment-json-1',
			'ampExperimentJson' => 'test-amp-experiment-json-2',
			'optimize_id'       => 'test-optimize-id-snake',
			'optimizeId'        => 'test-optimize-id-camel',
		);
		update_option( Settings::OPTION, $legacy_option );
		$settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );
		$settings->register();

		$option = $settings->get();
		$this->assertArraySubset(
			array(
				// The first legacy key for the same new key wins.
				'ampExperimentJSON'     => 'test-amp-experiment-json-1',
				'optimizeID'            => 'test-optimize-id-snake',
			),
			$option
		);

		foreach ( array_keys( $legacy_option ) as $legacy_key ) {
			$this->assertArrayNotHasKey( $legacy_key, $option );
		}
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}
}
