<?php
/**
 * ModuleTest
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Exception\Google_Proxy_Code_Exception;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google_Service_Exception;
use Exception;
use ReflectionMethod;

/**
 * @group Modules
 */
class ModuleTest extends TestCase {

	use Fake_Site_Connection_Trait;

	const MODULE_CLASS_NAME = '\Google\Site_Kit\Core\Modules\Module';

	public function test_register() {
		// The register method is abstract and required by any implementation
		$method = new ReflectionMethod( self::MODULE_CLASS_NAME, 'register' );
		$this->assertTrue( $method->isAbstract(), 'Base module should require concrete register implementation.' );
	}

	public function test_magic_methods() {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Check that some defaults are correct.
		$this->assertFalse( $module->force_active, 'Magic getter should expose force_active default.' );
		$this->assertFalse( $module->internal, 'Magic getter should expose internal default.' );

		// Can't use force_set_property here since the property is private on the base module
		$reflection_property = new \ReflectionProperty( self::MODULE_CLASS_NAME, 'info' );
		$reflection_property->setAccessible( true );
		$reflection_property->setValue(
			$module,
			array(
				'slug'        => 'module-slug',
				'name'        => 'module name',
				'description' => 'module description',
			)
		);

		$this->assertTrue( isset( $module->slug ), 'Magic isset should recognize configured module slug.' );
		$this->assertTrue( isset( $module->name ), 'Magic isset should recognize configured module name.' );
		$this->assertTrue( isset( $module->description ), 'Magic isset should recognize configured module description.' );

		$this->assertEquals( 'module-slug', $module->slug, 'Magic getter should expose configured module slug.' );
		$this->assertEquals( 'module name', $module->name, 'Magic getter should expose configured module name.' );
		$this->assertEquals( 'module description', $module->description, 'Magic getter should expose configured module description.' );

		$this->assertFalse( isset( $module->non_existent ), 'Magic isset should reject unknown module property.' );
		$this->assertNull( $module->non_existent, 'Magic getter should return null for unknown property.' );
	}

	public function test_is_connected() {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// A module being connected means that all steps required as part of its activation are completed.
		// Modules are considered connected by default, and each module has its own logic for this.
		$this->assertTrue( $module->is_connected(), 'Modules should be connected by default.' );
	}

	public function test_get_data() {
		// get_data is a wrapper for the protected execute_data_request method.
		$method = new ReflectionMethod( self::MODULE_CLASS_NAME, 'get_data' );
		// Make assertions that affect backwards compatibility
		$this->assertTrue( $method->isPublic(), 'get_data should remain public for backward compatibility.' );
		// Number of parameters can increase while preserving B/C, but not decrease
		$this->assertEquals( 2, $method->getNumberOfParameters(), 'get_data should keep expected parameter count.' );
		// Number of required parameters can decrease while preserving B/C, but not increase
		$this->assertEquals( 1, $method->getNumberOfRequiredParameters(), 'get_data should keep required parameter count.' );

		$module   = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$response = $module->get_data( 'test-request', array( 'foo' => 'bar' ) );
		$this->assertIsObject( $response, 'get_data should return parsed object response by default.' );
		$this->assertEquals( 'GET', $response->method, 'get_data should execute a GET request.' );
		$this->assertEquals( 'test-request', $response->datapoint, 'get_data should pass requested datapoint.' );
		$this->assertEquals( array( 'foo' => 'bar' ), (array) $response->data, 'get_data should pass request data to parser.' );

		// Test that $data is available in parse_data_response
		$response = $module->get_data(
			'test-request',
			array(
				'foo'     => 'bar',
				'asArray' => true,
			)
		);
		$this->assertIsArray( $response, 'get_data should allow parser to return array response.' );
		$this->assertEquals( 'GET', $response['method'], 'get_data array response should include GET method.' );
		$this->assertEquals( 'test-request', $response['datapoint'], 'get_data array response should include datapoint.' );
		$this->assertEquals(
			array(
				'foo'     => 'bar',
				'asArray' => true,
			),
			$response['data'],
			'get_data array response should include request data.'
		);
	}

	public function test_get_data__current_module_owner_without_shared_role() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$module           = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$module->owner_id = $user_id;

		$module->register();

