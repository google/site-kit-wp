<?php
/**
 * Class Google\Site_Kit\Tests\Core\Util\User_Input_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Authentication\User_Input_State;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\User_Input_Settings;
use Google\Site_Kit\Tests\TestCase;

class User_Input_SettingsTest extends TestCase {

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * @var bool
	 */
	protected static $old_wp_using_ext_object_cache;

	public static function wpSetUpBeforeClass() {
		self::$old_wp_using_ext_object_cache = wp_using_ext_object_cache();
	}

	public static function wpTearDownAfterClass() {
		wp_using_ext_object_cache( self::$old_wp_using_ext_object_cache );
	}

	public function setUp() {
		parent::setUp();
		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
	}

	private function get_connected_to_proxy_mock() {
		$settings = $this->getMockBuilder( User_Input_Settings::class )
			->setConstructorArgs( array( $this->context ) )
			->setMethods( array( 'is_connected_to_proxy' ) )
			->getMock();

		$settings
			->method( 'is_connected_to_proxy' )
			->willReturn( true );

		return $settings;
	}

	public function test_not_connected_to_proxy() {
		$settings = new User_Input_Settings( $this->context );
		$results  = array(
			$settings->get_settings(),
			$settings->set_settings( array() ),
		);

		foreach ( $results as $result ) {
			$this->assertWPError( $result );
			$this->assertEquals( 'not_connected', $result->get_error_code() );

			$data = $result->get_error_data();
			$this->assertArrayHasKey( 'status', $data );
			$this->assertEquals( 400, $data['status'] );
		}
	}

	public function test_are_settings_empty() {
		$settings = new User_Input_Settings( $this->context );

		$data = array(
			'setting1' => array( 'values' => null ),
		);
		$this->assertTrue( $settings->are_settings_empty( $data ) );

		$data = array(
			'setting1' => array( 'values' => null ),
			'setting2' => array( 'values' => array( '1', '2', '3' ) ),
		);
		$this->assertTrue( $settings->are_settings_empty( $data ) );

		$data = array(
			'setting1' => array( 'values' => array( 'a', 'b', 'c' ) ),
			'setting2' => array( 'values' => array( '1', '2', '3' ) ),
		);
		$this->assertFalse( $settings->are_settings_empty( $data ) );
	}

	public function test_get_settings_from_cache() {
		wp_using_ext_object_cache( false );

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$user_options = new User_Options( $this->context, $user_id );
		$settings     = $this->get_connected_to_proxy_mock();

		set_transient(
			'googlesitekit_user_input_settings',
			array(
				'goals'       => array(
					'values' => array( 'goal1', 'goal2', 'goal3' ),
					'scope'  => 'site',
				),
				'helpNeeded'  => array(
					'values' => array( 'no' ),
					'scope'  => 'site',
				),
				'searchTerms' => array(
					'values' => array( 'keyword1', 'keyword2' ),
					'scope'  => 'site',
				),
			)
		);

		$user_options->set( 'googlesitekit_transient_timeout_googlesitekit_user_input_settings', time() + 1000 );
		$user_options->set(
			'googlesitekit_transient_googlesitekit_user_input_settings',
			array(
				'role'          => array(
					'values' => array( 'role1', 'role2' ),
					'scope'  => 'user',
				),
				'postFrequency' => array(
					'values' => array( 'daily' ),
					'scope'  => 'user',
				),
			)
		);

		$this->assertEquals(
			array(
				'goals'         => array(
					'values' => array( 'goal1', 'goal2', 'goal3' ),
					'scope'  => 'site',
				),
				'helpNeeded'    => array(
					'values' => array( 'no' ),
					'scope'  => 'site',
				),
				'searchTerms'   => array(
					'values' => array( 'keyword1', 'keyword2' ),
					'scope'  => 'site',
				),
				'role'          => array(
					'values' => array( 'role1', 'role2' ),
					'scope'  => 'user',
				),
				'postFrequency' => array(
					'values' => array( 'daily' ),
					'scope'  => 'user',
				),
			),
			$settings->get_settings()
		);
	}

	public function test_get_settings_from_remote() {
		$settings = $this->get_connected_to_proxy_mock();
		$data     = array(
			'goals'         => array(
				'values' => array( 'goal4', 'goal5', 'goal6' ),
				'scope'  => 'site',
			),
			'helpNeeded'    => array(
				'values' => array( 'yes' ),
				'scope'  => 'site',
			),
			'searchTerms'   => array(
				'values' => array( 'keyword3', 'keyword4' ),
				'scope'  => 'site',
			),
			'role'          => array(
				'values' => array( 'role3' ),
				'scope'  => 'user',
			),
			'postFrequency' => array(
				'values' => array( 'weekly' ),
				'scope'  => 'user',
			),
		);

		remove_all_filters( 'pre_http_request' );

		add_filter(
			'pre_http_request',
			function( $pre, $args, $url ) use ( $data ) {
				$authentication          = new Authentication( $this->context );
				$user_input_settings_url = $authentication->get_google_proxy()->url( Google_Proxy::USER_INPUT_SETTINGS_URI );
				if ( $url !== $user_input_settings_url ) {
					return $pre;
				}

				return array(
					'headers'  => array(),
					'body'     => wp_json_encode( $data ),
					'response' => array( 'code' => 200 ),
				);
			},
			10,
			3
		);

		$this->assertEquals( $data, $settings->get_settings() );
	}

	public function test_set_settings() {
		$settings = $this->get_connected_to_proxy_mock();
		$body     = array();
		$data     = array(
			'goals'         => array( 'goal7' ),
			'helpNeeded'    => array(),
			'searchTerms'   => array(),
			'role'          => array( 'role4' ),
			'postFrequency' => array( 'monthly' ),
		);

		remove_all_filters( 'pre_http_request' );

		add_filter(
			'pre_http_request',
			function( $pre, $args, $url ) use ( &$body ) {
				$authentication          = new Authentication( $this->context );
				$user_input_settings_url = $authentication->get_google_proxy()->url( Google_Proxy::USER_INPUT_SETTINGS_URI );
				if ( $url !== $user_input_settings_url ) {
					return $pre;
				}

				if ( ! empty( $args['body'] ) ) {
					$body = json_decode( $args['body'], true );
				}

				return array(
					'headers'  => array(),
					'body'     => '{}',
					'response' => array( 'code' => 200 ),
				);
			},
			10,
			3
		);

		$settings->set_settings( $data );

		$this->assertEquals( $data, $body );
	}

	public function test_set_settings_completed_flag() {
		remove_all_filters( 'pre_http_request' );

		add_filter(
			'pre_http_request',
			function( $pre, $args, $url ) {
				$authentication          = new Authentication( $this->context );
				$user_input_settings_url = $authentication->get_google_proxy()->url( Google_Proxy::USER_INPUT_SETTINGS_URI );
				if ( $url !== $user_input_settings_url ) {
					return $pre;
				}

				return array(
					'headers'  => array(),
					'response' => array( 'code' => 200 ),
					'body'     => json_encode(
						array(
							'setting1' => array( 'values' => array( '1', '2', '3' ) ),
							'setting2' => array( 'values' => array( 'a', 'b', 'c' ) ),
						)
					),
				);
			},
			10,
			3
		);

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$settings = $this->get_connected_to_proxy_mock();
		$settings->set_settings( array() );

		$user_options = new User_Options( $this->context, $user_id );
		$state        = new User_Input_State( $user_options );
		$this->assertEquals( User_Input_State::VALUE_COMPLETED, $state->get() );
	}

	public function test_set_settings_missing_flag() {
		remove_all_filters( 'pre_http_request' );

		add_filter(
			'pre_http_request',
			function( $pre, $args, $url ) {
				$authentication          = new Authentication( $this->context );
				$user_input_settings_url = $authentication->get_google_proxy()->url( Google_Proxy::USER_INPUT_SETTINGS_URI );
				if ( $url !== $user_input_settings_url ) {
					return $pre;
				}

				return array(
					'headers'  => array(),
					'response' => array( 'code' => 200 ),
					'body'     => json_encode(
						array(
							'setting1' => array( 'values' => array( '1', '2', '3' ) ),
							'setting2' => array( 'values' => array() ),
						)
					),
				);
			},
			10,
			3
		);

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$settings = $this->get_connected_to_proxy_mock();
		$settings->set_settings( array() );

		$user_options = new User_Options( $this->context, $user_id );
		$state        = new User_Input_State( $user_options );
		$this->assertEquals( User_Input_State::VALUE_MISSING, $state->get() );
	}

}
