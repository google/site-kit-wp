<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Validate_Auth_RequestTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Util\Input;
use Google\Site_Kit\Modules\Sign_In_With_Google\Validate_Auth_Request;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Modules
 * @group Sign_In_With_Google
 */
class Validate_Auth_RequestTest extends TestCase {
	/**
	 * Validate_Auth_Request instance.
	 *
	 * @since n.e.x.t
	 * @var Validate_Auth_Request
	 */
	protected $validate_auth_request;

	protected $input_mock;

	public function set_up() {
		parent::set_up();

		$this->input_mock = $this->getMockBuilder( Input::class )
		->setMethods( array( 'filter' ) )
		->getMock();

		$this->input_mock->method( 'filter' )
			->will(
				$this->returnCallback(
					function ( $input_type, $key ) {
						return isset( $this->mock_filter_values[ $input_type ][ $key ] )
						? $this->mock_filter_values[ $input_type ][ $key ]
						: null;
					}
				)
			);

		$this->validate_auth_request = new Validate_Auth_Request(
			new Context(
				GOOGLESITEKIT_PLUGIN_MAIN_FILE,
				$this->input_mock
			)
		);
	}

	/**
	 * @dataProvider request_data
	 **/
	public function test_run_validation( $error_code, $request_params ) {
		$this->mock_filter_values = $request_params;

		$this->validate_auth_request->run_validations();

		$this->assertTrue( $this->validate_auth_request->get_error() instanceof WP_Error );

		$this->assertEquals( $error_code, $this->validate_auth_request->get_error()->get_error_code() );
	}

	public function test_validate_csrf_token__token_match() {
		$this->mock_filter_values = array(
			INPUT_COOKIE => array( 'g_csrf_token' => '1234' ),
			INPUT_POST   => array(
				'g_csrf_token' => '1234',
				'credential'   => '123456789',
			),
			INPUT_SERVER => array( 'REQUEST_METHOD' => 'POST' ),
		);

		$this->validate_auth_request->run_validations();

		$this->assertFalse( $this->validate_auth_request->get_error() instanceof WP_Error );
	}

	public function test_validate_id_token_is_present__token_included() {
		$this->mock_filter_values = array(
			INPUT_COOKIE => array( 'g_csrf_token' => '1234' ),
			INPUT_POST   => array(
				'g_csrf_token' => '1234',
				'credential'   => '123456789',
			),
			INPUT_SERVER => array( 'REQUEST_METHOD' => 'POST' ),
		);

		$this->validate_auth_request->run_validations();

		$this->assertFalse( $this->validate_auth_request->get_error() instanceof WP_Error );
	}

	public function request_data() {
		return array(
			'request made with GET method'           => array(
				'google_auth_bad_request_method',
				array(
					INPUT_COOKIE => array( 'g_csrf_token' => '1234' ),
					INPUT_POST   => array(
						'g_csrf_token' => '1234',
						'credential'   => '123456789',
					),
					INPUT_SERVER => array( 'REQUEST_METHOD' => 'GET' ),
				),
			),
			'g_csrf_token mismatch'                  => array(
				'google_auth_invalid_g_csrf_token',
				array(
					INPUT_COOKIE => array( 'g_csrf_token' => '1234' ),
					INPUT_POST   => array(
						'g_csrf_token' => '345678',
						'credential'   => '123456789',
					),
					INPUT_SERVER => array( 'REQUEST_METHOD' => 'POST' ),
				),
			),
			'missing g_csrf_token in POST request'   => array(
				'google_auth_invalid_g_csrf_token',
				array(
					INPUT_COOKIE => array( 'g_csrf_token' => '1234' ),
					INPUT_POST   => array( 'credential' => '123456789' ),
					INPUT_SERVER => array( 'REQUEST_METHOD' => 'POST' ),
				),
			),
			'missing g_csrf_token in COOKIE request' => array(
				'google_auth_invalid_g_csrf_token',
				array(
					INPUT_COOKIE => array( 'g_csrf_token' => '1234' ),
					INPUT_POST   => array( 'credential' => '123456789' ),
					INPUT_SERVER => array( 'REQUEST_METHOD' => 'POST' ),
				),
			),
			'missing credential parameter'           => array(
				'missing_parameter',
				array(
					INPUT_COOKIE => array( 'g_csrf_token' => '1234' ),
					INPUT_POST   => array( 'g_csrf_token' => '1234' ),
					INPUT_SERVER => array( 'REQUEST_METHOD' => 'POST' ),
				),
			),
		);
	}
}
