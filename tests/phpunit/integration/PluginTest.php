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
use Google\Site_Kit\Core\Authentication\Connected_Proxy_URL;
use Google\Site_Kit\Core\Authentication\Disconnected_Reason;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Migration_1_123_0;
use Google\Site_Kit\Core\Util\Migration_1_185_0;
use Google\Site_Kit\Core\Util\Migration_N_E_X_T;
use Google\Site_Kit\Modules\Ads\Settings as Ads_Settings;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_Settings;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings as Reader_Revenue_Manager_Settings;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings as Sign_In_With_Google_Settings;
use Google\Site_Kit\Plugin;

/**
 * @group Root
 */
class PluginTest extends TestCase {

	use Fake_Site_Connection_Trait;
	use RestTestTrait;
	use UserAuthenticationTrait;

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

	public function test_register__registers_the_intent_routes() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		remove_all_actions( 'init' );

		$plugin = new Plugin( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$plugin->register();
		do_action( 'init' );
		$this->register_rest_routes();

		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/google-site-kit/v1/core/intents/data/intent', $routes, 'The plugin should register the `core/intents/data/intent` route.' );
		$this->assertArrayHasKey( '/google-site-kit/v1/core/intents/data/complete-intent', $routes, 'The plugin should register the `core/intents/data/complete-intent` route.' );
	}

