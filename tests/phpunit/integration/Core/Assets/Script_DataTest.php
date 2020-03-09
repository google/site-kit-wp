<?php
/**
 * Script_DataTest
 *
 * @package   Google\Site_Kit\Tests\Core\Assets
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Assets;

use Google\Site_Kit\Core\Assets\Script_Data;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Assets
 */
class Script_DataTest extends TestCase {

	public function setUp() {
		parent::setUp();

		wp_scripts()->registered = array();
		wp_scripts()->queue      = array();
	}

	public function test_get_handle() {
		$script = new Script_Data( 'test-handle', array() );

		$this->assertEquals( 'test-handle', $script->get_handle() );
	}

	public function test_get_data_callback_before_print() {
		$data   = array( 'random_data' => uniqid() );
		$script = new Script_Data(
			'test-handle',
			array(
				'global'        => 'testGlobal',
				'data_callback' => function () use ( $data ) {
					return $data;
				},
			) 
		);
		$script->register();
		$this->assertEmpty( wp_scripts()->get_data( 'test-handle', 'data' ) );

		$script->before_print();

		$this->assertContains(
			'var testGlobal = ' . wp_json_encode( $data ),
			wp_scripts()->get_data( 'test-handle', 'data' )
		);
	}
}
