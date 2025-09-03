<?php
/**
 * PluginTest
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 * */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Plugin;

/**
 * @group Root
 */
class PluginTest extends TestCase {

	use RestTestTrait;

	/**
	 * Plugin instance backup.
	 *
	 * @var Plugin
	 */
	protected static $backup_instance;

	public static function wpSetUpBeforeClass() {
		self::$backup_instance = Plugin::instance();
	}

	public function tear_down() {
		parent::tear_down();
		// Restore the main instance after each test.
		$this->force_set_property( 'Google\Site_Kit\Plugin', 'instance', self::$backup_instance );
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
	}

	public function test_context() {
		$plugin = new Plugin( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->assertInstanceOf( 'Google\Site_Kit\Context', $plugin->context(), 'Plugin context should be an instance of Context class' );
		// Test that the context provided is using the same file.
		$this->assertEquals( plugin_dir_path( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), $plugin->context()->path(), 'Plugin context path should match the plugin directory path' );
	}

	// Ensure we're supplying the correct minimum version of PHP
	// and WordPress in our plugin file's header.
	public function test_plugin_data() {
		// RequiresPHP and RequiresWP are only available in WordPress 5.3+,
		// so only make assertions with those fields if they exist.

		$plugin_data = get_plugin_data( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		if ( array_key_exists( 'RequiresPHP', $plugin_data ) ) {
			$this->assertEquals( $plugin_data['RequiresPHP'], '7.4', 'Plugin should require PHP 7.4' );
		}
		if ( array_key_exists( 'RequiresWP', $plugin_data ) ) {
			$this->assertEquals( $plugin_data['RequiresWP'], '5.2', 'Plugin should require WordPress 5.2' );
		}

		// These fields are available in all versions of WordPress we support,
		// so check for them unconditionally.
		$this->assertEquals( $plugin_data['Name'], 'Site Kit by Google', 'Plugin name should be "Site Kit by Google"' );
	}

	public function test_register() {
		$plugin = new Plugin( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		remove_all_actions( 'init' );
		remove_all_actions( 'googlesitekit_init' );
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'login_head' );
		unset( $GLOBALS['wp_actions']['googlesitekit_init'] );

		$plugin->register();

		$this->assertActionRendersGeneratorTag( 'wp_head' );
		$this->assertActionRendersGeneratorTag( 'login_head' );

		// Ensure the googlesitekit_init action is fired.
		$mock_callback = $this->getMockBuilder( 'MockClass' )->setMethods( array( 'callback' ) )->getMock();
		$mock_callback->expects( $this->once() )->method( 'callback' );
		add_action( 'googlesitekit_init', array( $mock_callback, 'callback' ) );

		$this->assertEquals( 0, did_action( 'googlesitekit_init' ), 'googlesitekit_init action should not have been triggered yet' );
		do_action( 'init' );
		$this->assertEquals( 1, did_action( 'googlesitekit_init' ), 'googlesitekit_init action should be triggered exactly once after init' );
	}

	public function test_register__init_keyMetrics() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		remove_all_actions( 'init' );

		$plugin = new Plugin( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$plugin->register();
		do_action( 'init' );
		$this->register_rest_routes();

		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/' . REST_Routes::REST_ROOT . '/core/user/data/user-input-settings', $routes, 'REST API should register the user-input-settings endpoint' );
	}

	protected function assertActionRendersGeneratorTag( $action ) {
		ob_start();
		do_action( $action );
		$output = ob_get_clean();

		$this->assertStringContainsString(
			'<meta name="generator" content="Site Kit by Google ' . GOOGLESITEKIT_VERSION . '"',
			$output,
			sprintf( 'Action %s should render the Site Kit generator meta tag', $action )
		);
	}

	/**
	 * @group ms-required
	 */
	public function test_network_mode_register() {
		$this->network_activate_site_kit();

		// Force enable network mode.
		add_filter( 'googlesitekit_is_network_mode', '__return_true' );

		$plugin = new Plugin( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertTrue( $plugin->context()->is_network_mode(), 'Plugin should be in network mode' );
		remove_all_actions( 'network_admin_notices' );

		$plugin->register();

		ob_start();
		do_action( 'network_admin_notices' );
		$network_admin_notices = ob_get_clean();

		// Regex is case-insensitive and dotall (s) to match over multiple lines.
		$this->assertMatchesRegularExpression(
			'#<div class="notice notice-warning.*?not yet offer.*?</div>#is',
			$network_admin_notices,
			'Network admin notices should contain a warning about network mode'
		);
	}

	public function test_load_and_instance() {
		// Clear out the plugin instance instantiated during bootstrap.
		$this->force_set_property( 'Google\Site_Kit\Plugin', 'instance', null );
		$this->assertNull( Plugin::instance(), 'Plugin instance should be null after resetting' );

		$this->assertTrue( Plugin::load( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), 'Plugin::load() should return true on first call' );
		$plugin = Plugin::instance();

		// Subsequent calls return false after the instance is loaded.
		$this->assertFalse( Plugin::load( GOOGLESITEKIT_PLUGIN_MAIN_FILE ), 'Plugin::load() should return false on subsequent calls' );
		// Instance returns the same instance every time.
		$this->assertSame( $plugin, Plugin::instance(), 'Plugin::instance() should return the same instance every time' );
	}
}
