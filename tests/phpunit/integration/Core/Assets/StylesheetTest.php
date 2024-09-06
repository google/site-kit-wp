<?php
/**
 * StylesheetTest
 *
 * @package   Google\Site_Kit\Tests\Core\Assets
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Assets;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Stylesheet;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Assets
 */
class StylesheetTest extends TestCase {

	public function set_up() {
		parent::set_up();

		wp_styles()->registered = array();
		wp_styles()->queue      = array();
	}

	public function test_get_handle() {
		$style = new Stylesheet( 'test-handle', array() );

		$this->assertEquals( 'test-handle', $style->get_handle() );
	}

	public function test_register() {
		$style = new Stylesheet( 'test-handle', array() );

		$this->assertFalse( wp_style_is( 'test-handle', 'registered' ) );

		$style->register( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertTrue( wp_style_is( 'test-handle', 'registered' ) );
	}

	public function test_register_with_before_print_callback() {
		$invocations = array();
		$callback    = function () use ( &$invocations ) {
			$invocations[] = func_get_args();
		};
		$style       = new Stylesheet(
			'test-handle',
			array(
				'before_print' => $callback,
			)
		);

		$style->before_print();
		$this->assertCount( 1, $invocations );
	}

	public function test_registered_src() {
		$src   = home_url( 'test.css' );
		$style = new Stylesheet(
			'test-handle',
			array(
				'src' => $src,
			)
		);

		$style->register( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$expected_src = add_query_arg( 'ver', GOOGLESITEKIT_VERSION, $src );
		$mock         = $this->getMockBuilder( 'MockClass' )->setMethods( array( 'callback' ) )->getMock();
		$mock->expects( $this->once() )
			->method( 'callback' )
			->with( $expected_src, 'test-handle' )->willReturn( '' );

		add_filter( 'style_loader_src', array( $mock, 'callback' ), 10, 2 );

		wp_styles()->do_item( 'test-handle' );
	}

	public function test_registered_media() {
		$style = new Stylesheet(
			'test-handle',
			array(
				'src'   => home_url( 'test.css' ),
				'media' => 'test-media',
			)
		);

		$style->register( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$mock = $this->getMockBuilder( 'MockClass' )->setMethods( array( 'callback' ) )->getMock();
		$mock->expects( $this->once() )
			->method( 'callback' )
			->with( $this->isType( 'string' ), 'test-handle', $this->isType( 'string' ), 'test-media' );

		add_filter( 'style_loader_tag', array( $mock, 'callback' ), 10, 4 );

		wp_styles()->do_item( 'test-handle' );
	}

	public function test_enqueue() {
		$style = new Stylesheet( 'test-handle', array() );
		$this->assertFalse( wp_style_is( 'test-handle', 'enqueued' ) );

		$style->enqueue();

		// Must be registered first
		$this->assertFalse( wp_style_is( 'test-handle', 'enqueued' ) );

		$style->register( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$style->enqueue();

		$this->assertTrue( wp_style_is( 'test-handle', 'enqueued' ) );
	}
}
