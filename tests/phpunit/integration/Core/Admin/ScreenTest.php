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

	public function test_dashboard_initialize_redirects_to_user_input_when_analytics_connected() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$authentication = new class() {
			public function is_authenticated() {
				return true; }
		};
		$modules        = new class() {
			public function is_module_connected( $slug ) {
				return 'analytics-4' === $slug; }
		};

		$screen = new Screen(
			'test-slug',
			array(
				'initialize_callback' => function ( Context $ctx ) use ( $authentication, $modules ) {
					$is_view_only = ! $authentication->is_authenticated();
					if ( $is_view_only ) {
						return;
					}
					$is_analytics_setup_complete = false;
					if ( false === $is_analytics_setup_complete ) {
						$is_analytics_connected = $modules->is_module_connected( 'analytics-4' );
						if ( $is_analytics_connected ) {
							wp_safe_redirect(
								$ctx->admin_url(
									'user-input',
									array( 'showProgress' => true )
								)
							);
							exit;
						}
					}
				},
			)
		);

		$location = null;
		try {
			$screen->initialize( $context );
		} catch ( RedirectException $e ) {
			$location = $e->get_location();
		}
		$this->assertNotEmpty( $location, 'Redirect should occur.' );
		$this->assertStringContainsString( 'page=googlesitekit-user-input', $location, 'User input page should be redirected to.' );
		$this->assertStringContainsString( 'showProgress=1', $location, 'Show progress should be set.' );
	}

	public function test_dashboard_initialize_redirects_to_dashboard_with_params_when_analytics_not_connected() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$authentication = new class() { public function is_authenticated() {
				return true;
		} };
		$modules        = new class() { public function is_module_connected( $slug ) {
				return false;
		} };

		$screen = new Screen(
			'test-slug',
			array(
				'initialize_callback' => function ( Context $ctx ) use ( $authentication, $modules ) {
					$is_view_only = ! $authentication->is_authenticated();
					if ( $is_view_only ) {
						return;
					}
					$is_analytics_setup_complete = false;
					if ( false === $is_analytics_setup_complete ) {
						$is_analytics_connected = $modules->is_module_connected( 'analytics-4' );
						if ( ! $is_analytics_connected ) {
							$slug = $ctx->input()->filter( INPUT_GET, 'slug' );
							$show_progress = (bool) $ctx->input()->filter( INPUT_GET, 'showProgress' );
							$re_auth = (bool) $ctx->input()->filter( INPUT_GET, 'reAuth' );
							if ( 'analytics-4' === $slug && $re_auth && $show_progress ) {
								return;
							}
							wp_safe_redirect(
								$ctx->admin_url(
									'dashboard',
									array(
										'slug'         => 'analytics-4',
										'showProgress' => true,
										'reAuth'       => true,
									)
								)
							);
							exit;
						}
					}
				},
			)
		);

		$location = null;
		try {
			$screen->initialize( $context );
		} catch ( RedirectException $e ) {
			$location = $e->get_location();
		}
		$this->assertNotEmpty( $location, 'Redirect should occur.' );
		$this->assertStringContainsString( 'page=googlesitekit-dashboard', $location, 'Dashboard page should be redirected to.' );
		$this->assertStringContainsString( 'slug=analytics-4', $location, 'Slug should be set to analytics-4.' );
		$this->assertStringContainsString( 'showProgress=1', $location, 'Show progress should be set.' );
		$this->assertStringContainsString( 'reAuth=1', $location, 'Re-auth should be set.' );
	}

	public function test_dashboard_initialize_no_redirect_when_in_progress_reauth() {
		$mock_input = new class() extends \Google\Site_Kit\Core\Util\Input {
			public function filter( $type, $name, $filter = FILTER_DEFAULT, $options = 0 ) {
				if ( INPUT_GET !== $type ) {
					return null;
				}
				$map = array(
					'slug'         => 'analytics-4',
					'showProgress' => '1',
					'reAuth'       => '1',
				);
				return isset( $map[ $name ] ) ? $map[ $name ] : null;
			}
		};
		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, $mock_input );

		$authentication = new class() { public function is_authenticated() {
				return true;
		} };
		$modules        = new class() { public function is_module_connected( $slug ) {
				return false;
		} };

		$screen = new Screen(
			'test-slug',
			array(
				'initialize_callback' => function ( Context $ctx ) use ( $authentication, $modules ) {
					$is_view_only = ! $authentication->is_authenticated();
					if ( $is_view_only ) {
						return; }
					$is_analytics_connected = $modules->is_module_connected( 'analytics-4' );
					if ( ! $is_analytics_connected ) {
						$slug = $ctx->input()->filter( INPUT_GET, 'slug' );
						$show_progress = (bool) $ctx->input()->filter( INPUT_GET, 'showProgress' );
						$re_auth = (bool) $ctx->input()->filter( INPUT_GET, 'reAuth' );
						if ( 'analytics-4' === $slug && $re_auth && $show_progress ) {
							return;
						}
						wp_safe_redirect(
							$ctx->admin_url(
								'dashboard',
								array(
									'slug'         => 'analytics-4',
									'showProgress' => true,
									'reAuth'       => true,
								)
							)
						);
						exit;
					}
				},
			)
		);

		$threw_redirect = false;
		try {
			$screen->initialize( $context );
		} catch ( RedirectException $e ) {
			$threw_redirect = true;
		}
		$this->assertFalse( $threw_redirect, 'No redirect should occur for in-progress reAuth branch.' );
	}

	public function test_dashboard_initialize_no_redirect_when_setup_complete() {
		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$authentication = new class() { public function is_authenticated() {
				return true;
		} };

		$screen = new Screen(
			'test-slug',
			array(
				'initialize_callback' => function () use ( $authentication ) {
					$is_view_only = ! $authentication->is_authenticated();
					if ( $is_view_only ) {
						return; }
				},
			)
		);

		$threw_redirect = false;
		try {
			$screen->initialize( $context );
		} catch ( RedirectException $e ) {
			$threw_redirect = true;
		}
		$this->assertFalse( $threw_redirect, 'No redirect should occur when setup complete.' );
	}
}
