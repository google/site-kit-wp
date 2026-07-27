<?php
/**
 * Data_RequestTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\REST_API;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Tests\TestCase;

class Data_RequestTest extends TestCase {
	public function test_get_method() {
		$data = new Data_Request( 'GET' );

		$this->assertEquals( 'GET', $data->method, 'Request method should retain an uppercase input.' );

		// Method is always returned in all caps.
		$data = new Data_Request( 'post' );

		$this->assertEquals( 'POST', $data->method, 'Request method should normalize lowercase input to uppercase.' );
	}

	public function test_get_type() {
		$data = new Data_Request( 'GET', 'test-type' );

		$this->assertEquals( 'test-type', $data->type, 'Request should retain its data type.' );
	}

	public function test_get_identifier() {
		$data = new Data_Request( 'GET', 'test-type', 'test-identifier' );

		$this->assertEquals( 'test-identifier', $data->identifier, 'Request should retain its data identifier.' );
	}

	public function test_get_datapoint() {
		$data = new Data_Request( 'GET', 'test-type', 'test-identifier', 'test-datapoint' );

		$this->assertEquals( 'test-datapoint', $data->datapoint, 'Request should retain its datapoint.' );
	}

	public function test_get_data() {
		$data_a = new Data_Request( 'GET', 'test-type', 'test-identifier', 'test-datapoint', array( 'test-data' ) );

		$this->assertEquals( array( 'test-data' ), $data_a->data, 'Request should retain array data.' );

		// Data can come from another Data Request.
		$data_b = new Data_Request( 'GET', 'test-type', 'test-identifier', 'test-datapoint', $data_a );

		$this->assertEquals( array( 'test-data' ), $data_b->data, 'Request should inherit data from another data request.' );
	}

	public function test_get_key() {
		$data = new Data_Request( 'GET', 'test-type', 'test-identifier', 'test-datapoint', array(), 'test-key' );

		$this->assertEquals( 'test-key', $data->key, 'Request should retain its cache key.' );
	}

	public function test_array_access() {
		$data = new Data_Request( 'GET', 'test-type', 'test-identifier', 'test-datapoint', array( 'test-key' => 'test-data' ) );

		$this->assertEquals( 'test-data', $data['test-key'], 'Request data should be readable through array access.' );

		// Data cannot be mutated.
		$data['test-key'] = 'new value';
		$this->assertEquals( 'test-data', $data['test-key'], 'Array assignment should not mutate request data.' );
		unset( $data['test-key'] );
		$this->assertEquals( 'test-data', $data['test-key'], 'Array unsetting should not mutate request data.' );

		// Non-existent keys have null values.
		$this->assertNull( $data['non-existent-key'], 'Unknown request data keys should return null.' );
	}
}
