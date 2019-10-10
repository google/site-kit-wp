<?php
/**
 * PluginTest
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit\Plugin;

/**
 * @group Root
 */
class PluginTest extends TestCase {

	/**
	 * Plugin instance backup.
	 *
	 * @var Plugin
	 */
	protected static $backup_instance;

	public static function setUpBeforeClass() {
		parent::setUpBeforeClass();
		self::$backup_instance = Plugin::instance();
	}

	public function tearDown() {
		parent::tearDown();
		// Restore the main instance after each test.
		$this->force_set_property( 'Google\Site_Kit\Plugin', 'instance', self::$backup_instance );
	}

	public function test_context() {
		$plugin = new Plugin( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->assertInstanceOf( 'Google\Site_Kit\Context', $plugin->context() );
		// Test that the context provided is using the same file.
		$this->assertEquals( plugin_dir_path( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $plugin->context()->path() );
	}

	public function test_register() {
		$plugin = new Plugin( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		remove_all_actions( 'init' );
		remove_all_actions( 'googlesitekit_init' );
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'login_head' );
		$GLOBALS['wp_actions'] = []; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		wp_schedule_event( time(), 'daily', 'googlesitekit_cron_daily', array( 'interval' => 'daily' ) );
		wp_schedule_event( time(), 'hourly', 'googlesitekit_cron_hourly', array( 'interval' => 'hourly' ) );

		$plugin->register();

		$this->assertActionRendersGeneratorTag( 'wp_head' );
		$this->assertActionRendersGeneratorTag( 'login_head' );

		// Ensure the googlesitekit_init action is fired.
		$mock_callback = $this->getMock( 'MockClass', array( 'callback' ) );
		$mock_callback->expects( $this->once() )->method( 'callback' );
		add_action( 'googlesitekit_init', array( $mock_callback, 'callback' ) );

		$this->assertEquals( 0, did_action( 'googlesitekit_init' ) );
		do_action( 'init' );
		$this->assertEquals( 1, did_action( 'googlesitekit_init' ) );

		// Ensure googlesitekit cron events are cleared.
		$this->assertFalse( wp_get_schedule( 'googlesitekit_cron_daily', array( 'interval' => 'daily' ) ) );
		$this->assertFalse( wp_get_schedule( 'googlesitekit_cron_hourly', array( 'interval' => 'hourly' ) ) );
	}

	protected function assertActionRendersGeneratorTag( $action ) {
		ob_start();
		do_action( $action );
		$output = ob_get_clean();

		$this->assertContains(
			'<meta name="generator" content="Site Kit by Google ' . GOOGLESITEKIT_VERSION . '"',
			$output
		);
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_register() {
		$this->network_activate_site_kit();
		$plugin = new Plugin( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertTrue( $plugin->context()->is_network_mode() );
		remove_all_actions( 'network_admin_notices' );

		$plugin->register();

		ob_start();
		do_action( 'network_admin_notices' );
		$network_admin_notices = ob_get_clean();

		// Regex is case-insensitive and dotall (s) to match over multiple lines.
		$this->assertRegExp( '#<div class="notice notice-warning.*?not yet compatible.*?</div>#is', $network_admin_notices );
	}

	public function test_load_and_instance() {
		// Clear out the plugin instance instantiated during bootstrap.
		$this->force_set_property( 'Google\Site_Kit\Plugin', 'instance', null );
		$this->assertNull( Plugin::instance() );

		$this->assertTrue( Plugin::load( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$plugin = Plugin::instance();

		// Subsequent calls return false after the instance is loaded.
		$this->assertFalse( Plugin::load( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		// Instance returns the same instance every time.
		$this->assertSame( $plugin, Plugin::instance() );
	}
}
