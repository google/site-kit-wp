<?php
/**
 * Data_RequestTest.php
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Data_Request;
use Google\Site_Kit\Tests\TestCase;

class Data_RequestTest extends TestCase {
	public function test_get_method() {
		$data = new Data_Request( 'GET' );

		$this->assertEquals( 'GET', $data->get_method() );

		// Method is always returned in all caps.
		$data = new Data_Request( 'post' );

		$this->assertEquals( 'POST', $data->get_method() );
	}

	public function test_get_type() {
		$data = new Data_Request( 'GET', 'test-type' );

		$this->assertEquals( 'test-type', $data->get_type() );
	}

	public function test_get_identifier() {
		$data = new Data_Request( 'GET', 'test-type', 'test-identifier' );

		$this->assertEquals( 'test-identifier', $data->get_identifier() );
	}

	public function test_get_datapoint() {
		$data = new Data_Request( 'GET', 'test-type', 'test-identifier', 'test-datapoint' );

		$this->assertEquals( 'test-datapoint', $data->get_datapoint() );
	}

	public function test_get_data() {
		$data_a = new Data_Request( 'GET', 'test-type', 'test-identifier', 'test-datapoint', array( 'test-data' ) );

		$this->assertEquals( array( 'test-data' ), $data_a->get_data() );

		// Data can come from another Data Request.
		$data_b = new Data_Request( 'GET', 'test-type', 'test-identifier', 'test-datapoint', $data_a );

		$this->assertEquals( array( 'test-data' ), $data_b->get_data() );
	}

	public function test_get_key() {
		$data = new Data_Request( 'GET', 'test-type', 'test-identifier', 'test-datapoint', array(), 'test-key' );

		$this->assertEquals( 'test-key', $data->get_key() );
	}

	public function test_array_access() {
		$data = new Data_Request( 'GET', 'test-type', 'test-identifier', 'test-datapoint', array( 'test-key' => 'test-data' ) );

		$this->assertEquals( 'test-data', $data['test-key'] );

		// Data cannot be mutated.
		$data['test-key'] = 'new value';
		$this->assertEquals( 'test-data', $data['test-key'] );

		// Non-existent keys have null values.
		$this->assertNull( $data['non-existent-key'] );
	}
}
