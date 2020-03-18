<?php
/**
 * ModuleTest
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google_Service_Exception;
use Exception;

/**
 * @group Modules
 */
class ModuleTest extends TestCase {

	const MODULE_CLASS_NAME = '\Google\Site_Kit\Core\Modules\Module';

	public function test_register() {
		// The register method is abstract and required by any implementation
		$method = new \ReflectionMethod( self::MODULE_CLASS_NAME, 'register' );
		$this->assertTrue( $method->isAbstract() );
	}

	public function test_magic_methods() {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Check that some defaults are correct.
		$this->assertFalse( $module->force_active );
		$this->assertFalse( $module->internal );

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

		$this->assertTrue( isset( $module->slug ) );
		$this->assertTrue( isset( $module->name ) );
		$this->assertTrue( isset( $module->description ) );

		$this->assertEquals( 'module-slug', $module->slug );
		$this->assertEquals( 'module name', $module->name );
		$this->assertEquals( 'module description', $module->description );

		$this->assertFalse( isset( $module->non_existent ) );
		$this->assertNull( $module->non_existent );
	}

	public function test_prepare_info_for_js() {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$keys   = array(
			'slug',
			'name',
			'description',
			'cta',
			'sort',
			'homepage',
			'learnMore',
			'group',
			'feature',
			'module_tags',
			'required',
			'autoActivate',
			'internal',
			'screenID',
			'settings',
		);

		$this->assertEqualSets( $keys, array_keys( $module->prepare_info_for_js() ) );
	}

	public function test_is_connected() {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// A module being connected means that all steps required as part of its activation are completed.
		// Modules are considered connected by default, and each module has its own logic for this.
		$this->assertTrue( $module->is_connected() );
	}

	public function test_get_data() {
		// get_data is a wrapper for the protected execute_data_request method.
		$method = new \ReflectionMethod( self::MODULE_CLASS_NAME, 'get_data' );
		// Make assertions that affect backwards compatibility
		$this->assertTrue( $method->isPublic() );
		// Number of parameters can increase while preserving B/C, but not decrease
		$this->assertEquals( 2, $method->getNumberOfParameters() );
		// Number of required parameters can decrease while preserving B/C, but not increase
		$this->assertEquals( 1, $method->getNumberOfRequiredParameters() );

		$module   = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$response = $module->get_data( 'test-request', array( 'foo' => 'bar' ) );
		$this->assertInternalType( 'object', $response );
		$this->assertEquals( 'GET', $response->method );
		$this->assertEquals( 'test-request', $response->datapoint );
		$this->assertEquals( array( 'foo' => 'bar' ), (array) $response->data );

		// Test that $data is available in parse_data_response
		$response = $module->get_data(
			'test-request',
			array(
				'foo'     => 'bar',
				'asArray' => true,
			)
		);
		$this->assertInternalType( 'array', $response );
		$this->assertEquals( 'GET', $response['method'] );
		$this->assertEquals( 'test-request', $response['datapoint'] );
		$this->assertEquals(
			array(
				'foo'     => 'bar',
				'asArray' => true,
			),
			$response['data']
		);
	}

	public function test_set_data() {
		// set_data is a wrapper for the protected execute_data_request method.
		$method = new \ReflectionMethod( self::MODULE_CLASS_NAME, 'set_data' );
		// Make assertions that affect backwards compatibility
		$this->assertTrue( $method->isPublic() );
		// Number of parameters can increase while preserving B/C, but not decrease
		$this->assertEquals( 2, $method->getNumberOfParameters() );
		// Number of required parameters can decrease while preserving B/C, but not increase
		$this->assertEquals( 2, $method->getNumberOfRequiredParameters() );
	}

	public function test_get_batch_data() {
		// get_batch_data is a wrapper for the protected execute_data_request method.
		$method = new \ReflectionMethod( self::MODULE_CLASS_NAME, 'get_batch_data' );
		// Make assertions that affect backwards compatibility
		$this->assertTrue( $method->isPublic() );
		// Number of parameters can increase while preserving B/C, but not decrease
		$this->assertEquals( 1, $method->getNumberOfParameters() );
		// Number of required parameters can decrease while preserving B/C, but not increase
		$this->assertEquals( 1, $method->getNumberOfRequiredParameters() );

		$module          = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$batch_responses = $module->get_batch_data(
			array(
				new Data_Request(
					'GET',
					'modules',
					$module->slug,
					'test-request',
					array( 'foo' => 'bar' ),
					'request-1'
				),
				new Data_Request(
					'GET',
					'modules',
					$module->slug,
					'test-request',
					array( 'bar' => 'baz' ),
					'request-2'
				),
			)
		);
		$response        = $batch_responses['request-1'];
		$this->assertEquals( 'GET', $response->method );
		$this->assertEquals( 'test-request', $response->datapoint );
		$this->assertEquals( array( 'foo' => 'bar' ), (array) $response->data );
		$response = $batch_responses['request-2'];
		$this->assertEquals( 'GET', $response->method );
		$this->assertEquals( 'test-request', $response->datapoint );
		$this->assertEquals( array( 'bar' => 'baz' ), (array) $response->data );
	}

	public function test_get_datapoints() {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array( 'test-request' ),
			$module->get_datapoints()
		);
	}

	public function test_exception_to_error() {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Regular exception.
		$exception = new Exception( 'This is an error.' );
		$error     = $module->exception_to_error( $exception, 'test' );
		$this->assertWPError( $error, 'This is an error.' );
		$this->assertSame( 'unknown', $error->get_error_code() );
		$this->assertEqualSetsWithIndex(
			array(
				'status' => 500,
				'reason' => '',
			),
			$error->get_error_data()
		);

		// Google service exception without JSON response body.
		$exception = new Google_Service_Exception( 'FATAL', 500 );
		$this->assertWPError( $error, 'FATAL' );
		$this->assertSame( 500, $error->get_error_code() );
		$this->assertEqualSetsWithIndex(
			array(
				'status' => 500,
				'reason' => '',
			),
			$error->get_error_data()
		);

		// Google service exception with JSON response body.
		$response_errors = array(
			array(
				'message' => 'Bad request.',
				'reason'  => 'Insufficient permissions.',
			),
		);
		$exception       = new Google_Service_Exception( json_encode( $response_errors ), 400, null, $response_errors );
		$this->assertWPError( $error, $response_errors[0]['message'] );
		$this->assertSame( 400, $error->get_error_code() );
		$this->assertEqualSetsWithIndex(
			array(
				'status' => 400,
				'reason' => $response_errors[0]['reason'],
			),
			$error->get_error_data()
		);
	}
}
