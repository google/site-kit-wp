<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Set_Google_Tag_ID_MismatchTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Set_Google_Tag_ID_Mismatch;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Set_Google_Tag_ID_MismatchTest extends TestCase {

	/**
	 * Set_Google_Tag_ID_Mismatch datapoint instance.
	 *
	 * @var Set_Google_Tag_ID_Mismatch
	 */
	private $datapoint;

	/**
	 * Transients instance.
	 *
	 * @var Transients
	 */
	private $transients;

	public function set_up() {
		parent::set_up();

		$context          = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->transients = new Transients( $context );
		$this->datapoint  = new Set_Google_Tag_ID_Mismatch(
			array(
				'transients' => $this->transients,
				'service'    => '',
			)
		);
	}

	public function test_create_request__requires_has_mismatched_tag() {
		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'set-google-tag-id-mismatch',
			array()
		);

		$this->expectException( Missing_Required_Param_Exception::class );
		$this->expectExceptionMessage( 'Request parameter is empty: hasMismatchedTag.' );
		$this->datapoint->create_request( $data_request );
	}

	public function test_create_request__sets_transient_when_mismatched() {
		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'set-google-tag-id-mismatch',
			array(
				'hasMismatchedTag' => 'GT-MISMATCH',
			)
		);

		$request  = $this->datapoint->create_request( $data_request );
		$response = $request();

		$this->assertEquals( 'GT-MISMATCH', $response, 'The datapoint should return the hasMismatchedTag value.' );
		$this->assertEquals( 'GT-MISMATCH', $this->transients->get( 'googlesitekit_inline_tag_id_mismatch' ), 'The transient should be set with the hasMismatchedTag value.' );
	}

	public function test_create_request__deletes_transient_when_not_mismatched() {
		// First set the transient.
		$this->transients->set( 'googlesitekit_inline_tag_id_mismatch', 'GT-MISMATCH' );

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'set-google-tag-id-mismatch',
			array(
				'hasMismatchedTag' => false,
			)
		);

		$request  = $this->datapoint->create_request( $data_request );
		$response = $request();

		$this->assertFalse( $response, 'The datapoint should return false when hasMismatchedTag is false.' );
		$this->assertFalse( $this->transients->get( 'googlesitekit_inline_tag_id_mismatch' ), 'The transient should be deleted when hasMismatchedTag is false.' );
	}

	public function test_parse_response() {
		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'set-google-tag-id-mismatch', array() );
		$test_data    = 'GT-ABCD';

		$this->assertSame( $test_data, $this->datapoint->parse_response( $test_data, $data_request ), 'The `parse_response` method should return the response unchanged.' );
	}
}
