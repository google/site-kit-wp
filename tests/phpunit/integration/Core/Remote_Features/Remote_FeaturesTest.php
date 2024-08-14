<?php
/**
 * Remote_FeaturesTest
 *
 * @package   Google\Site_Kit\Tests\Core\Remote_Features
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Remote_Features;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Remote_Features\Remote_Features;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Remote_Features
 */
class Remote_FeaturesTest extends SettingsTestCase {

	public function test_get_default() {
		$setting = new Remote_Features( new Options( new Context( __FILE__ ) ) );
		$setting->register();

		$this->assertSame(
			array( 'last_updated_at' => 0 ),
			$this->get_option()
		);
	}

	public function test_update() {
		$setting = new Remote_Features( new Options( new Context( __FILE__ ) ) );
		$setting->register();

		$this->assertSame(
			array( 'last_updated_at' => 0 ),
			$this->get_option()
		);

		$update = $setting->update( array( 'testFeature' => array( 'enabled' => false ) ) );

		$this->assertEquals( array( 'enabled' => false ), $setting->get()['testFeature'] );
		$this->assertEqualsWithDelta( time(), $setting->get()['last_updated_at'], 2 );
		$this->assertTrue( $update );
	}

	/**
	 * @dataProvider data_sanitize_callback
	 * @param $input mixed
	 * @param $expected array
	 */
	public function test_sanitize_callback( $input, $expected ) {
		$setting = new Remote_Features( new Options( new Context( __FILE__ ) ) );
		$setting->register();

		$this->update_option( $input );
		$actual = $this->get_option();

		$this->assertEquals( $expected, $actual );
	}

	public function data_sanitize_callback() {
		yield 'non array' => array(
			'foo',
			array(),
		);
		yield 'array with unused keys' => array(
			array( 'testFeature' => array( 'bar' => 'baz' ) ),
			array( 'testFeature' => array( 'enabled' => false ) ),
		);
		yield 'array with enabled feature' => array(
			array( 'testFeature' => array( 'enabled' => true ) ),
			array( 'testFeature' => array( 'enabled' => true ) ),
		);
		yield 'array with multiple mixed features' => array(
			array(
				'testFeature' => array( 'enabled' => true ),
				'newFeature'  => array( 'enabled' => false ),
			),
			array(
				'testFeature' => array( 'enabled' => true ),
				'newFeature'  => array( 'enabled' => false ),
			),
		);
	}

	protected function get_option_name() {
		return Remote_Features::OPTION;
	}
}
