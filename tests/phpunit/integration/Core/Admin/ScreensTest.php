<?php
/**
 * Class Google\Site_Kit\Tests\Core\Admin\ScreensTest
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Tests\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Screens;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Intents\Intents;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Ads\Ads_Conversion_Tracking_Intent;
use Google\Site_Kit\Tests\Core\Intents\FakeIntent;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\MutableInput;
use WPDieException;

/**
 * ScreensTest.
 *
 * @group Admin
 */
class ScreensTest extends TestCase {

	use Fake_Site_Connection_Trait;

	/**
	 * Screens object.
	 *
	 * @var Screens
	 */
	private $screens;

	/**
	 * Registers screens and triggers the admin menu hook.
	 */
	private function register_screens() {
		$this->screens->register();
		do_action( 'admin_menu' );
	}

	/**
	 * Gets the submenu slugs for the Site Kit admin menu.
	 *
	 * The submenu array key can vary in tests because `Screen::add()` stores
	 * the top-level menu slug in a static local variable.
	 *
	 * @return array<string>|null Site Kit submenu item slugs, or null if not found.
	 */
	private function get_site_kit_submenu_slugs() {
		global $submenu;

		foreach ( $submenu as $submenu_items ) {
			$submenu_slugs = wp_list_pluck( $submenu_items, 2 );

			if ( in_array( 'googlesitekit-dashboard', $submenu_slugs, true ) ) {
				return $submenu_slugs;
			}
		}

		return null;
	}

	public function set_up() {
		parent::set_up();

		$context  = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );

		// Fake setup and authentication for access to dashboard.
		$this->fake_proxy_site_connection();
		remove_all_filters( 'googlesitekit_setup_complete' );
		$authentication = new Authentication( $context );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_token( array( 'access_token' => 'test-access-token' ) );

