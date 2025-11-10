<?php
/**
 * ScreenTest
 *
 * @package   Google\Site_Kit\Tests\Core\Admin
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 * */

namespace Google\Site_Kit\Tests\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Screen;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\Exception\RedirectException;

/**
 * @group Admin
 */
class ScreenTest extends TestCase {

	public function test_get_slug() {
		$screen = new Screen( 'test-slug', array() );

		$this->assertEquals( 'test-slug', $screen->get_slug(), 'Screen slug should match the provided slug.' );
	}

	public function test_add() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertFalse( is_user_logged_in(), 'No user should be logged in initially.' );

		// No args, no user
		$screen = new Screen( 'test-slug', array() );
		$this->assertEquals( '', $screen->add( $context ), 'Screen should not be added when no user is logged in.' );
		// With callback, no user
		$screen = new Screen(
			'test-slug',
			array(
				'render_callback' => function () {
				},
			)
		);
		$this->assertEquals( '', $screen->add( $context ), 'Screen should not be added when no user is logged in, even with callback.' );

		// Login basic user
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		// No args, with user
		$screen = new Screen( 'test-slug', array() );
		$this->assertEquals( '', $screen->add( $context ), 'Screen should not be added when user lacks permissions.' );
		// With callback, user without permission
		$this->assertFalse( user_can( $user_id, 'manage_options' ), 'Basic user should not have manage_options capability.' );
		$this->assertEquals( '', $screen->add( $context ), 'Screen should not be added when user lacks permissions, even with callback.' );

		// Login admin
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		$this->assertTrue( user_can( $admin_id, 'manage_options' ), 'Administrator should have manage_options capability.' );
		// No callback, with user, with permission
		$this->assertEquals( 'toplevel_page_test-slug', $screen->add( $context ), 'Screen should be added when admin user is logged in.' );

		// With callback, with user, with permission
		$screen = new Screen(
			'test-slug',
			array(
				'render_callback' => function () {
				},
			)
		);
		$this->assertEquals( 'toplevel_page_test-slug', $screen->add( $context ), 'Screen should be added when admin user is logged in with callback.' );

		$screen = new Screen(
			'test-slug',
			array(
				'render_callback' => function () {
				},
				'parent_slug'     => 'test-parent-slug',
			)
		);
		$this->assertEquals( 'toplevel_page_test-slug', $screen->add( $context ), 'Screen should be added when admin user is logged in with callback and parent slug.' );
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

		$this->assertCount( 1, $invocations, 'Initialize callback should be called exactly once.' );
		$this->assertEquals( array( $context ), $invocations[0], 'Initialize callback should receive the context as argument.' );
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

		$this->assertFalse( wp_style_is( 'googlesitekit-admin-css', 'enqueued' ), 'Admin CSS should not be enqueued initially.' );

		$assets = new Assets( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$screen->enqueue_assets( $assets );

		$this->assertTrue( wp_style_is( 'googlesitekit-admin-css', 'enqueued' ), 'Admin CSS should be enqueued after calling enqueue_assets.' );
		$this->assertCount( 1, $invocations, 'Enqueue callback should be called exactly once.' );
		$this->assertEquals( array( $assets ), $invocations[0], 'Enqueue callback should receive the assets as argument.' );
	}
}
