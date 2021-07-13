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
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google_Service_Exception;
use Exception;
use ReflectionMethod;

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
			'sort',
			'homepage',
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

	/**
	 * @dataProvider data_site_hosts
	 */
	public function test_permute_site_hosts( $hostname, $expected ) {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$method = new ReflectionMethod( $module, 'permute_site_hosts' );
		$method->setAccessible( true );
		$permute_site_hosts = function ( ...$args ) use ( $module, $method ) {
			return $method->invoke( $module, ...$args );
		};

		$this->assertEqualSets(
			$expected,
			$permute_site_hosts( $hostname )
		);
	}

	public function data_site_hosts() {
		return array(
			'example.com'              => array(
				'example.com',
				array(
					'example.com',
					'www.example.com',
				),
			),
			'www.example.com'          => array(
				'www.example.com',
				array(
					'example.com',
					'www.example.com',
				),
			),
			'éxämplę.test'             => array(
				'éxämplę.test',
				array(
					'éxämplę.test',
					'www.éxämplę.test',
					'xn--xmpl-loa2a55a.test',
					'www.xn--xmpl-loa2a55a.test',
				),
			),
			'éxämplę.test as punycode' => array(
				'xn--xmpl-loa2a55a.test',
				array(
					'éxämplę.test',
					'www.éxämplę.test',
					'xn--xmpl-loa2a55a.test',
					'www.xn--xmpl-loa2a55a.test',
				),
			),
		);
	}

	/**
	 * @dataProvider data_site_urls
	 */
	public function test_permute_site_url( $site_url, $expected ) {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$method = new ReflectionMethod( $module, 'permute_site_url' );
		$method->setAccessible( true );
		$permute_site_url = function ( ...$args ) use ( $module, $method ) {
			return $method->invoke( $module, ...$args );
		};

		$this->assertEqualSets(
			$expected,
			$permute_site_url( $site_url )
		);
	}

	public function data_site_urls() {
		return array(
			'http://éxämplę.test'               => array(
				'http://éxämplę.test',
				array(
					'http://éxämplę.test',
					'https://éxämplę.test',
					'http://www.éxämplę.test',
					'https://www.éxämplę.test',
					'http://xn--xmpl-loa2a55a.test',
					'https://xn--xmpl-loa2a55a.test',
					'http://www.xn--xmpl-loa2a55a.test',
					'https://www.xn--xmpl-loa2a55a.test',
				),
			),
			'http://éxämplę.test/sub-directory' => array(
				'http://éxämplę.test/sub-directory',
				array(
					'http://éxämplę.test/sub-directory',
					'https://éxämplę.test/sub-directory',
					'http://www.éxämplę.test/sub-directory',
					'https://www.éxämplę.test/sub-directory',
					'http://xn--xmpl-loa2a55a.test/sub-directory',
					'https://xn--xmpl-loa2a55a.test/sub-directory',
					'http://www.xn--xmpl-loa2a55a.test/sub-directory',
					'https://www.xn--xmpl-loa2a55a.test/sub-directory',
				),
			),
			'http://éxämplę.test/sub-directory as punycode' => array(
				'http://xn--xmpl-loa2a55a.test/sub-directory',
				array(
					'http://éxämplę.test/sub-directory',
					'https://éxämplę.test/sub-directory',
					'http://www.éxämplę.test/sub-directory',
					'https://www.éxämplę.test/sub-directory',
					'http://xn--xmpl-loa2a55a.test/sub-directory',
					'https://xn--xmpl-loa2a55a.test/sub-directory',
					'http://www.xn--xmpl-loa2a55a.test/sub-directory',
					'https://www.xn--xmpl-loa2a55a.test/sub-directory',
				),
			),
		);
	}

	public function test_exception_to_error() {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Regular exception.
		$exception = new Exception( 'This is an error.' );
		$error     = $module->exception_to_error( $exception, 'test' );
		$this->assertWPErrorWithMessage( 'This is an error.', $error );
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
		$error     = $module->exception_to_error( $exception, 'test' );
		$this->assertWPErrorWithMessage( 'FATAL', $error );
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
		$error           = $module->exception_to_error( $exception, 'test' );
		$this->assertWPErrorWithMessage( $response_errors[0]['message'], $error );
		$this->assertSame( 400, $error->get_error_code() );
		$this->assertEqualSetsWithIndex(
			array(
				'status' => 400,
				'reason' => $response_errors[0]['reason'],
			),
			$error->get_error_data()
		);
	}

	public function test_parse_string_list() {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$reflected_parse_string_list_method = new ReflectionMethod( 'Google\Site_Kit\Tests\Core\Modules\FakeModule', 'parse_string_list' );
		$reflected_parse_string_list_method->setAccessible( true );

		$empty_values = array( array(), '', 5 );
		foreach ( $empty_values as $empty_value ) {
			$result = $reflected_parse_string_list_method->invoke( $module, $empty_value );
			$this->assertTrue( is_array( $result ) );
			$this->assertEmpty( $result );
		}

		$result = $reflected_parse_string_list_method->invoke( $module, 'one,two,, , three' );
		$this->assertTrue( is_array( $result ) );
		$this->assertEquals( 3, count( $result ) );
		$this->assertEquals( 'one', $result[0] );
		$this->assertEquals( 'two', $result[1] );
		$this->assertEquals( 'three', $result[2] );

		$data   = array(
			'one',
			5,
			array(),
			'two ',
			'          three              ',
			null,
		);
		$result = $reflected_parse_string_list_method->invoke( $module, $data );
		$this->assertTrue( is_array( $result ) );
		$this->assertEquals( 3, count( $result ) );
		$this->assertEquals( 'one', $result[0] );
		$this->assertEquals( 'two', $result[1] );
		$this->assertEquals( 'three', $result[2] );
	}

	/**
	 * Test that previous dates ranges align by weekday when weekly_align = true.
	 *
	 * Call parse_date_range with previous = true and weekly_align = true.
	 * Test $offset set to 1 and 2 work as expected.
	 *
	 * @dataProvider data_parse_date_range_weekday_align
	 */
	public function test_parse_date_range_weekday_align( $period_requested, $previous_period_end_offset ) {
		$module = new FakeModule( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Test with $offset = 1.
		$result                = $module->parse_date_range( 'last-' . $period_requested . '-days', 1, 1, true, true );
		$previous_end          = strtotime( $result[1] );
		$yesterday_day_of_week = gmdate( 'w', strtotime( 'yesterday' ) );
		$diff                  = $this->calculate_diff_from_expected( 1, $period_requested, $previous_end );
		$previous_day_of_week  = gmdate( 'w', strtotime( $result[1] ) );
		$yesterday_day_of_week = gmdate( 'w', strtotime( 'yesterday' ) );

		$this->assertEquals( $previous_day_of_week, $yesterday_day_of_week );
		$this->assertEquals( $previous_period_end_offset, $diff );

		// Test again with offset = 2.
		$result               = $module->parse_date_range( 'last-' . $period_requested . '-days', 1, 2, true, true );
		$previous_end         = strtotime( $result[1] );
		$last_day_of_week     = gmdate( 'w', strtotime( '2 days ago' ) );
		$diff                 = $this->calculate_diff_from_expected( 2, $period_requested, $previous_end );
		$previous_day_of_week = gmdate( 'w', strtotime( $result[1] ) );
		$last_day_of_week     = gmdate( 'w', strtotime( '2 days ago' ) );

		$this->assertEquals( $previous_day_of_week, $last_day_of_week, 'failed with offfset 2' );
		$this->assertEquals( $previous_period_end_offset, $diff, 'failed with offfset 2' );
	}

	public function data_parse_date_range_weekday_align() {
		return array(
			array(
				7,
				0,
			),
			array(
				8,
				-1, //sun -> mon
			),
			array(
				9,
				-2, // sat -> mon
			),
			array(
				10,
				-3, // fri -> mon
			),
			array(
				11,
				3, // thur -> previous mon
			),
			array(
				12,
				2, // wed -> previous mon
			),
			array(
				13,
				1, // tues -> previous mon
			),
			array(
				14,
				0, // mon === mon
			),
			// Test the ranges offdered in the plugin.
			array(
				7,
				0, // mon === mon
			),
			array(
				28,
				0, // mon === mon
			),
			array(
				90,
				1, // mon -> sun
			),
		);
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
