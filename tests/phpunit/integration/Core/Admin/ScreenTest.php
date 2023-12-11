<?php
/**
 * ScreenTest
 *
 * @package   Google\Site_Kit\Tests\Core\Admin
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Screen;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Admin
 */
class ScreenTest extends TestCase {

	public function test_get_slug() {
		$screen = new Screen( 'test-slug', array() );

		$this->assertEquals( 'test-slug', $screen->get_slug() );
	}

	public function test_add() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertFalse( is_user_logged_in() );

		// No args, no user
		$screen = new Screen( 'test-slug', array() );
		$this->assertEquals( '', $screen->add( $context ) );
		// With callback, no user
		$screen = new Screen(
			'test-slug',
			array(
				'render_callback' => function () {
				},
			)
		);
		$this->assertEquals( '', $screen->add( $context ) );

		// Login basic user
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		// No args, with user
		$screen = new Screen( 'test-slug', array() );
		$this->assertEquals( '', $screen->add( $context ) );
		// With callback, user without permission
		$this->assertFalse( user_can( $user_id, 'manage_options' ) );
		$this->assertEquals( '', $screen->add( $context ) );

		// Login admin
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		$this->assertTrue( user_can( $admin_id, 'manage_options' ) );
		// No callback, with user, with permission
		$this->assertEquals( 'toplevel_page_test-slug', $screen->add( $context ) );

		// With callback, with user, with permission
		$screen = new Screen(
			'test-slug',
			array(
				'render_callback' => function () {
				},
			)
		);
		$this->assertEquals( 'toplevel_page_test-slug', $screen->add( $context ) );

		$screen = new Screen(
			'test-slug',
			array(
				'render_callback' => function () {
				},
				'parent_slug'     => 'test-parent-slug',
			)
		);
		$this->assertEquals( 'toplevel_page_test-slug', $screen->add( $context ) );
	}

	public function test_initialize() {
		$invocations = array();
		$callback    = function () use ( &$invocations ) {
			$invocations[] = func_get_args();
		};
		$screen      = new Screen(
			'test-slug',
			array(
				'initialize_callback' => $callback,
			)
		);
		$context     = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$screen->initialize( $context );

		$this->assertCount( 1, $invocations );
		$this->assertEquals( array( $context ), $invocations[0] );
	}

	public function test_enqueue_assets() {
		wp_dequeue_style( 'googlesitekit-admin-css' );

		$invocations = array();
		$callback    = function () use ( &$invocations ) {
			$invocations[] = func_get_args();
		};
		$screen      = new Screen(
			'test-slug',
			array(
				'enqueue_callback' => $callback,
			)
		);

		$this->assertFalse( wp_style_is( 'googlesitekit-admin-css', 'enqueued' ) );

		$assets = new Assets( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$screen->enqueue_assets( $assets );

		$this->assertTrue( wp_style_is( 'googlesitekit-admin-css', 'enqueued' ) );
		$this->assertCount( 1, $invocations );
		$this->assertEquals( array( $assets ), $invocations[0] );
	}
}
