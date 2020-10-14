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
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\User_Input_Settings;
use Google\Site_Kit\Tests\Core\Util\FakeUser_Input_Settings;
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

	public function test_get_settings_from_cache() {
		wp_using_ext_object_cache( false );

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$user_options = new User_Options( $this->context, $user_id );
		$settings     = new FakeUser_Input_Settings( $this->context );

		set_transient(
			'googlesitekit_user_input_settings',
			array(
				'goals'       => array( 'goal1', 'goal2', 'goal3' ),
				'helpNeeded'  => array( 'no' ),
				'searchTerms' => array( 'keyword1', 'keyword2' ),
			)
		);

		$user_options->set( 'googlesitekit_transient_timeout_googlesitekit_user_input_settings', time() + 1000 );
		$user_options->set(
			'googlesitekit_transient_googlesitekit_user_input_settings',
			array(
				'role'          => array( 'role1', 'role2' ),
				'postFrequency' => array( 'daily' ),
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

	public function test_get_settigns_from_remote() {
		$settings = new FakeUser_Input_Settings( $this->context );
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
			function() use ( $data ) {
				return array(
					'headers'  => array(),
					'body'     => wp_json_encode( $data ),
					'response' => array( 'code' => 200 ),
				);
			}
		);

		$this->assertEquals( $data, $settings->get_settings() );
	}

	public function test_set_settings() {
		$settings = new FakeUser_Input_Settings( $this->context );
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
			function( $pre, $args ) use ( &$body ) {
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
			2
		);

		$settings->set_settings( $data );

		$this->assertEquals( $data, $body );
	}

}
