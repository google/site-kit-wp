<?php
/**
 * REST_Key_Metrics_ControllerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Key_Metrics
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Key_Metrics;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Settings;
use Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_Completed_By;
use Google\Site_Kit\Core\Key_Metrics\REST_Key_Metrics_Controller;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\RestTestTrait;
use Google\Site_Kit\Tests\TestCase;
use WP_REST_Request;

class REST_Key_Metrics_ControllerTest extends TestCase {

	use RestTestTrait;

	/**
	 * Key_Metrics_Settings instance.
	 *
	 * @var Key_Metrics_Settings
	 */
	private $settings;

	/**
	 * REST_Key_Metrics_Controller instance.
	 *
	 * @var REST_Key_Metrics_Controller
	 */
	private $controller;

	/**
	 * Key_Metrics_Setup_Completed_By instance.
	 *
	 * @var Key_Metrics_Setup_Completed_By
	 */
	private $key_metrics_setup_completed_by;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options      = new Options( $context );
		$user_options = new User_Options( $context, $user_id );

		$this->settings                       = new Key_Metrics_Settings( $user_options );
		$this->key_metrics_setup_completed_by = new Key_Metrics_Setup_Completed_By( $options );
		$this->controller                     = new REST_Key_Metrics_Controller( $this->settings, $this->key_metrics_setup_completed_by );
	}

	public function tear_down() {
		parent::tear_down();
		// This ensures the REST server is initialized fresh for each test using it.
		unset( $GLOBALS['wp_rest_server'] );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		remove_all_filters( 'googlesitekit_apifetch_preload_paths' );

		$this->controller->register();

		$this->assertTrue( has_filter( 'googlesitekit_rest_routes' ) );
		$this->assertTrue( has_filter( 'googlesitekit_apifetch_preload_paths' ) );
	}

	public function test_get_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$original_settings = array(
			'widgetSlugs'    => array( 'widgetA' ),
			'isWidgetHidden' => false,
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request  = new WP_REST_Request( 'GET', '/' . REST_Routes::REST_ROOT . '/core/user/data/key-metrics' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEqualSetsWithIndex( $original_settings, $response->get_data() );
	}

	public function test_set_settings() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$original_settings = array(
			'widgetSlugs'    => array( 'widgetA' ),
			'isWidgetHidden' => false,
		);

		$changed_settings = array(
			'widgetSlugs'    => array( 'widgetB' ),
			'isWidgetHidden' => true,
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/key-metrics' );
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

	public function test_set_settings__only__isWidgetHidden() {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$original_settings = array(
			'widgetSlugs'    => array( 'widgetA' ),
			'isWidgetHidden' => false,
		);

		$changed_settings = array(
			'isWidgetHidden' => true,
		);

		$expected_settings = array(
			'widgetSlugs'    => array( 'widgetA' ),
			'isWidgetHidden' => true,
		);

		$this->settings->register();
		$this->settings->set( $original_settings );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/key-metrics' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => $changed_settings,
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertEqualSetsWithIndex( $expected_settings, $response->get_data() );
	}

	/**
	 * @dataProvider data_setup_completed
	 * @param bool $expected
	 * @param array $settings
	 */
	public function test_setup_completed( $expected, $settings ) {
		$this->settings->register();
		$this->controller->register();
		$this->register_rest_routes();

		$this->assertFalse( $this->key_metrics_setup_completed_by->get() );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/key-metrics' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => $settings,
				),
			)
		);

		rest_get_server()->dispatch( $request );

		$this->assertEquals( $expected, $this->key_metrics_setup_completed_by->get() );
	}

	public function data_setup_completed() {
		return array(
			'completed on success'                     => array(
				true,
				array(
					'widgetSlugs'    => array( 'widgetA' ),
					'isWidgetHidden' => false,
				),
			),
			'incomplete on error'                      => array(
				false,
				array(
					'widgetSlugs'    => array(), // Insufficient number of widget slugs.
					'isWidgetHidden' => false,
				),
			),
			'incomplete on only isWidgetHidden change' => array(
				false,
				array(
					'isWidgetHidden' => false,
				),
			),
		);
	}

	public function test_set_settings__with_conversionReporting_enabled() {
		$this->enable_feature( 'conversionReporting' );

		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/key-metrics' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => array(
						'widgetSlugs'    => array( 'widget0', 'widget1', 'widget2', 'widget3', 'widget4', 'widget5' ),
						'isWidgetHidden' => false,
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		// When conversionReporting feature flag is enabled
		// it should be possible to save more than 4 KMW.
		$this->assertEquals( 200, $response->get_status() );

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/key-metrics' );
		$request->set_body_params(
			array(
				'data' => array(
					'settings' => array(
						'widgetSlugs'    => array(
							'widget0',
							'widget1',
							'widget2',
							'widget3',
							'widget4',
							'widget5',
							'widget6',
							'widget7',
							'widget8',
							'widget9',
						),
						'isWidgetHidden' => false,
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		// When conversionReporting feature flag is enabled
		// it should be possible to save more than 4 KMW, but
		// not more than 8.
		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_invalid_param', $response->get_data()['code'] );
	}

	/**
	 * @dataProvider provider_wrong_data
	 */
	public function test_set_settings__wrong_data( $settings ) {
		remove_all_filters( 'googlesitekit_rest_routes' );
		$this->controller->register();
		$this->register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/' . REST_Routes::REST_ROOT . '/core/user/data/key-metrics' );
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

	public function provider_wrong_data() {
		return array(
			'wrong data type'       => array(
				'{}',
			),
			'too many widget slugs' => array(
				array(
					'widgetSlugs'    => array( 'widget0', 'widget1', 'widget2', 'widget3', 'widget4' ),
					'isWidgetHidden' => true,
				),
			),
			'no widget slugs'       => array(
				array(
					'widgetSlugs'    => array(),
					'isWidgetHidden' => true,
				),
			),
		);
	}
}
