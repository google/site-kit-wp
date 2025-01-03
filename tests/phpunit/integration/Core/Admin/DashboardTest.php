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
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Admin
 */
class DashboardTest extends TestCase {

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Set up the test.
	 */
	public function set_up(): void {
		parent::set_up();
		$this->admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$this->context  = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
	}

	public function test_register() {
		global $wp_meta_boxes;
		$this->get_widget_markup();

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
		$output = $this->get_widget_markup();

		$dom = new \DOMDocument();
		$dom->loadHTML( $output );

		$this->assertNotEmpty( $dom->getElementById( 'js-googlesitekit-wp-dashboard' ) );

		$xpath = new \DOMXPath( $dom );
		$query = "//div[@class[contains(., 'googlesitekit-wp-dashboard')] and @class[contains(., 'googlesitekit-wp-dashboard-loading')]]";

		$elements = $xpath->query( $query );

		$this->assertEquals( 1, $elements->length );
	}

	/**
	 * @group dashboard_widget
	 */
	public function test_render_googlesitekit_wp_dashboard_only_search_console_connected() {
		$modules = new Modules( $this->context );
		$modules->get_module( 'search-console' )->get_settings()->merge(
			array(
				'propertyID' => '123456789',
			)
		);

		$output = $this->get_widget_markup( $modules );

		$dom = new \DOMDocument();
		$dom->loadHTML( $output );
		$this->assertNotEmpty( $dom->getElementById( 'js-googlesitekit-wp-dashboard' ) );

		// Ensure that "googlesitekit-wp-dashboard-search_console_active_and_connected" class exists.
		$xpath    = new \DOMXPath( $dom );
		$query    = "//div[@class[contains(., 'googlesitekit-wp-dashboard')] and @class[contains(., 'googlesitekit-wp-dashboard-loading')]]";
		$elements = $xpath->query( $query );
		$this->assertEquals( 1, $elements->length );

		// Ensure that "googlesitekit-wp-dashboard-analytics_active_and_connected" class does not exist.
		$query    = "//div[@class[contains(., 'googlesitekit-wp-dashboard')] and @class[contains(., 'googlesitekit-wp-dashboard-analytics_active_and_connected')]]";
		$elements = $xpath->query( $query );
		$this->assertEquals( 0, $elements->length );
	}

	/**
	 * @group dashboard_widget
	 */
	public function test_render_googlesitekit_wp_dashboard_only_analytics4_connected() {
		$modules = new Modules( $this->context );
		$modules->get_module( 'analytics-4' )->get_settings()->merge(
			array(
				'accountID'       => '12345678',
				'propertyID'      => '12345678',
				'webDataStreamID' => '987654321',
				'measurementID'   => 'G-123',
				'ownerID'         => 2,
			)
		);

		$output = $this->get_widget_markup( $modules );

		$dom = new \DOMDocument();
		$dom->loadHTML( $output );

		$this->assertNotEmpty( $dom->getElementById( 'js-googlesitekit-wp-dashboard' ) );

		// Ensure that "googlesitekit-wp-dashboard-analytics_active_and_connected" class exists.
		$xpath    = new \DOMXPath( $dom );
		$query    = "//div[@class[contains(., 'googlesitekit-wp-dashboard')] and @class[contains(., 'googlesitekit-wp-dashboard-loading')]]";
		$elements = $xpath->query( $query );
		$this->assertEquals( 1, $elements->length );

		// Ensure that "googlesitekit-wp-dashboard-search_console_active_and_connected" class does not exist.
		$query    = "//div[contains(concat(' ', normalize-space(@class), ' '), ' googlesitekit-wp-dashboard ') and contains(concat(' ', normalize-space(@class), ' '), ' googlesitekit-wp-dashboard-search_console_active_and_connected ')]";
		$elements = $xpath->query( $query );
		$this->assertEquals( 0, $elements->length );

		// Ensure that "googlesitekit-preview-block googlesitekit-wp-dashboard-stats__cta" exists.
		$query    = "//div[contains(concat(' ', normalize-space(@class), ' '), ' googlesitekit-preview-block ') and contains(concat(' ', normalize-space(@class), ' '), ' googlesitekit-wp-dashboard-stats__cta ')]";
		$elements = $xpath->query( $query );
		$this->assertEquals( 0, $elements->length );
	}

	/**
	 * @group dashboard_widget
	 */
	public function test_render_googlesitekit_wp_dashboard_analytics4_and_search_console_connected() {
		$modules = new Modules( $this->context );
		$modules->get_module( 'analytics-4' )->get_settings()->merge(
			array(
				'accountID'       => '12345678',
				'propertyID'      => '12345678',
				'webDataStreamID' => '987654321',
				'measurementID'   => 'G-123',
				'ownerID'         => 2,
			)
		);
		$modules->get_module( 'search-console' )->get_settings()->merge(
			array(
				'propertyID' => '123456789',
			)
		);

		$output = $this->get_widget_markup( $modules );

		$dom = new \DOMDocument();
		$dom->loadHTML( $output );

		$this->assertNotEmpty( $dom->getElementById( 'js-googlesitekit-wp-dashboard' ) );

		// Ensure that both "googlesitekit-wp-dashboard-analytics_active_and_connected" and "googlesitekit-wp-dashboard-search_console_active_and_connected" classes exist.
		$xpath    = new \DOMXPath( $dom );
		$query    = "//div[@class[contains(., 'googlesitekit-wp-dashboard')] and @class[contains(., 'googlesitekit-wp-dashboard-loading')]]";
		$elements = $xpath->query( $query );
		$this->assertEquals( 1, $elements->length );

		// Ensure that "googlesitekit-preview-block googlesitekit-wp-dashboard-stats__cta" exists.
		$query    = "//div[contains(concat(' ', normalize-space(@class), ' '), ' googlesitekit-preview-block ') and contains(concat(' ', normalize-space(@class), ' '), ' googlesitekit-wp-dashboard-stats__cta ')]";
		$elements = $xpath->query( $query );
		$this->assertEquals( 0, $elements->length );
	}

	public function get_widget_markup( $modules = null ) {
		global $wp_meta_boxes, $current_screen;
		// Clear out any registered meta boxes
		$wp_meta_boxes = array();
		// Set the current screen to the dashboard
		$current_screen = convert_to_screen( 'dashboard' );
		$dashboard      = new Dashboard(
			$this->context,
			null,
			$modules,
		);

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

		wp_set_current_user( $this->admin_id );

		require_once ABSPATH . 'wp-admin/includes/dashboard.php';
		wp_dashboard_setup();

		ob_start();
		$widget_callback = $wp_meta_boxes[ $current_screen->id ]['normal']['core']['google_dashboard_widget']['callback'];
		$widget_callback();
		$output = ob_get_clean();

		return $output;
	}
}
