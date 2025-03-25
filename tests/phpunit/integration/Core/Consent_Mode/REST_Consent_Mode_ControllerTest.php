<?php
/**
 * REST_Consent_Mode_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Consent_Mode
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Consent_Mode;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Consent_Mode\Consent_Mode_Settings;
use Google\Site_Kit\Core\Consent_Mode\REST_Consent_Mode_Controller;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Ads;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Settings as Analytics_4_Settings;
use Google\Site_Kit\Modules\Tag_Manager;
use Google\Site_Kit\Modules\Tag_Manager\Settings as Tag_Manager_Settings;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\FakeHttp;
use Google\Site_Kit\Tests\FakeInstalledPlugins;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\TagManager\ContainerVersion;
use Google\Site_Kit_Dependencies\Google\Service\TagManager\Tag;
use Google\Site_Kit_Dependencies\GuzzleHttp\Promise\FulfilledPromise;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Request;
use Google\Site_Kit_Dependencies\GuzzleHttp\Psr7\Response;
use WP_REST_Request;

class REST_Consent_Mode_ControllerTest extends TestCase {

	use Fake_Site_Connection_Trait;
	use FakeInstalledPlugins;
	use RestTestTrait;

	/**
	 * Consent_Mode_Settings instance.
	 *
	 * @var Consent_Mode_Settings
	 */
	private $settings;

	/**
	 * REST_Consent_Mode_Controller instance.
	 *
	 * @var REST_Consent_Mode_Controller
	 */
	private $controller;

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Modules instance.
	 *
	 * @var Modules
	 */
	private $modules;

	public function set_up() {
		parent::set_up();
		// Avoid unexpected results when running locally.
		$this->mock_installed_plugins();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options       = new Options( $this->context );

		$this->settings   = new Consent_Mode_Settings( $options );
		$this->modules    = new Modules( $this->context );
		$this->controller = new REST_Consent_Mode_Controller( $this->modules, $this->settings, $options );
	}

	public function tear_down() {
		parent::tear_down();
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
		remove_all_filters( 'googlesitekit_is_module_connected' );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		remove_all_filters( 'googlesitekit_apifetch_preload_paths' );

		$this->controller->register();

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ) );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ) );
	}

	public function test_get_settings() {
		$this->setup_rest();
		// Setup the site and admin user to make a successful REST request.
		$this->grant_manage_options_permission();

		$original_settings = array(
			'enabled' => true,
			'regions' => array( 'SG', 'US-AS' ),
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/consent-mode' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSetsWithIndex( $original_settings, $response->get_data() );
	}

	public function test_get_settings__requires_authenticated_admin() {
		$this->setup_rest();

		$original_settings = array(
			'enabled' => true,
			'regions' => array( 'SG', 'US-AS' ),
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/consent-mode' );
		$response = rest_get_server()->dispatch( $request );

		// This admin hasn't authenticated with the Site Kit proxy service yet,
		// so they aren't allowed to modify Dashboard Sharing settings.
		$this->assertEquals( 'rest_forbidden', $response->get_data()['code'] );
	}

	public function test_set_settings() {
		$this->setup_rest();
		// Setup the site and admin user to make a successful REST request.
		$this->grant_manage_options_permission();

		$original_settings = array(
			'enabled' => true,
			'regions' => array( 'SG', 'US-AS' ),
		);

		$changed_settings = array(
			'enabled' => false,
			'regions' => array( 'AT', 'BE' ),
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/consent-mode' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => $changed_settings,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertEqualSetsWithIndex( $changed_settings, $response->get_data() );
	}

	public function test_set_settings__requires_authenticated_admin() {
		$this->setup_rest();

		$original_settings = array(
			'enabled' => true,
			'regions' => array( 'SG', 'US-AS' ),
		);

		$changed_settings = array(
			'enabled' => false,
			'regions' => array( 'AT', 'BE' ),
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/consent-mode' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => $changed_settings,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		// This admin hasn't authenticated with the Site Kit proxy service yet,
		// so they aren't allowed to modify Dashboard Sharing settings.
		$this->assertEquals( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * @dataProvider provider_wrong_settings_data
	 */
	public function test_set_settings__wrong_data( $settings ) {
		$this->setup_rest();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/site/data/consent-mode' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => $settings,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_invalid_param', $response->get_data()['code'] );
	}

	public function provider_wrong_settings_data() {
		return array(
			'wrong data type'                              => array(
				'{}',
			),
			'invalid property'                             => array(
				array( 'some-invalid-property' => 'value' ),
			),
			'non-boolean enabled property'                 => array(
				array( 'enabled' => 123 ),
			),
			'regions property array containing non-string' => array(
				array( 'regions' => array( 123 ) ),
			),
		);
	}

	/**
	 * @group ms-excluded
	 */
	public function test_get_api_info() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'This test does not run on multisite.' );
		}

		$this->setup_rest();
		// Setup the site and admin user to make a successful REST request.
		$this->grant_manage_options_permission();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/consent-api-info' );
		$response = rest_get_server()->dispatch( $request );

		$response_data = $response->get_data();

		$this->assertFalse( $response_data['hasConsentAPI'] );
		$this->assertIsArray( $response_data['wpConsentPlugin'] );

		$wp_consent_plugin = $response_data['wpConsentPlugin'];

		// Plugin not installed (see mock_installed_plugins)
		$this->assertFalse( $wp_consent_plugin['installed'] );
		// Plugin is not installed, hence cannot be activated.
		$this->assertFalse( $wp_consent_plugin['activateURL'] );

		$this->assertStringStartsWith( 'http://example.org/wp-admin/update.php?action=install-plugin&plugin=wp-consent-api&_wpnonce=', $wp_consent_plugin['installURL'] );
	}

	/**
	 * @group ms-required
	 */
	public function test_get_api_info__multisite() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		$this->setup_rest();
		// Setup the site and admin user to make a successful REST request.
		$this->grant_manage_options_permission();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/consent-api-info' );
		$response = rest_get_server()->dispatch( $request );

		$response_data = $response->get_data();

		$this->assertFalse( $response_data['hasConsentAPI'] );
		$this->assertIsArray( $response_data['wpConsentPlugin'] );

		$wp_consent_plugin = $response_data['wpConsentPlugin'];

		$this->assertFalse( $wp_consent_plugin['installed'] );

		// We don't expect the ability to install or activate plugins on multisite.
		$this->assertFalse( $wp_consent_plugin['activateURL'] );
		$this->assertFalse( $wp_consent_plugin['installURL'] );
	}

	public function test_get_api_info__requires_authenticated_admin() {
		$this->setup_rest();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/consent-api-info' );
		$response = rest_get_server()->dispatch( $request );

		// This admin hasn't authenticated with the Site Kit proxy service yet,
		// so they aren't allowed to modify Dashboard Sharing settings.
		$this->assertEquals( 'rest_forbidden', $response->get_data()['code'] );
	}

	public function test_get_ads_measurement_status() {
		$this->setup_rest();
		// Setup the site and admin user to make a successful REST request.
		$this->grant_manage_options_permission();

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/ads-measurement-status' );
		$response = rest_get_server()->dispatch( $request );

		$response_data = $response->get_data();

		$this->assertFalse( $response_data['connected'] );
	}

	public function test_get_ads_measurement_status__ads_module_connected() {
		$this->setup_rest();
		$this->grant_manage_options_permission();

		remove_all_filters( 'googlesitekit_ads_measurement_connection_checks' );

		$ads = new Ads( $this->context );
		$ads->register();

		$ads->get_settings()->merge(
			array(
				'conversionID' => 'AW-123456789',
			)
		);

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/ads-measurement-status' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertTrue( $response->get_data()['connected'] );
	}

	public function test_get_ads_measurement_status__ga4_module_connected__ads_connected_setting_is_true() {
		$this->setup_rest();
			$this->grant_manage_options_permission();

			remove_all_filters( 'googlesitekit_ads_measurement_connection_checks' );

			add_filter(
				'googlesitekit_ads_measurement_connection_checks',
				function () {
					return array(
						fn() => true,
					);
				}
			);

			$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/ads-measurement-status' );
			$response = rest_get_server()->dispatch( $request );

			$this->assertTrue( $response->get_data()['connected'] );
	}

	public function test_get_ads_measurement_status__ga4_module_connected__destinationIds_setting_contains_ads_related_tag() {
		$this->setup_rest();
			$this->grant_manage_options_permission();

			remove_all_filters( 'googlesitekit_ads_measurement_connection_checks' );

			add_filter(
				'googlesitekit_ads_measurement_connection_checks',
				function () {
					return array(
						fn() => true,
					);
				}
			);

			$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/ads-measurement-status' );
			$response = rest_get_server()->dispatch( $request );

			$this->assertTrue( $response->get_data()['connected'] );
	}

	/**
	 * @dataProvider data_container_checks
	 */
	public function test_get_ads_measurement_status__tag_manager_module_connected__live_container_checks_with_data_set( $has_awct_tag, $expected_connection_value ) {
		$this->setup_rest();
		$this->grant_manage_options_permission();

		remove_all_filters( 'googlesitekit_ads_measurement_connection_checks' );

		add_filter(
			'googlesitekit_ads_measurement_connection_checks',
			function () use ( $has_awct_tag ) {
				return array(
					function () use ( $has_awct_tag ) {
						return $has_awct_tag; },
				);
			}
		);

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/site/data/ads-measurement-status' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( $expected_connection_value, $response->get_data()['connected'] );
	}

	public function data_container_checks() {
		return array(
			'has awct type tag'    => array( true, true ),
			'has no awct type tag' => array( false, false ),
		);
	}

	private function grant_manage_options_permission() {
		// Setup SiteKit.
		$this->fake_proxy_site_connection();
		// Override any existing filter to make sure the setup is marked as complete all the time.
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		// Verify and authenticate the current user.
		$authentication = new Authentication( $this->context );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_token(
			array(
				'access_token' => 'valid-auth-token',
			)
		);
	}

	private function setup_rest() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();
	}

	private function force_module_connection( $module_slug ) {
		add_filter(
			'googlesitekit_is_module_connected',
			function ( $connected, $slug ) use ( $module_slug ) {
				if ( $module_slug === $slug ) {
					return true;
				}
				return $connected;
			},
			10,
			2
		);
	}

	/**
	 * @param ContainerVersion $container_version ContainerVersion instance.
	 * @param string $account_id                  Tag manager account ID.
	 * @param string $container_id                Tag manager container ID.
	 */
	private function fake_tag_manager_http_handler( ContainerVersion $container_version, $account_id, $container_id ) {
		FakeHttp::fake_google_http_handler(
			$this->modules->get_module( Tag_Manager::MODULE_SLUG )->get_client(),
			function ( Request $request ) use ( $container_version, $account_id, $container_id ) {
				$url = parse_url( $request->getUri() );

				if ( 'tagmanager.googleapis.com' !== $url['host'] ) {
					return new FulfilledPromise( new Response( 200 ) );
				}

				switch ( $url['path'] ) {
					case "/tagmanager/v2/accounts/{$account_id}/containers/{$container_id}/versions:live":
						return new FulfilledPromise(
							new Response(
								200,
								array(),
								json_encode(
									$container_version->toSimpleObject()
								)
							)
						);

					default:
						return new FulfilledPromise( new Response( 200 ) );
				}
			}
		);
	}
}