		$assets        = new Assets( $context );
		$this->screens = new Screens( $context, $assets );
	}


	public function data_removal_of_admin_notices() {
		return array(
			'regular' => array( 'admin_notices' ),
			'network' => array( 'network_admin_notices' ),
			'all'     => array( 'all_admin_notices' ),
		);
	}

	/**
	 * @dataProvider data_removal_of_admin_notices
	 */
	public function test_removal_of_admin_notices( $hookname ) {
		// Set current hook suffix to fake Site Kit admin page.
		$GLOBALS['hook_suffix'] = 'fake_sitekit_admin_page';
		$reflection_property    = new \ReflectionProperty( 'Google\Site_Kit\Core\Admin\Screens', 'screens' );
		$reflection_property->setAccessible( true );
		$reflection_property->setValue(
			$this->screens,
			array(
				$GLOBALS['hook_suffix'] => true,
			)
		);

		$output_notice = function () {
			echo '<div class="notice notice-error">Error!</div>';
		};

		add_action( $hookname, $output_notice, 10 );
		add_action( $hookname, $output_notice, -100 );

		$this->screens->register();

		add_action( $hookname, $output_notice, 11 );
		add_action( $hookname, $output_notice, -99 );

		ob_start();
		do_action( $hookname );
		$this->assertEmpty( ob_get_clean(), 'Admin notices should be removed on Site Kit admin pages.' );
	}

	/**
	 * @dataProvider data_removal_of_admin_notices
	 */
	public function test_removal_of_admin_notices_outside_sitekit( $hookname ) {
		$output_notice = function () {
			echo '<div class="notice notice-error">Error!</div>';
		};

		add_action( $hookname, $output_notice, 10 );
		add_action( $hookname, $output_notice, -100 );

		$this->screens->register();

		add_action( $hookname, $output_notice, 11 );
		add_action( $hookname, $output_notice, -99 );

		ob_start();
		do_action( $hookname );
		$this->assertNotEmpty( ob_get_clean(), 'Admin notices should not be removed outside Site Kit admin pages.' );
	}


	public function data_menu_order() {
		return array(
			'typical plugin scenario'             => array(
				array(
					'index.php',
					'third-party-plugin',
					'edit.php',
					'options-general.php',
					'googlesitekit-dashboard',
				),
				array(
					'index.php',
					'googlesitekit-dashboard',
					'third-party-plugin',
					'edit.php',
					'options-general.php',
				),
			),
			'different plugin slug'               => array(
				array(
					'index.php',
					'third-party-plugin',
					'edit.php',
					'options-general.php',
					'googlesitekit-dashboard-splash',
				),
				array(
					'index.php',
					'googlesitekit-dashboard-splash',
					'third-party-plugin',
					'edit.php',
					'options-general.php',
				),
			),
			'custom menu item before Dashboard'   => array(
				array(
					'third-party-host',
					'index.php',
					'third-party-plugin',
					'edit.php',
					'options-general.php',
					'googlesitekit-dashboard',
				),
				array(
					'third-party-host',
					'index.php',
					'googlesitekit-dashboard',
					'third-party-plugin',
					'edit.php',
					'options-general.php',
				),
			),
			'edge case: dashboard after Site Kit' => array(
				array(
					'googlesitekit-dashboard',
					'third-party-plugin',
					'index.php',
					'edit.php',
					'options-general.php',
				),
				array(
					'third-party-plugin',
					'index.php',
					'googlesitekit-dashboard',
					'edit.php',
					'options-general.php',
				),
			),
		);
	}

	/**
	 * @dataProvider data_menu_order
	 */
	public function test_menu_order( $given_menu_order, $expected_order ) {
		$this->screens->register();

		// Imitate WordPress core running these filters.
		if ( apply_filters( 'custom_menu_order', false ) ) {
			$menu_order = apply_filters( 'menu_order', $given_menu_order );
		}

		$this->assertEquals( $expected_order, $menu_order, 'Menu order should match expected order for Site Kit.' );
	}

	public function test_feature_discovery_screen_is_registered_when_feature_flag_is_enabled() {
		$this->enable_feature( 'featureDiscoveryHub' );

		$this->register_screens();

		$registered_screens = $this->force_get_property( $this->screens, 'screens' );

		$this->assertArrayHasKey( 'site-kit_page_googlesitekit-features', $registered_screens, 'Feature Discovery screen should be registered when the feature flag is enabled.' );
	}

	public function test_feature_discovery_screen_is_not_registered_when_feature_flag_is_disabled() {
		add_filter(
			'googlesitekit_is_feature_enabled',
			function ( $enabled, $feature_name ) {
				if ( 'featureDiscoveryHub' === $feature_name ) {
					return false;
				}

				return $enabled;
			},
			10,
			2
		);

		$this->register_screens();

		$registered_screens = $this->force_get_property( $this->screens, 'screens' );

		$this->assertArrayNotHasKey( 'site-kit_page_googlesitekit-features', $registered_screens, 'Feature Discovery screen should not be registered when the feature flag is disabled.' );
	}

	public function test_feature_discovery_screen_is_not_registered_for_non_admin_users() {
		$this->enable_feature( 'featureDiscoveryHub' );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_id = $this->factory()->user->create();
		$assets  = new Assets( $context );

		wp_set_current_user( $user_id );
		$this->screens = new Screens( $context, $assets );

		$this->register_screens();

		$registered_screens = $this->force_get_property( $this->screens, 'screens' );

		$this->assertArrayNotHasKey( 'site-kit_page_googlesitekit-features', $registered_screens, 'Feature Discovery screen should not be registered for non-admin users.' );
	}

	public function test_feature_discovery_screen_menu_is_placed_between_dashboard_and_settings() {
		$this->enable_feature( 'featureDiscoveryHub' );

		$this->register_screens();

		$submenu_slugs = $this->get_site_kit_submenu_slugs();

		$this->assertNotNull( $submenu_slugs, 'Site Kit submenu should be registered.' );
		$dashboard_index = array_search( 'googlesitekit-dashboard', $submenu_slugs, true );
		$features_index  = array_search( 'googlesitekit-features', $submenu_slugs, true );
		$settings_index  = array_search( 'googlesitekit-settings', $submenu_slugs, true );

		$this->assertGreaterThanOrEqual( 3, count( $submenu_slugs ), 'Site Kit submenu should include Dashboard, Add Features, and Settings items.' );
		$this->assertNotFalse( $dashboard_index, 'Dashboard submenu item should be present.' );
		$this->assertNotFalse( $features_index, 'Add Features submenu item should be present.' );
		$this->assertNotFalse( $settings_index, 'Settings submenu item should be present.' );
		$this->assertGreaterThan( $dashboard_index, $features_index, 'Add Features should appear after Dashboard.' );
		$this->assertGreaterThan( $features_index, $settings_index, 'Settings should appear after Add Features.' );
	}

	/**
	 * Set the `isAnalyticsSetupComplete` flag for the current user.
	 *
	 * @param bool|null $is_complete Value for isAnalyticsSetupComplete (true/false/null).
	 */
	private function set_analytics_setup_complete( $is_complete ) {
		global $wpdb;
		$meta_key = $wpdb->get_blog_prefix() . 'googlesitekit_initial_setup';
		$settings = get_user_meta( get_current_user_id(), $meta_key, true );
		$settings = is_array( $settings ) ? $settings : array();
		update_user_meta( get_current_user_id(), $meta_key, array_merge( $settings, array( 'isAnalyticsSetupComplete' => $is_complete ) ) );
	}

	/**
	 * Set the `hasSitePurposeAnswer` flag for the current user.
	 *
	 * @param bool|null $has_answer Value for hasSitePurposeAnswer (true/false/null).
	 */
	private function set_has_site_purpose_answer( $has_answer ) {
		global $wpdb;
		$meta_key = $wpdb->get_blog_prefix() . 'googlesitekit_initial_setup';
		$settings = get_user_meta( get_current_user_id(), $meta_key, true );
		$settings = is_array( $settings ) ? $settings : array();
		update_user_meta( get_current_user_id(), $meta_key, array_merge( $settings, array( 'hasSitePurposeAnswer' => $has_answer ) ) );
	}

	/**
	 * Helper to load dashboard screen (simulate load- hook) capturing redirect.
	 *
	 * @return \Google\Site_Kit\Tests\Exception\RedirectException|null
	 */
	private function load_dashboard_screen() {
		$this->screens->register();
		do_action( 'admin_menu' );

		foreach ( array_keys( $this->force_get_property( $this->screens, 'screens' ) ) as $hook_suffix ) {
			if ( strpos( $hook_suffix, 'googlesitekit-dashboard' ) !== false ) {
				try {
					do_action( "load-{$hook_suffix}" );
				} catch ( \Google\Site_Kit\Tests\Exception\RedirectException $e ) {
					return $e;
				}
				return null;
			}
		}
		return null;
	}

	public function test_dashboard_initialize() {
		$this->set_analytics_setup_complete( false );

		$redirect = $this->load_dashboard_screen();

		$this->assertNull( $redirect, 'Should not redirect.' );
	}

	public function test_dashboard_initialize__no_redirect_when_setup_complete_with_setupFlowRefresh_enabled() {
		$this->enable_feature( 'setupFlowRefresh' );
		$this->set_analytics_setup_complete( true );

		$redirect = $this->load_dashboard_screen();

		$this->assertNull( $redirect, 'Should not redirect when Analytics setup is complete.' );
	}

	public function test_dashboard_initialize__redirect_to_key_metrics_setup_when_site_purpose_is_unanswered() {
		$this->enable_feature( 'setupFlowRefresh' );
		$this->set_analytics_setup_complete( true );
		$this->set_has_site_purpose_answer( false );

		$redirect = $this->load_dashboard_screen();

		$this->assertNotNull( $redirect, 'Should redirect when the site purpose question is unanswered.' );
		$this->assertStringContainsString( 'page=googlesitekit-key-metrics-setup', $redirect->get_location(), 'Redirect should include key-metrics-setup page.' );
		$this->assertStringContainsString( 'showProgress=true', $redirect->get_location(), 'Redirect should include showProgress param.' );
	}

	public function test_dashboard_initialize__no_redirect_when_site_purpose_is_answered() {
		$this->enable_feature( 'setupFlowRefresh' );
		$this->set_analytics_setup_complete( true );
		$this->set_has_site_purpose_answer( true );

		$redirect = $this->load_dashboard_screen();

		$this->assertNull( $redirect, 'Should not redirect when the site purpose question is answered.' );
	}

	public function test_dashboard_initialize__redirect_to_analytics_setup_screen_when_setup_incomplete_and_ga4_not_connected_with_setupFlowRefresh_enabled() {
		$this->enable_feature( 'setupFlowRefresh' );
		$this->set_analytics_setup_complete( false );

		$redirect = $this->load_dashboard_screen();

		$this->assertNotNull( $redirect, 'Should redirect to the Analytics setup screen when setup is incomplete and Analytics is not connected.' );
		$this->assertStringContainsString( 'page=googlesitekit-dashboard', $redirect->get_location(), 'Redirect should include dashboard page.' );
		$this->assertStringContainsString( 'slug=analytics-4', $redirect->get_location(), 'Redirect should include analytics-4 slug.' );
		$this->assertStringContainsString( 'showProgress=true', $redirect->get_location(), 'Redirect should include showProgress.' );
		$this->assertStringContainsString( 'reAuth=true', $redirect->get_location(), 'Redirect should include reAuth.' );
	}

	public function test_dashboard_initialize__analytics_setup_screen_does_not_redirect_when_setup_incomplete_with_setupFlowRefresh_enabled() {
		$this->enable_feature( 'setupFlowRefresh' );
		$this->set_analytics_setup_complete( false );

		// Recreate Screens with MutableInput context so query params are accessible.
		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$assets         = new Assets( $context );
		$authentication = new Authentication( $context );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_token( array( 'access_token' => 'test-access-token' ) );

		$this->screens = new Screens( $context, $assets, new Modules( $context ), $authentication );

		$_GET['slug']         = 'analytics-4';
		$_GET['reAuth']       = '1';
		$_GET['showProgress'] = '1';

		$redirect = $this->load_dashboard_screen();

		$this->assertNull( $redirect, 'Analytics setup screen should not redirect.' );
	}

	public function test_dashboard_initialize__analytics_setup_screen_does_not_redirect_when_setup_incomplete_and_ga4_connected_with_setupFlowRefresh_enabled() {
		$this->enable_feature( 'setupFlowRefresh' );
		$this->set_analytics_setup_complete( false );

		// Recreate Screens with MutableInput context so query params are accessible.
		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		$assets         = new Assets( $context );
		$authentication = new Authentication( $context );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_token( array( 'access_token' => 'test-access-token' ) );

		$this->screens = new Screens( $context, $assets, new Modules( $context ), $authentication );

		$_GET['slug']         = 'analytics-4';
		$_GET['reAuth']       = '1';
		$_GET['showProgress'] = '1';

		// Activate the `analytics-4` module.
		update_option( Modules::OPTION_ACTIVE_MODULES, array( 'analytics-4' ) );

		// Provide minimal settings to consider it connected.
		update_option(
			'googlesitekit_analytics-4_settings',
			array(
				'accountID'       => '123',
				'propertyID'      => '456',
				'webDataStreamID' => '789',
				'measurementID'   => 'G-ABC',
			)
		);

		$redirect = $this->load_dashboard_screen();

		$this->assertNull( $redirect, 'Analytics setup screen should not redirect.' );
	}

	public function test_dashboard_initialize__redirect_to_key_metrics_setup_screen_when_setup_incomplete_and_ga4_connected_with_setupFlowRefresh_enabled() {
		$this->enable_feature( 'setupFlowRefresh' );
		$this->set_analytics_setup_complete( false );

		// Activate the `analytics-4` module.
		update_option( Modules::OPTION_ACTIVE_MODULES, array( 'analytics-4' ) );

		// Provide minimal settings to consider it connected.
		update_option(
			'googlesitekit_analytics-4_settings',
			array(
				'accountID'       => '123',
				'propertyID'      => '456',
				'webDataStreamID' => '789',
				'measurementID'   => 'G-ABC',
			)
		);

		$redirect = $this->load_dashboard_screen();

		$this->assertNotNull( $redirect, 'Should redirect to the Key Metrics setup screen when setup is incomplete and Analytics is connected.' );
		$this->assertStringContainsString( 'page=googlesitekit-key-metrics-setup', $redirect->get_location(), 'Redirect should include key-metrics-setup page.' );
		$this->assertStringContainsString( 'showProgress=true', $redirect->get_location(), 'Redirect should include showProgress param.' );
	}

	/**
	 * Rebuilds the Screens instance so query parameters are readable and the given intents are used.
	 *
	 * @param Intents $intents Intents instance to resolve the intent argument against.
	 */
	private function set_up_screens_with_intents( Intents $intents ) {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );

		$this->screens = new Screens( $context, new Assets( $context ), new Modules( $context ), new Authentication( $context ), $intents );
	}

	/**
	 * Makes the given editor a view-only dashboard user and the current user.
	 *
	 * @param int $user_id Editor to switch to.
	 */
	private function switch_to_view_only_user( $user_id ) {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		( new Module_Sharing_Settings( new Options( $context ) ) )->set(
			array(
				'analytics-4' => array(
					'sharedRoles' => array( 'editor' ),
					'management'  => 'all_admins',
				),
			)
		);

		// The permissions registered at plugin load stay bound to the admin, so this user needs their own.
		remove_all_filters( 'map_meta_cap' );
		remove_all_filters( 'user_has_cap' );
		wp_set_current_user( $user_id );

		$user_options    = new User_Options( $context, $user_id );
		$authentication  = new Authentication( $context, null, $user_options );
		$modules         = new Modules( $context, null, $user_options, $authentication );
		$dismissed_items = new Dismissed_Items( $user_options );

		( new Permissions( $context, $authentication, $modules, $user_options, $dismissed_items ) )->register();

		// Until the splash is dismissed a shared role lands on the splash screen instead of the dashboard.
		$dismissed_items->add( 'shared_dashboard_splash' );
	}

	/**
	 * Renders the dashboard screen and returns its markup.
	 *
	 * @return string Rendered screen markup, or an empty string if the screen was not registered.
	 */
	private function render_dashboard_screen() {
		// The plugin registered its own Screens at plugin load, and that one would render a second dashboard onto the same hook.
		remove_all_actions( 'admin_menu' );

		$this->screens->register();
		do_action( 'admin_menu' );

		foreach ( array_keys( $this->force_get_property( $this->screens, 'screens' ) ) as $hook_suffix ) {
			if ( false === strpos( $hook_suffix, 'googlesitekit-dashboard' ) ) {
				continue;
			}

			ob_start();

			try {
				do_action( $hook_suffix );
			} finally {
				// wp_die() throws out of do_action(), and the buffer has to close either way.
				$output = ob_get_clean();
			}

			return $output;
		}

		return '';
	}

	/**
	 * Builds an Intents instance holding the Ads conversion tracking intent.
	 *
	 * @return Intents Intents instance.
	 */
	private function get_intents_with_ads_intent() {
		$intents = new Intents();
		$intents->register_intent( new Ads_Conversion_Tracking_Intent() );

		return $intents;
	}

	public function test_dashboard_render__intent_and_code_fill_the_intent_attributes() {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->set_up_screens_with_intents( $this->get_intents_with_ads_intent() );

		$_GET['intent'] = Ads_Conversion_Tracking_Intent::INTENT_ID;
		$_GET['code']   = 'abc123';

		$output = $this->render_dashboard_screen();

		$this->assertStringContainsString( 'data-intent-slug="ads-conversion-tracking"', $output, 'The intent slug should be rendered.' );
		$this->assertStringContainsString( 'data-intent-code="abc123"', $output, 'The intent code should be rendered.' );
	}

	public function data_requests_without_a_usable_intent() {
		return array(
			'no intent argument'    => array( array( 'code' => 'abc123' ) ),
			'no code argument'      => array( array( 'intent' => Ads_Conversion_Tracking_Intent::INTENT_ID ) ),
			'intent nothing claims' => array(
				array(
					'intent' => 'not-a-registered-intent',
					'code'   => 'abc123',
				),
			),
		);
	}

	/**
	 * @dataProvider data_requests_without_a_usable_intent
	 */
	public function test_dashboard_render__intent_attributes_stay_empty( $query_args ) {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->set_up_screens_with_intents( $this->get_intents_with_ads_intent() );

		foreach ( $query_args as $key => $value ) {
			$_GET[ $key ] = $value;
		}

		$output = $this->render_dashboard_screen();

		$this->assertStringContainsString( 'id="js-googlesitekit-main-dashboard"', $output, 'The ordinary dashboard should still render.' );
		$this->assertStringContainsString( 'data-intent-slug=""', $output, 'The intent slug should be empty.' );
		$this->assertStringContainsString( 'data-intent-code=""', $output, 'The intent code should be empty.' );
	}

	public function test_dashboard_render__intent_attributes_stay_empty_for_an_unavailable_intent() {
		$intents = new Intents();
		$intents->register_intent( new FakeIntent( 'unavailable-intent', false ) );
		$this->set_up_screens_with_intents( $intents );

		$_GET['intent'] = 'unavailable-intent';
		$_GET['code']   = 'abc123';

		$output = $this->render_dashboard_screen();

		$this->assertStringContainsString( 'data-intent-slug=""', $output, 'An intent that reports itself unavailable should not be rendered.' );
		$this->assertStringContainsString( 'data-intent-code=""', $output, 'An intent that reports itself unavailable should not bring its code along.' );
	}

	public function test_dashboard_render__intent_attributes_stay_empty_while_the_ads_feature_flag_is_off() {
		$this->set_up_screens_with_intents( $this->get_intents_with_ads_intent() );

		$_GET['intent'] = Ads_Conversion_Tracking_Intent::INTENT_ID;
		$_GET['code']   = 'abc123';

		$output = $this->render_dashboard_screen();

		$this->assertStringContainsString( 'data-intent-slug=""', $output, 'The Ads intent should not be rendered while adsConversionTrackingIntent is off.' );
		$this->assertStringContainsString( 'data-intent-code=""', $output, 'The Ads intent code should not be rendered while adsConversionTrackingIntent is off.' );
	}

	public function test_dashboard_render__intent_attributes_stay_empty_for_a_view_only_user() {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->switch_to_view_only_user( $this->factory()->user->create( array( 'role' => 'editor' ) ) );

		$this->assertTrue( current_user_can( Permissions::VIEW_DASHBOARD ), 'A view-only user should reach the dashboard.' );
		$this->assertFalse( current_user_can( Permissions::SETUP ), 'A view-only user should not be able to set up Site Kit.' );

		$this->set_up_screens_with_intents( $this->get_intents_with_ads_intent() );

		$_GET['intent'] = Ads_Conversion_Tracking_Intent::INTENT_ID;
		$_GET['code']   = 'abc123';

		$output = $this->render_dashboard_screen();

		$this->assertStringContainsString( 'data-view-only="1"', $output, 'The dashboard should render in view-only mode.' );
		$this->assertStringContainsString( 'data-intent-slug=""', $output, 'A view-only user should get no intent slug.' );
		$this->assertStringContainsString( 'data-intent-code=""', $output, 'A view-only user should get no intent code.' );
	}

	public function test_dashboard_render__script_in_the_code_argument_is_escaped() {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->set_up_screens_with_intents( $this->get_intents_with_ads_intent() );

		$_GET['intent'] = Ads_Conversion_Tracking_Intent::INTENT_ID;
		$_GET['code']   = '"><script>alert(1)</script>';

		$output = $this->render_dashboard_screen();

		$this->assertStringContainsString( 'data-intent-code="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"', $output, 'The payload should read as text inside the attribute.' );
		$this->assertStringNotContainsString( '<script>alert(1)</script>', $output, 'The payload should never reach the page as markup.' );
	}

	public function test_dashboard_render__script_in_the_intent_argument_renders_nothing() {
		$this->enable_feature( 'adsConversionTrackingIntent' );
		$this->set_up_screens_with_intents( $this->get_intents_with_ads_intent() );

		$_GET['intent'] = '"><script>alert(1)</script>';
		$_GET['code']   = 'abc123';

		$output = $this->render_dashboard_screen();

		$this->assertStringContainsString( 'data-intent-slug=""', $output, 'A payload nothing claims should leave the slug empty.' );
		$this->assertStringNotContainsString( '<script>alert(1)</script>', $output, 'The payload should never reach the page as markup.' );
	}

	public function test_dashboard_render__module_slug_with_reauth_still_fills_the_setup_attribute() {
		update_option( Modules::OPTION_ACTIVE_MODULES, array( 'analytics-4' ) );

		$this->set_up_screens_with_intents( new Intents() );

		$_GET['slug']   = 'analytics-4';
		$_GET['reAuth'] = 'true';

		$output = $this->render_dashboard_screen();

		$this->assertStringContainsString( 'data-setup-module-slug="analytics-4"', $output, 'An active module slug should still reach the page.' );
	}

	public function test_dashboard_render__inactive_module_slug_still_ends_the_request() {
		$this->set_up_screens_with_intents( new Intents() );

		$_GET['slug']   = 'analytics-4';
		$_GET['reAuth'] = 'true';

		try {
			$this->render_dashboard_screen();
			$this->fail( 'An inactive module slug should end the request.' );
		} catch ( WPDieException $e ) {
			$this->assertStringContainsString( 'has not been activated', $e->getMessage(), 'The 403 message should say the module is not activated.' );
		}
	}
}
