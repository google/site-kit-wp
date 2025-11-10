<?php
/**
 * Class Google\Site_Kit\Tests\Core\Admin\ScreensTest
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Screens;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;

/**
 * ScreensTest
 *
 * @group Admin
 */
class ScreensTest extends TestCase {

	use Fake_Site_Connection_Trait;

	/**
	 * Screens object
	 *
	 * @var Screens
	 */
	private $screens;

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

	/**
	 * Set the initial setup setting for the current user.
	 *
	 * @param bool|null $complete Value for isAnalyticsSetupComplete (true/false/null).
	 */
	private function set_initial_setup_setting( $complete ) {
		global $wpdb;
		$meta_key = $wpdb->get_blog_prefix() . 'googlesitekit_initial_setup';
		update_user_meta( get_current_user_id(), $meta_key, array( 'isAnalyticsSetupComplete' => $complete ) );
	}

	/**
	 * Helper to load dashboard screen (simulate load- hook) capturing redirect.
	 *
	 * @return \Google\Site_Kit\Tests\Exception\RedirectException|null
	 */
	private function load_dashboard_screen() {
		$this->screens->register();
		do_action( 'admin_menu' );

		foreach ( $this->force_get_property( $this->screens, 'screens' ) as $hook_suffix => $screen ) {
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

	public function test_dashboard_initialize_no_redirect_feature_flag_disabled() {
		// Feature flag disabled by default.
		$this->set_initial_setup_setting( false );
		$redirect = $this->load_dashboard_screen();
		$this->assertNull( $redirect, 'Should not redirect when feature flag disabled.' );
	}

	public function test_dashboard_initialize_no_redirect_when_setup_complete() {
		$reset = $this->enable_feature( 'setupFlowRefresh' );
		$this->set_initial_setup_setting( true );
		$redirect = $this->load_dashboard_screen();
		$this->assertNull( $redirect, 'Should not redirect when analytics setup complete.' );
		$reset();
	}

	public function test_dashboard_initialize_redirect_to_key_metrics_when_incomplete_and_connected() {
		$reset = $this->enable_feature( 'setupFlowRefresh' );
		$this->set_initial_setup_setting( false );
		// Activate & fake connect analytics-4.
		update_option( \Google\Site_Kit\Core\Modules\Modules::OPTION_ACTIVE_MODULES, array( 'analytics-4' ) );
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
		$this->assertNotNull( $redirect, 'Should redirect when incomplete and analytics connected.' );
		$this->assertStringContainsString( 'page=googlesitekit-key-metrics-setup', $redirect->get_location(), 'Redirect should go to key-metrics-setup.' );
		$this->assertStringContainsString( 'showProgress=true', $redirect->get_location(), 'Redirect should include showProgress param.' );
		$reset();
	}

	public function test_dashboard_initialize_redirect_to_dashboard_with_params_when_incomplete_and_not_connected() {
		$reset = $this->enable_feature( 'setupFlowRefresh' );
		$this->set_initial_setup_setting( false );
		delete_option( \Google\Site_Kit\Core\Modules\Modules::OPTION_ACTIVE_MODULES );
		$redirect = $this->load_dashboard_screen();
		$this->assertNotNull( $redirect, 'Should redirect when incomplete and analytics not connected.' );
		$this->assertStringContainsString( 'page=googlesitekit-dashboard', $redirect->get_location(), 'Redirect should stay on dashboard.' );
		$this->assertStringContainsString( 'slug=analytics-4', $redirect->get_location(), 'Redirect should include analytics slug.' );
		$this->assertStringContainsString( 'showProgress=true', $redirect->get_location(), 'Redirect should include showProgress.' );
		$this->assertStringContainsString( 'reAuth=true', $redirect->get_location(), 'Redirect should include reAuth.' );
		$reset();
	}

	public function test_dashboard_initialize_no_redirect_with_exemption_query_params() {
		$reset = $this->enable_feature( 'setupFlowRefresh' );
		$this->set_initial_setup_setting( false );
		delete_option( \Google\Site_Kit\Core\Modules\Modules::OPTION_ACTIVE_MODULES );
		// Recreate Screens with MutableInput context so query params are read.
		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new \Google\Site_Kit\Tests\MutableInput() );
		$assets         = new Assets( $context );
		$authentication = new Authentication( $context );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_token( array( 'access_token' => 'test-access-token' ) );
		$this->screens        = new Screens( $context, $assets, new Modules( $context ), $authentication );
		$_GET['slug']         = 'analytics-4';
		$_GET['reAuth']       = '1';
		$_GET['showProgress'] = '1';
		$redirect             = $this->load_dashboard_screen();
		$this->assertNull( $redirect, 'Should not redirect when exemption params present.' );
		$reset();
	}
}
