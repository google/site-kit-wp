<?php
/**
 * DashboardTest class.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Dashboard;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Admin
 */
class DashboardTest extends TestCase {

	public function test_register() {
		global $wp_meta_boxes, $current_screen;
		// Clear out any registered meta boxes
		$wp_meta_boxes = array();
		// Set the current screen to the dashboard
		$current_screen = convert_to_screen( 'dashboard' );
		$admin_id       = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$dashboard      = new Dashboard( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		// Clear registered actions on hooks related to our assertions
		remove_all_actions( 'wp_dashboard_setup' );

		$dashboard->register();

		// Bypass user authentication requirement in map_meta_cap
		add_filter(
			'map_meta_cap',
			function ( $caps, $cap ) {
				if ( Permissions::VIEW_WP_DASHBOARD_WIDGET === $cap ) {
					$caps = array_filter(
						$caps,
						function ( $cap ) {
							return 'do_not_allow' !== $cap;
						}
					);
				}

				return $caps;
			},
			10,
			2
		);

		$this->assertFalse( current_user_can( Permissions::VIEW_WP_DASHBOARD_WIDGET ) );
		wp_set_current_user( $admin_id );
		$this->assertTrue( current_user_can( Permissions::VIEW_WP_DASHBOARD_WIDGET ) );

		require_once ABSPATH . 'wp-admin/includes/dashboard.php';

		$this->assertFalse( wp_style_is( 'googlesitekit-wp-dashboard-css', 'enqueued' ) );
		$this->assertFalse( wp_script_is( 'googlesitekit-wp-dashboard', 'enqueued' ) );

		wp_dashboard_setup();

		// Check that the dashboard widget was registered
		$this->assertArrayHasKey( 'google_dashboard_widget', $wp_meta_boxes['dashboard']['normal']['core'] );

		// Check that expected assets are enqueued
		$this->assertTrue( wp_script_is( 'googlesitekit-wp-dashboard', 'enqueued' ) );
		$this->assertTrue( wp_style_is( 'googlesitekit-wp-dashboard-css', 'enqueued' ) );
	}

	/**
	 * @group dashboard_widget
	 */
	public function test_render_googlesitekit_wp_dashboard_loading_container() {
		$dashboard = new Dashboard( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$method    = new \ReflectionMethod( $dashboard, 'render_googlesitekit_wp_dashboard' );
		$method->setAccessible( true );

		ob_start();
		$method->invoke( $dashboard );
		$output = ob_get_clean();

		$dom = new \DOMDocument();
		$dom->loadHTML( $output );

		$this->assertNotEmpty( $dom->getElementById( 'js-googlesitekit-wp-dashboard' ) );

		$xpath = new \DOMXPath( $dom );
		$query = '//div[contains(concat(" ", normalize-space(@class), " "), " googlesitekit-wp-dashboard ") and contains(concat(" ", normalize-space(@class), " "), " googlesitekit-wp-dashboard-loading ")]';

		$elements = $xpath->query( $query );

		$this->assertEquals( 1, $elements->length );
	}

	/**
	 * @group dashboard_widget
	 */
	public function test_render_googlesitekit_wp_dashboard_only_search_console_connected() {
		// Only set the search console module as connected.
		$active_modules = array(
			'search-console' => $this->getMockBuilder( 'Google\Site_Kit\Core\Modules' )
				->disableOriginalConstructor()
				->setMethods( array( 'get_active_modules' ) )
				->getMock(),
		);

		$active_modules['search-console']
			->method( 'get_active_modules' )
			->willReturn(
				array(
					'search-console' => (object) array(
						'is_connected' => function () {
							return true;
						},
					),
				)
			);

		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		$dashboard = new Dashboard( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$method    = new \ReflectionMethod( $dashboard, 'render_googlesitekit_wp_dashboard' );
		$method->setAccessible( true );

		$mockAuthentication = $this->getMockBuilder( \stdClass::class )
			->addMethods( array( 'is_authenticated' ) )
			->getMock();
		$mockAuthentication->method( 'is_authenticated' )->willReturn( true );

		$authentication = new \ReflectionProperty( $dashboard, 'authentication' );
		$authentication->setAccessible( true );
		$authentication->setValue( $dashboard, $mockAuthentication );

		ob_start();
		$method->invoke( $dashboard );
		$output = ob_get_clean();

		$dom = new \DOMDocument();
		$dom->loadHTML( $output );
		$this->assertNotEmpty( $dom->getElementById( 'js-googlesitekit-wp-dashboard' ) );

		// Ensure that "googlesitekit-wp-dashboard-search_console_active_and_connected" class exists.
		$xpath    = new \DOMXPath( $dom );
		$query    = '//div[contains(concat(" ", normalize-space(@class), " "), " googlesitekit-wp-dashboard ") and contains(concat(" ", normalize-space(@class), " "), " googlesitekit-wp-dashboard-loading ")]';
		$elements = $xpath->query( $query );
		$this->assertEquals( 1, $elements->length );

		// Ensure that "googlesitekit-wp-dashboard-analytics_active_and_connected" class does not exist.
		$query    = '//div[contains(concat(" ", normalize-space(@class), " "), " googlesitekit-wp-dashboard ") and contains(concat(" ", normalize-space(@class), " "), " googlesitekit-wp-dashboard-analytics_active_and_connected ")]';
		$elements = $xpath->query( $query );
		$this->assertEquals( 0, $elements->length );

		// Ensure that "googlesitekit-preview-block googlesitekit-wp-dashboard-stats__cta" exists.
		$query    = '//div[contains(concat(" ", normalize-space(@class), " "), " googlesitekit-preview-block ") and contains(concat(" ", normalize-space(@class), " "), " googlesitekit-wp-dashboard-stats__cta ")]';
		$elements = $xpath->query( $query );
		$this->assertEquals( 1, $elements->length );
	}

	/**
	 * @group dashboard_widget
	 */
	public function test_render_googlesitekit_wp_dashboard_only_analytics4_connected() {
		// Only set the analytics-4 module as connected.
		$active_modules = array(
			'analytics-4' => $this->getMockBuilder( 'Google\Site_Kit\Core\Modules' )
				->disableOriginalConstructor()
				->setMethods( array( 'get_active_modules' ) )
				->getMock(),
		);

		$active_modules['analytics-4']
			->method( 'get_active_modules' )
			->willReturn(
				array(
					'analytics-4' => (object) array(
						'is_connected' => function () {
							return true;
						},
					),
				)
			);

		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		$dashboard = new Dashboard( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$method    = new \ReflectionMethod( $dashboard, 'render_googlesitekit_wp_dashboard' );
		$method->setAccessible( true );

		ob_start();
		$method->invoke( $dashboard );
		$output = ob_get_clean();

		$dom = new \DOMDocument();
		$dom->loadHTML( $output );

		$this->assertNotEmpty( $dom->getElementById( 'js-googlesitekit-wp-dashboard' ) );

		// Ensure that "googlesitekit-wp-dashboard-analytics_active_and_connected" class exists.
		$xpath    = new \DOMXPath( $dom );
		$query    = '//div[contains(concat(" ", normalize-space(@class), " "), " googlesitekit-wp-dashboard ") and contains(concat(" ", normalize-space(@class), " "), " googlesitekit-wp-dashboard-loading ")]';
		$elements = $xpath->query( $query );
		$this->assertEquals( 1, $elements->length );

		// Ensure that "googlesitekit-wp-dashboard-search_console_active_and_connected" class does not exist.
		$query    = '//div[contains(concat(" ", normalize-space(@class), " "), " googlesitekit-wp-dashboard ") and contains(concat(" ", normalize-space(@class), " "), " googlesitekit-wp-dashboard-search_console_active_and_connected ")]';
		$elements = $xpath->query( $query );
		$this->assertEquals( 0, $elements->length );

		// Ensure that "googlesitekit-preview-block googlesitekit-wp-dashboard-stats__cta" exists.
		$query    = '//div[contains(concat(" ", normalize-space(@class), " "), " googlesitekit-preview-block ") and contains(concat(" ", normalize-space(@class), " "), " googlesitekit-wp-dashboard-stats__cta ")]';
		$elements = $xpath->query( $query );
		$this->assertEquals( 0, $elements->length );
	}

	/**
	 * @group dashboard_widget
	 */
	public function test_render_googlesitekit_wp_dashboard_analytics4_and_search_console_connected() {
		// Set both the analytics-4 and search console modules as connected.
		$active_modules = array(
			'analytics-4'    => $this->getMockBuilder( 'Google\Site_Kit\Core\Modules' )
				->disableOriginalConstructor()
				->setMethods( array( 'get_active_modules' ) )
				->getMock(),
			'search-console' => $this->getMockBuilder( 'Google\Site_Kit\Core\Modules' )
				->disableOriginalConstructor()
				->setMethods( array( 'get_active_modules' ) )
				->getMock(),
		);

		$active_modules['analytics-4']
			->method( 'get_active_modules' )
			->willReturn(
				array(
					'analytics-4' => (object) array(
						'is_connected' => function () {
							return true;
						},
					),
				)
			);

		$active_modules['search-console']
			->method( 'get_active_modules' )
			->willReturn(
				array(
					'search-console' => (object) array(
						'is_connected' => function () {
							return true;
						},
					),
				)
			);

		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		$dashboard = new Dashboard( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$method    = new \ReflectionMethod( $dashboard, 'render_googlesitekit_wp_dashboard' );
		$method->setAccessible( true );

		ob_start();
		$method->invoke( $dashboard );
		$output = ob_get_clean();

		$dom = new \DOMDocument();
		$dom->loadHTML( $output );

		$this->assertNotEmpty( $dom->getElementById( 'js-googlesitekit-wp-dashboard' ) );

		// Ensure that both "googlesitekit-wp-dashboard-analytics_active_and_connected" and "googlesitekit-wp-dashboard-search_console_active_and_connected" classes exist.
		$xpath    = new \DOMXPath( $dom );
		$query    = '//div[contains(concat(" ", normalize-space(@class), " "), " googlesitekit-wp-dashboard ") and contains(concat(" ", normalize-space(@class), " "), " googlesitekit-wp-dashboard-loading ")]';
		$elements = $xpath->query( $query );
		$this->assertEquals( 1, $elements->length );

		// Ensure that "googlesitekit-preview-block googlesitekit-wp-dashboard-stats__cta" exists.
		$query    = '//div[contains(concat(" ", normalize-space(@class), " "), " googlesitekit-preview-block ") and contains(concat(" ", normalize-space(@class), " "), " googlesitekit-wp-dashboard-stats__cta ")]';
		$elements = $xpath->query( $query );
		$this->assertEquals( 0, $elements->length );
	}
}
