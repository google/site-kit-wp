<?php
/**
 * ScriptTest
 *
 * @package   Google\Site_Kit\Tests\Core\Assets
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Assets;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Assets
 */
class ScriptTest extends TestCase {

	public function set_up() {
		parent::set_up();

		wp_scripts()->registered = array();
		wp_scripts()->queue      = array();
	}

	public function test_get_handle() {
		$script = new Script( 'test-handle', array() );

		$this->assertEquals( 'test-handle', $script->get_handle() );
	}

	public function test_register() {
		$script = new Script( 'test-handle', array() );

		$this->assertFalse( wp_script_is( 'test-handle', 'registered' ) );
		$this->assertFalse( wp_scripts()->get_data( 'test-handle', 'script_execution' ) );
		$this->assertFalse( wp_scripts()->get_data( 'test-handle', 'group' ) );

		$script->register( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertTrue( wp_script_is( 'test-handle', 'registered' ) );
		$this->assertFalse( wp_scripts()->get_data( 'test-handle', 'script_execution' ) );
		// Scripts are registered in footer by default; footer scripts are added to group 1
		$this->assertEquals( 1, wp_scripts()->get_data( 'test-handle', 'group' ) );
	}

	public function test_register_with_before_print_callback() {
		$invocations = array();
		$callback    = function () use ( &$invocations ) {
			$invocations[] = func_get_args();
		};
		$script      = new Script(
			'test-handle',
			array(
				'before_print' => $callback,
			)
		);

		$script->before_print();
		$this->assertCount( 1, $invocations );
	}

	public function test_register_with_execution() {
		$script = new Script(
			'test-handle',
			array(
				'execution' => 'async',
			)
		);
		$this->assertFalse( wp_scripts()->get_data( 'test-handle', 'script_execution' ) );

		$script->register( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEquals( 'async', wp_scripts()->get_data( 'test-handle', 'script_execution' ) );
	}

	public function test_register_with_in_footer() {
		$script = new Script(
			'test-handle',
			array(
				'in_footer' => false, // true by default
			)
		);
		// Scripts are registered in footer by default; footer scripts are added to group 1
		$this->assertFalse( wp_scripts()->get_data( 'test-handle', 'group' ) );

		$script->register( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertFalse( wp_scripts()->get_data( 'test-handle', 'group' ) );
	}

	public function test_registered_src() {
		$src    = home_url( 'test.js' );
		$script = new Script(
			'test-handle',
			array(
				'src' => $src,
			)
		);

		$script->register( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$expected_src = add_query_arg( 'ver', GOOGLESITEKIT_VERSION, $src );
		$mock         = $this->getMockBuilder( 'MockClass' )->setMethods( array( 'callback' ) )->getMock();
		$mock->expects( $this->once() )->method( 'callback' )->with( $expected_src, 'test-handle' )->willReturn( '' );

		add_filter( 'script_loader_src', array( $mock, 'callback' ), 10, 2 );

		wp_scripts()->do_item( 'test-handle' );
	}

	public function test_enqueue() {
		$script = new Script( 'test-handle', array() );
		$this->assertFalse( wp_script_is( 'test-handle', 'enqueued' ) );

		$script->enqueue();

		// Must be registered first
		$this->assertFalse( wp_script_is( 'test-handle', 'enqueued' ) );

		$script->register( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$script->enqueue();

		$this->assertTrue( wp_script_is( 'test-handle', 'enqueued' ) );
	}
}
