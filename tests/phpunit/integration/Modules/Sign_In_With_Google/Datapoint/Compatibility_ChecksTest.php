<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Datapoint\Compatibility_ChecksTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Datapoint
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Datapoint;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks\Compatibility_Checks as Checks;
use Google\Site_Kit\Modules\Sign_In_With_Google\Datapoint\Compatibility_Checks;
use Google\Site_Kit\Tests\TestCase;
use WP_Error;

/**
 * @group Modules
 * @group Sign_In_With_Google
 * @group Datapoint
 */
class Compatibility_ChecksTest extends TestCase {

	private $datapoint;
	private $mock_checks;

	public function set_up() {
		parent::set_up();

		$this->mock_checks = $this->getMockBuilder( Checks::class )
			->setMethods( array( 'run_checks' ) )
			->getMock();

		$this->datapoint = new Compatibility_Checks(
			array(
				'checks' => $this->mock_checks,
			)
		);
	}

	public function test_create_request_requires_manage_options_capability() {
		$user_id = $this->factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $user_id );

		$data_request = new Data_Request( 'GET', 'modules', 'sign-in-with-google', 'compatibility-checks' );

		$result = $this->datapoint->create_request( $data_request );

		$this->assertWPError( $result );
		$this->assertEquals( 'rest_forbidden', $result->get_error_code(), 'Error code should be rest_forbidden' );
		$this->assertEquals( 'You are not allowed to access this resource.', $result->get_error_message(), 'Error message should indicate access denial' );
		$this->assertEquals( 403, $result->get_error_data()['status'], 'Status code should be 403' );
	}

	public function test_create_request_with_admin_user() {
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );

		// Ensure admin user has Permissions::MANAGE_OPTIONS cap regardless of authentication.
		add_filter(
			'map_meta_cap',
			function ( $caps, $cap ) {
				if ( Permissions::MANAGE_OPTIONS === $cap ) {
					return array( 'manage_options' );
				}
				return $caps;
			},
			99,
			2
		);

		$data_request = new Data_Request( 'GET', 'modules', 'sign-in-with-google', 'compatibility-checks' );

		$result = $this->datapoint->create_request( $data_request );

		$this->assertIsCallable( $result, 'Result should be callable for admin user' );
	}

	public function test_create_request_executes_checks() {
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );

		$mock_checks_result = array(
			'wp_login_inaccessible' => true,
			'wp_com_incompatible'   => false,
		);

		$this->mock_checks->expects( $this->once() )
			->method( 'run_checks' )
			->willReturn( $mock_checks_result );

		$data_request = new Data_Request( 'GET', 'modules', 'sign-in-with-google', 'compatibility-checks' );

		$request = $this->datapoint->create_request( $data_request );
		$result  = $request();

		$this->assertIsArray( $result, 'Result should be an array' );
		$this->assertArrayHasKey( 'checks', $result, 'Result should have checks key' );
		$this->assertArrayHasKey( 'timestamp', $result, 'Result should have timestamp key' );

		$this->assertEquals( $mock_checks_result, $result['checks'], 'Checks result should match mock result' );
		$this->assertIsInt( $result['timestamp'], 'Timestamp should be an integer' );
	}


	public function test_create_request_timestamp_is_current_time() {
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );

		$this->mock_checks->method( 'run_checks' )->willReturn( array() );

		$data_request = new Data_Request( 'GET', 'modules', 'sign-in-with-google', 'compatibility-checks' );

		$before_time = time();
		$request     = $this->datapoint->create_request( $data_request );
		$result      = $request();
		$after_time  = time();

		$this->assertGreaterThanOrEqual( $before_time, $result['timestamp'], 'Timestamp should be greater than or equal to before time' );
		$this->assertLessThanOrEqual( $after_time, $result['timestamp'], 'Timestamp should be less than or equal to after time' );
	}

	public function test_parse_response_returns_response_unchanged() {
		$test_response = array(
			'checks'    => array( 'test_check' => true ),
			'timestamp' => 1234567890,
		);

		$data_request = new Data_Request( 'GET', 'modules', 'sign-in-with-google', 'compatibility-checks' );

		$result = $this->datapoint->parse_response( $test_response, $data_request );

		$this->assertEquals( $test_response, $result, 'Parse response should return response unchanged' );
	}

	public function test_constructor_sets_checks_instance() {
		$mock_checks = $this->getMockBuilder( Checks::class )->getMock();

		$datapoint = new Compatibility_Checks(
			array(
				'checks' => $mock_checks,
			)
		);

		$reflection = new \ReflectionClass( $datapoint );
		$property   = $reflection->getProperty( 'checks' );
		$property->setAccessible( true );

		$this->assertSame( $mock_checks, $property->getValue( $datapoint ), 'Checks instance should be set correctly' );
	}

	public function test_constructor_without_checks_instance() {
		$datapoint = new Compatibility_Checks( array() );

		$reflection = new \ReflectionClass( $datapoint );
		$property   = $reflection->getProperty( 'checks' );
		$property->setAccessible( true );

		$this->assertNull( $property->getValue( $datapoint ), 'Checks instance should be null when not provided' );
	}
}
