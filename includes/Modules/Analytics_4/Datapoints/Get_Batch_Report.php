<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Batch_Report
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Analytics_4\Report\Request as Analytics_4_Report_Request;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use Google\Site_Kit_Dependencies\Google\Service\AnalyticsData as Google_Service_AnalyticsData;
use WP_Error;

/**
 * Get batch report datapoint class.
 *
 * @since 1.181.0
 * @access private
 * @ignore
 */
class Get_Batch_Report extends Shareable_Datapoint implements Executable_Datapoint {

	/**
	 * Module settings instance.
	 *
	 * @since 1.181.0
	 * @var Settings
	 */
	private $settings;

	/**
	 * Context instance.
	 *
	 * @since 1.181.0
	 * @var Context
	 */
	private $context;

	/**
	 * Closure that returns whether the current request is for shared data.
	 *
	 * @since 1.181.0
	 * @var \Closure
	 */
	private $is_shared_request;

	/**
	 * Constructor.
	 *
	 * @since 1.181.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->settings          = $definition['settings'];
		$this->context           = $definition['context'];
		$this->is_shared_request = $definition['is_shared_request'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.181.0
	 *
	 * @param Data_Request $data Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data ) {
		if ( empty( $data['requests'] ) ) {
			return new WP_Error(
				'missing_required_param',
				/* translators: %s: Missing parameter name */
				sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'requests' ),
				array( 'status' => 400 )
			);
		}

		if ( ! is_array( $data['requests'] ) || count( $data['requests'] ) > 5 ) {
			return new WP_Error(
				'invalid_batch_size',
				__( 'Batch report requests must be an array with 1-5 requests.', 'google-site-kit' ),
				array( 'status' => 400 )
			);
		}

		$settings = $this->settings->get();
		if ( empty( $settings['propertyID'] ) ) {
			return new WP_Error(
				'missing_required_setting',
				__( 'No connected Google Analytics property ID.', 'google-site-kit' ),
				array( 'status' => 500 )
			);
		}

		$is_shared_request = ( $this->is_shared_request )( $this );

		$batch_requests = array();
		$report         = new Analytics_4_Report_Request( $this->context );

		foreach ( $data['requests'] as $request_data ) {
			$data_request = new Data_Request( 'GET', 'modules', Analytics_4::MODULE_SLUG, 'report', $request_data );
			$request      = $report->create_request( $data_request, $is_shared_request );
			if ( is_wp_error( $request ) ) {
				return $request;
			}
			$batch_requests[] = $request;
		}

		$property_id = Analytics_4::normalize_property_id( $settings['propertyID'] );

		$batch_request = new Google_Service_AnalyticsData\BatchRunReportsRequest();
		$batch_request->setRequests( $batch_requests );

		return $this->get_service()->properties->batchRunReports(
			$property_id,
			$batch_request
		);
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.181.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data Data request object.
	 * @return mixed Parsed response data.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
