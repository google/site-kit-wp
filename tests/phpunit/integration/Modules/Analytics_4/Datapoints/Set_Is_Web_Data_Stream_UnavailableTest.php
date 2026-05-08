<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Set_Is_Web_Data_Stream_UnavailableTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Set_Is_Web_Data_Stream_Unavailable;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Set_Is_Web_Data_Stream_UnavailableTest extends TestCase {

	/**
	 * Set_Is_Web_Data_Stream_Unavailable datapoint instance.
	 *
	 * @var Set_Is_Web_Data_Stream_Unavailable
	 */
	private $datapoint;

	/**
	 * Transients instance.
	 *
	 * @var Transients
	 */
	private $transients;

	/**
	 * Analytics_4 instance.
	 *
	 * @var Analytics_4
	 */
	private $analytics;

	public function set_up() {
		parent::set_up();

		$context          = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options          = new Options( $context );
		$user             = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options     = new User_Options( $context, $user->ID );
		$authentication   = new Authentication( $context, $options, $user_options );
		$this->analytics  = new Analytics_4( $context, $options, $user_options, $authentication );
		$this->transients = new Transients( $context );

		$this->datapoint = new Set_Is_Web_Data_Stream_Unavailable(
			array(
				'transients' => $this->transients,
				'settings'   => $this->analytics->get_settings(),
				'service'    => '',
			)
		);
	}

	public function test_create_request__requires_is_web_data_stream_unavailable() {
		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'set-is-web-data-stream-unavailable',
			array()
		);

		$this->expectException( Missing_Required_Param_Exception::class );
		$this->expectExceptionMessage( 'Request parameter is empty: isWebDataStreamUnavailable.' );
		$this->datapoint->create_request( $data_request );
	}

	public function test_create_request__sets_transient_when_unavailable() {
		$web_data_stream_id = '654321';
		$this->analytics->get_settings()->merge(
			array(
				'webDataStreamID' => $web_data_stream_id,
			)
		);

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'set-is-web-data-stream-unavailable',
			array(
				'isWebDataStreamUnavailable' => true,
			)
		);

		$request  = $this->datapoint->create_request( $data_request );
		$response = $request();

		$this->assertTrue( $response, 'The datapoint should return true when isWebDataStreamUnavailable is true.' );
		$transient_key = 'googlesitekit_web_data_stream_unavailable_' . $web_data_stream_id;
		$this->assertTrue( $this->transients->get( $transient_key ), 'The transient should be set when isWebDataStreamUnavailable is true.' );
	}

	public function test_create_request__deletes_transient_when_available() {
		$web_data_stream_id = '654321';
		$this->analytics->get_settings()->merge(
			array(
				'webDataStreamID' => $web_data_stream_id,
			)
		);

		$transient_key = 'googlesitekit_web_data_stream_unavailable_' . $web_data_stream_id;
		// First set the transient.
		$this->transients->set( $transient_key, true );

		$data_request = new Data_Request(
			'POST',
			'modules',
			'analytics-4',
			'set-is-web-data-stream-unavailable',
			array(
				'isWebDataStreamUnavailable' => false,
			)
		);

		$request  = $this->datapoint->create_request( $data_request );
		$response = $request();

		$this->assertFalse( $response, 'The datapoint should return false when isWebDataStreamUnavailable is false.' );
		$this->assertFalse( $this->transients->get( $transient_key ), 'The transient should be deleted when isWebDataStreamUnavailable is false.' );
	}

	public function test_parse_response() {
		$data_request = new Data_Request( 'POST', 'modules', 'analytics-4', 'set-is-web-data-stream-unavailable', array() );

		$this->assertTrue( $this->datapoint->parse_response( true, $data_request ), 'The `parse_response` method should return the response unchanged.' );
		$this->assertFalse( $this->datapoint->parse_response( false, $data_request ), 'The `parse_response` method should return the response unchanged.' );
	}
}
