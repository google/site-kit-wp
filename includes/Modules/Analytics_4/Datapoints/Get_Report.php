<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Report
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
use Google\Site_Kit\Modules\Analytics_4\Report\Response as Analytics_4_Report_Response;
use Google\Site_Kit\Modules\Analytics_4\Settings;
use WP_Error;

/**
 * Get report datapoint class.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Report extends Shareable_Datapoint implements Executable_Datapoint {

	/**
	 * Module settings instance.
	 *
	 * @since n.e.x.t
	 * @var Settings
	 */
	private $settings;

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Closure that returns whether the current request is for shared data.
	 *
	 * @since n.e.x.t
	 * @var \Closure
	 */
	private $is_shared_request;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data ) {
		if ( empty( $data['metrics'] ) ) {
			return new WP_Error(
				'missing_required_param',
				/* translators: %s: Missing parameter name */
				sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'metrics' ),
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

		$report  = new Analytics_4_Report_Request( $this->context );
		$request = $report->create_request( $data, ( $this->is_shared_request )( $this ) );
		if ( is_wp_error( $request ) ) {
			return $request;
		}

		$property_id = Analytics_4::normalize_property_id( $settings['propertyID'] );
		$request->setProperty( $property_id );

		return $this->get_service()->properties->runReport( $property_id, $request );
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data Data request object.
	 * @return mixed Parsed response data on success, or WP_Error on failure.
	 */
	public function parse_response( $response, Data_Request $data ) {
		$report = new Analytics_4_Report_Response( $this->context );
		return $report->parse_response( $data, $response );
	}
}
