<?php
/**
 * Remote_Features_Last_SyncTest
 *
 * @package   Google\Site_Kit\Tests\Core\Remote_Features
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Remote_Features;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Remote_Features\Remote_Features_Last_Sync;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Remote_Features
 */
class Remote_Features_Last_SyncTest extends SettingsTestCase {

	public function test_get_default() {
		$setting = new Remote_Features_Last_Sync( new Options( new Context( __FILE__ ) ) );
		$setting->register();

		$this->assertSame(
			0,
			$this->get_option()
		);
	}

	/**
	 * @dataProvider data_sanitize_callback
	 * @param $input mixed
	 * @param $expected array
	 */
	public function test_sanitize_callback( $input, $expected ) {
		$setting = new Remote_Features_Last_Sync( new Options( new Context( __FILE__ ) ) );
		$setting->register();

		$this->update_option( $input );
		$actual = $this->get_option();

		$this->assertEquals( $expected, $actual );
	}

	public function data_sanitize_callback() {
		yield 'string' => array(
			'foo',
			0,
		);
		yield 'array' => array(
			array(),
			0,
		);
		yield 'integer' => array(
			100,
			100,
		);
		yield 'timestamp' => array(
			time(),
			time(),
		);
	}

	protected function get_option_name() {
		return Remote_Features_Last_Sync::OPTION;
	}
}
