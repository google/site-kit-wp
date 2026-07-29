<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Conversion_Insights
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use WP_Error;

/**
 * Class for the AI Conversion Insights (Site Goals) datapoint.
 *
 * The plugin preprocesses GA4 metrics client-side and posts the pre-shaped `events`
 * payload here; this datapoint forwards it to the Site Kit service's generative
 * `/v1/ai/conversion-insights` endpoint (with site + user auth) and returns the insights.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Get_Conversion_Insights extends Shareable_Datapoint implements Executable_Datapoint {

	/**
	 * Authentication instance.
	 *
	 * @since n.e.x.t
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		$this->authentication = $definition['authentication'];
	}

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable|WP_Error Closure that returns the service response, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data_request ) {
		if (
			! $this->authentication->is_authenticated()
			|| ! $this->authentication->credentials()->using_proxy()
		) {
			return new WP_Error(
				'forbidden',
				__( 'Conversion Insights are only available on proxy-connected sites.', 'google-site-kit' ),
				array( 'status' => 403 )
			);
		}

		$events = isset( $data_request['events'] ) ? $data_request['events'] : array();

		// The endpoint analyzes a batch of key events; an empty batch has nothing to generate.
		if ( empty( $events ) || ! is_array( $events ) ) {
			return new WP_Error(
				'missing_required_param',
				__( 'Request is missing required parameter: events.', 'google-site-kit' ),
				array( 'status' => 400 )
			);
		}

		$proxy        = $this->authentication->get_google_proxy();
		$credentials  = $this->authentication->credentials();
		$access_token = (string) $this->authentication->get_oauth_client()->get_access_token();

		return function () use ( $proxy, $credentials, $access_token, $events ) {
			return $proxy->get_conversion_insights( $credentials, $access_token, $events );
		};
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The response without any modifications.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
