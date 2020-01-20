<?php
/**
 * Class Google\Site_Kit\Tests\Core\Modules\Module_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

class Module_SettingsTest extends SettingsTestCase {

	public function test_merge() {
		$settings = new FakeModuleSettings( new Options( new Context( __FILE__ ) ) );
		$settings->register();

		// Check default.
		$this->assertEquals(
			array( 'defaultKey' => 'default-value' ),
			get_option( $this->get_option_name() )
		);

		$settings->merge(
			array(
				'defaultKey'       => 'updated-value',
				'non-existent-key' => 'test-value',
			)
		);

		// Ensure only existing data is updated.
		$this->assertEqualSetsWithIndex(
			array( 'defaultKey' => 'updated-value' ),
			get_option( $this->get_option_name() )
		);

		// Anything returned by get() will be updated, not just defaults.
		$settings->set( array( 'newKey' => 'new-value' ) );
		$this->assertEqualSetsWithIndex(
			array(
				'defaultKey' => 'default-value',
				'newKey'     => 'new-value',
			),
			get_option( $this->get_option_name() )
		);

		// Null values are ignored.
		$settings->merge( array( 'defaultKey' => null ) );
		$this->assertEquals( 'default-value', get_option( $this->get_option_name() )['defaultKey'] );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return FakeModuleSettings::OPTION;
	}
}