	public function test_register__runs_every_migration_in_order() {
		remove_all_actions( 'init' );
		remove_all_actions( 'admin_init' );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new Options( $context );

		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$this->fake_proxy_site_connection();
		$this->set_user_access_token( $user_id, 'valid-auth-token' );

		// Store old-format data for every migration from 1.123.0 to 1.185.0.
		$options->set( Migration_1_185_0::DB_VERSION_OPTION, '1.122.0' );
		$options->set( Connected_Proxy_URL::OPTION, $context->get_canonical_home_url() );
		$options->set( Modules::OPTION_ACTIVE_MODULES, array( 'analytics' ) );
		$options->set(
			Module_Sharing_Settings::OPTION,
			array(
				'analytics' => array(
					'sharedRoles' => array( 'editor' ),
					'management'  => 'owner',
				),
			)
		);
		$options->set(
			Migration_1_123_0::LEGACY_ANALYTICS_OPTION,
			array(
				'accountID'        => '12345678',
				'adsConversionID'  => 'AW-123456789',
				'trackingDisabled' => array( 'loggedinUsers' ),
			)
		);
		$options->set(
			Analytics_Settings::OPTION,
			array(
				'accountID'                            => '',
				'propertyID'                           => '987654321',
				'availableAudiences'                   => array( array( 'name' => 'properties/987654321/audiences/1' ) ),
				'availableAudiencesLastSyncedAt'       => 1678886400,
				'audienceSegmentationSetupCompletedBy' => $user_id,
			)
		);
		$options->set(
			Sign_In_With_Google_Settings::OPTION,
			array(
				'oneTapEnabled'    => true,
				'oneTapOnAllPages' => false,
			)
		);
		$options->set(
			Reader_Revenue_Manager_Settings::OPTION,
			array(
				'contentPolicyStatus' => array(
					'contentPolicyState' => 'CONTENT_POLICY_VIOLATION_GRACE_PERIOD',
					'policyInfoLink'     => 'https://example.com/policy-info',
				),
			)
		);

		$plugin = new Plugin( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$plugin->register();

		// The migrations are added to `admin_init` in the `init` callback.
		do_action( 'init' );
		do_action( 'admin_init' );

		// `Migration_N_E_X_T` runs only once `n.e.x.t` is replaced with the release version.
		$last_db_version = version_compare( Migration_N_E_X_T::DB_VERSION, Migration_1_185_0::DB_VERSION, '>' )
			? Migration_N_E_X_T::DB_VERSION
			: Migration_1_185_0::DB_VERSION;

		$this->assertSame( $last_db_version, $options->get( Migration_1_185_0::DB_VERSION_OPTION ), 'The database version should be the last migration version.' );

		$this->assertSame( array( 'analytics', 'analytics-4', 'ads' ), $options->get( Modules::OPTION_ACTIVE_MODULES ), 'The 1.123.0 and 1.129.0 migrations should activate Analytics 4 and Ads.' );
		$this->assertSame(
			array(
				'sharedRoles' => array( 'editor' ),
				'management'  => 'owner',
			),
			$options->get( Module_Sharing_Settings::OPTION )['analytics-4'],
			'The 1.123.0 migration should copy the `analytics` sharing settings to `analytics-4`.'
		);

		$analytics_settings = $options->get( Analytics_Settings::OPTION );
		$this->assertSame( '12345678', $analytics_settings['accountID'], 'The 1.123.0 migration should copy the legacy `accountID`.' );
		$this->assertSame( array( 'loggedinUsers' ), $analytics_settings['trackingDisabled'], 'The 1.123.0 migration should copy the legacy `trackingDisabled`.' );
		$this->assertTrue( empty( $analytics_settings['adsConversionID'] ), 'The 1.129.0 migration should remove the `adsConversionID` from the Analytics settings.' );
		$this->assertArrayNotHasKey( 'availableAudiences', $analytics_settings, 'The 1.150.0 migration should remove the audience keys from the Analytics settings.' );

		$this->assertSame( 'AW-123456789', $options->get( Ads_Settings::OPTION )['conversionID'], 'The 1.129.0 migration should move the conversion ID to the Ads settings.' );
		$this->assertSame( $user_id, $options->get( Audience_Settings::OPTION )['audienceSegmentationSetupCompletedBy'], 'The 1.150.0 migration should move the audience keys to the Audience settings.' );

		$sign_in_with_google_settings = $options->get( Sign_In_With_Google_Settings::OPTION );
		$this->assertFalse( $sign_in_with_google_settings['oneTapEnabled'], 'The 1.163.0 migration should disable One Tap when it was limited to login pages.' );
		$this->assertArrayNotHasKey( 'oneTapOnAllPages', $sign_in_with_google_settings, 'The 1.163.0 migration should remove `oneTapOnAllPages`.' );

		$rrm_settings = $options->get( Reader_Revenue_Manager_Settings::OPTION );
		$this->assertSame( 'CONTENT_POLICY_VIOLATION_GRACE_PERIOD', $rrm_settings['contentPolicyState'], 'The 1.177.0 migration should flatten `contentPolicyStatus`.' );
		$this->assertArrayNotHasKey( 'contentPolicyStatus', $rrm_settings, 'The 1.177.0 migration should remove `contentPolicyStatus`.' );

		$this->assertTrue(
			( new Connected_Proxy_URL( $options ) )->matches_url( $context->get_canonical_home_url() ),
			'The 1.185.0 migration should encode the connected proxy URL.'
		);
		$this->assertFalse(
			( new User_Options( $context, $user_id ) )->get( Disconnected_Reason::OPTION ),
			'The site should stay connected, since the connected proxy URL is encoded before `Authentication::check_connected_proxy_url()` reads it.'
		);

		$migrated_options = array(
			Migration_1_185_0::DB_VERSION_OPTION,
			Connected_Proxy_URL::OPTION,
			Modules::OPTION_ACTIVE_MODULES,
			Module_Sharing_Settings::OPTION,
			Analytics_Settings::OPTION,
			Audience_Settings::OPTION,
			Ads_Settings::OPTION,
			Sign_In_With_Google_Settings::OPTION,
			Reader_Revenue_Manager_Settings::OPTION,
		);
		$stored_values    = array_map( array( $options, 'get' ), $migrated_options );

		do_action( 'admin_init' );

		$this->assertSame( $stored_values, array_map( array( $options, 'get' ), $migrated_options ), 'A second `admin_init` should change nothing.' );
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