		// Verify that the user owns the module, and that it is shareable.
		$this->assertEquals( $user_id, $module->get_owner_id(), 'Current user should be module owner for owner data request.' );
		$this->assertTrue( $module->is_shareable(), 'Owner data request should use a shareable module.' );

		// Verify that the user does not have a shared role.
		$this->assertFalse( current_user_can( Permissions::READ_SHARED_MODULE_DATA, $module->slug ), 'Module owner should not require shared role capability.' );

		$response = $module->get_data( 'test-request', array( 'foo' => 'bar' ) );

		// Verify that the response returned data as expected.
		$this->assertEquals( array( 'foo' => 'bar' ), (array) $response->data, 'Owner data request should return direct module response.' );

		// The module should not have made a shared request, as it doesn't need to because it's owned by the current user.
		$this->assertFalse( $module->made_shared_data_request(), 'Owner data request should not use shared-data path.' );
	}

	public function test_get_data__current_module_owner_with_shared_role() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		// Set up sharing capabilities...
		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user           = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options   = new User_Options( $context, $user->ID );
		$authentication = new Authentication( $context, $options, $user_options );

		$modules     = new Modules( $context, null, $user_options, $authentication );
		$permissions = new Permissions( $context, $authentication, $modules, $user_options, new Dismissed_Items( $user_options ) );
		$permissions->register();

		$module           = new FakeModule( $context, $options, $user_options, $authentication );
		$module->owner_id = $user_id;

		$module->register();

		// Ensure sharing is enabled for the module.
		add_option(
			Module_Sharing_Settings::OPTION,
			array(
				$module->slug => array(
					'sharedRoles' => $user->roles,
					'management'  => 'owner',
				),
			)
		);

		// Verify that the user owns the module, and that it is shareable.
		$this->assertEquals( $user_id, $module->get_owner_id(), 'Current user should remain owner when sharing enabled.' );
		$this->assertTrue( $module->is_shareable(), 'Shared-role owner request should use shareable module.' );

		// Verify that the user has a shared role.
		$this->assertTrue( current_user_can( Permissions::READ_SHARED_MODULE_DATA, $module->slug ), 'Shared role should grant shared module data capability.' );

		$response = $module->get_data( 'test-request', array( 'foo' => 'bar' ) );

		// Verify that the response returned data as expected.
		$this->assertEquals( array( 'foo' => 'bar' ), (array) $response->data, 'Owner with shared role should still receive direct response.' );

		// The module should not have made a shared request, even though the user does have a shared role, as it still doesn't need to because it's owned by the current user.
		$this->assertFalse( $module->made_shared_data_request(), 'Owner with shared role should not use shared-data path.' );
	}

	public function test_get_data__non_module_owner_without_shared_role() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$module->register();

		// Verify that the user does not own the module, and that it is shareable.
		$this->assertNotEquals( $user_id, $module->get_owner_id(), 'Current user should not own module without owner assignment.' );
		$this->assertTrue( $module->is_shareable(), 'Non-owner request should use a shareable module.' );

		// Verify that the user does not have a shared role.
		$this->assertFalse( current_user_can( Permissions::READ_SHARED_MODULE_DATA, $module->slug ), 'Non-owner without role should lack shared data capability.' );

		$response = $module->get_data( 'test-request', array( 'foo' => 'bar' ) );

		// Verify that the response returned data as expected.
		$this->assertEquals( array( 'foo' => 'bar' ), (array) $response->data, 'Non-owner without shared role should receive direct response.' );

		// The module should not have made a shared request, as the user doesn't own the module and doesn't have a shared role.
		$this->assertFalse( $module->made_shared_data_request(), 'Non-owner without shared role should not use shared-data path.' );
	}

	public function test_get_data__non_module_owner_with_shared_role() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		// Set up sharing capabilities...
		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user           = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options   = new User_Options( $context, $user->ID );
		$authentication = new Authentication( $context, $options, $user_options );

		$modules     = new Modules( $context, null, $user_options, $authentication );
		$permissions = new Permissions( $context, $authentication, $modules, $user_options, new Dismissed_Items( $user_options ) );
		$permissions->register();

		$module = new FakeModule( $context, $options, $user_options, $authentication );

		$module->register();

		// Ensure sharing is enabled for the module.
		add_option(
			Module_Sharing_Settings::OPTION,
			array(
				$module->slug => array(
					'sharedRoles' => $user->roles,
					'management'  => 'owner',
				),
			)
		);

		// Verify that the user does not own the module, and that it is shareable.
		$this->assertNotEquals( $user_id, $module->get_owner_id(), 'Current user should not own shared module.' );
		$this->assertTrue( $module->is_shareable(), 'Shared-role non-owner request should use shareable module.' );

		// Verify that the user has a shared role.
		$this->assertTrue( current_user_can( Permissions::READ_SHARED_MODULE_DATA, $module->slug ), 'Shared role should grant non-owner shared data access.' );

		$response = $module->get_data( 'test-request', array( 'foo' => 'bar' ) );

		// Verify that the response returned data as expected.
		$this->assertEquals( array( 'foo' => 'bar' ), (array) $response->data, 'Shared-role non-owner should receive module response.' );

		// The module should have made a shared request, as the user doesn't own the module and does have a shared role.
		$this->assertTrue( $module->made_shared_data_request(), 'Shared-role non-owner should use shared-data path.' );
	}

	public function test_set_data() {
		// set_data is a wrapper for the protected execute_data_request method.
		$method = new ReflectionMethod( self::MODULE_CLASS_NAME, 'set_data' );
		// Make assertions that affect backwards compatibility
		$this->assertTrue( $method->isPublic(), 'set_data should remain public for backward compatibility.' );
		// Number of parameters can increase while preserving B/C, but not decrease
		$this->assertEquals( 2, $method->getNumberOfParameters(), 'set_data should keep expected parameter count.' );
		// Number of required parameters can decrease while preserving B/C, but not increase
		$this->assertEquals( 2, $method->getNumberOfRequiredParameters(), 'set_data should keep required parameter count.' );
	}

	public function test_get_datapoints() {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array( 'test-request', 'permission-aware-request', 'throwing-permission-aware-request' ),
			$module->get_datapoints(),
			'Get datapoints should contain expected values.'
		);
	}

	public function test_exception_to_error() {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Regular exception.
		$exception = new Exception( 'This is an error.' );
		$error     = $module->exception_to_error( $exception, 'test' );
		$this->assertWPErrorWithMessage( 'This is an error.', $error );
		$this->assertSame( 'unknown', $error->get_error_code(), 'Regular exception should use unknown WP_Error code.' );
		$this->assertEqualSetsWithIndex(
			array(
				'status' => 500,
				'reason' => '',
			),
			$error->get_error_data(),
			'Regular exception should include default error data.'
		);

		// Google service exception without JSON response body.
		$exception = new Google_Service_Exception( 'FATAL', 500 );
		$error     = $module->exception_to_error( $exception, 'test' );
		$this->assertWPErrorWithMessage( 'FATAL', $error );
		$this->assertSame( 500, $error->get_error_code(), 'Service exception should use HTTP status as error code.' );
		$this->assertEqualSetsWithIndex(
			array(
				'status' => 500,
				'reason' => '',
			),
			$error->get_error_data(),
			'Service exception without body should include empty reason.'
		);

		// Google service exception with JSON response body.
		$response_errors = array(
			array(
				'message' => 'Bad request.',
				'reason'  => 'Insufficient permissions.',
			),
		);
		$exception       = new Google_Service_Exception( json_encode( $response_errors ), 400, null, $response_errors );
		$error           = $module->exception_to_error( $exception, 'test' );
		$this->assertWPErrorWithMessage( $response_errors[0]['message'], $error );
		$this->assertSame( 400, $error->get_error_code(), 'Service exception with body should use HTTP status code.' );
		$this->assertEqualSetsWithIndex(
			array(
				'status' => 400,
				'reason' => $response_errors[0]['reason'],
			),
			$error->get_error_data(),
			'Service exception should preserve response error reason.'
		);
	}

	public function test_exception_to_error__with_proxy_code_exception() {
		$this->fake_proxy_site_connection();

		$module    = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$exception = new Google_Proxy_Code_Exception( 'test message', 0, 'access-code' );
		$error     = $module->exception_to_error( $exception );

		$this->assertWPError( $error, 'Exception to error with proxy code exception should return a WP_Error.' );
		$data = $error->get_error_data();

		$this->assertEquals( 401, $data['status'], 'Proxy code exception should report auth failure status.' );
		$this->assertStringStartsWith( 'https://sitekit.withgoogle.com/v2/site-management/setup/', $data['reconnectURL'], 'Proxy code exception should include reconnect URL.' );
	}

	public function test_parse_string_list() {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$reflected_parse_string_list_method = new ReflectionMethod( 'Google\Site_Kit\Tests\Core\Modules\FakeModule', 'parse_string_list' );
		$reflected_parse_string_list_method->setAccessible( true );

		$empty_values = array( array(), '', 5 );
		foreach ( $empty_values as $empty_value ) {
			$result = $reflected_parse_string_list_method->invoke( $module, $empty_value );
				$this->assertTrue( is_array( $result ), 'Parser should always return an array for empty values.' );
				$this->assertEmpty( $result, 'Parser should return empty list for empty values.' );
		}

		$result = $reflected_parse_string_list_method->invoke( $module, 'one,two,, , three' );
		$this->assertTrue( is_array( $result ), 'Parser should return array for comma-separated string.' );
		$this->assertEquals( 3, count( $result ), 'Parser should remove empty string entries.' );
		$this->assertEquals( 'one', $result[0], 'Parser should preserve first string entry.' );
		$this->assertEquals( 'two', $result[1], 'Parser should preserve second string entry.' );
		$this->assertEquals( 'three', $result[2], 'Parser should trim third string entry.' );

		$data   = array(
			'one',
			5,
			array(),
			'two ',
			'          three              ',
			null,
		);
		$result = $reflected_parse_string_list_method->invoke( $module, $data );
		$this->assertTrue( is_array( $result ), 'Parser should return array for mixed input list.' );
		$this->assertEquals( 3, count( $result ), 'Parser should remove non-string list entries.' );
		$this->assertEquals( 'one', $result[0], 'Parser should preserve first list string.' );
		$this->assertEquals( 'two', $result[1], 'Parser should trim second list string.' );
		$this->assertEquals( 'three', $result[2], 'Parser should trim third list string.' );
	}

	public function test_is_shareable() {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertTrue( $module->is_shareable(), 'Fake module should be shareable by default.' );
	}

	public function test_is_recoverable() {
		remove_all_filters( 'googlesitekit_is_module_recoverable' );
		$module      = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$invocations = array();
		$spy         = function ( ...$args ) use ( &$invocations ) {
			$invocations[] = $args;
			return $args[0];
		};

		// is_recoverable is a proxy through this filter which is handled by
		// Modules::is_module_recoverable. @see \Google\Site_Kit\Tests\Core\Modules\ModulesTest::test_is_module_recoverable
		add_filter( 'googlesitekit_is_module_recoverable', $spy, 10, 2 );

		$module->is_recoverable();

		$this->assertCount( 1, $invocations, 'Recoverable check should invoke filter once.' );
		list ( $given, $slug ) = $invocations[0];
		$this->assertFalse( $given, 'Recoverable filter should receive default false value.' );
		$this->assertEquals( $module->slug, $slug, 'Recoverable filter should receive module slug.' );
	}

	/**
	 * Determine the difference between the expected and the returned date.
	 *
	 * @param int $offset Days the range should be offset by. Default 1. Used by Search Console where
	 *                data is delayed by two days.
	 * @param int $period_requested Number of days being requested.
	 * @param int $calculated_end Timestamp of the calculated end of the period.
	 *
	 * @return int $calculated_diff The difference in days between the expected end date and the calculated end date.
	 */
	private function calculate_diff_from_expected( $offset, $period_requested, $calculated_end ) {
		// Expected end of the previous period is: current date - $period_requested - $offset.
		$expected_end = strtotime( $offset . ' days ago' ) - ( $period_requested * DAY_IN_SECONDS );

		// Convert to a date, then back to timestamp for comparison (rounds to nearest day).
		$expected_end_date   = gmdate( 'Y-m-d', $expected_end );
		$calculated_end_date = gmdate( 'Y-m-d', $calculated_end );

		// Return the difference in days.
		return ( strtotime( $expected_end_date ) - strtotime( $calculated_end_date ) ) / DAY_IN_SECONDS;
	}
}
