<?php
/**
 * Class Google\Site_Kit\Modules\Search_Console\Datapoints\SearchAnalytics
 *
 * @package   Google\Site_Kit\Modules\Search_Console\Datapoints
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Search_Console\Datapoints;

use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\Modules\Shareable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\SearchAnalyticsQueryResponse;

/**
 * Datapoint class for Search Console searchanalytics requests.
 *
 * @since 1.170.0
 * @access private
 * @ignore
 */
class SearchAnalytics extends Shareable_Datapoint implements Executable_Datapoint {

	const REQUEST_METHODS = array( 'GET' );
	const REST_METHODS    = array( 'GET' );
	const DATAPOINT       = 'searchanalytics';

	/**
	 * Callback to prepare request arguments.
	 *
	 * @since 1.170.0
	 * @var callable
	 */
	private $prepare_args;

	/**
	 * Callback to create the Search Console request instance.
	 *
	 * @since 1.170.0
	 * @var callable
	 */
	private $create_request;

	/**
	 * Constructor.
	 *
	 * @since 1.170.0
	 *
	 * @param array $definition Datapoint definition.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->prepare_args   = isset( $definition['prepare_args'] ) ? $definition['prepare_args'] : null;
		$this->create_request = isset( $definition['create_request'] ) ? $definition['create_request'] : null;
	}

	/**
	 * Creates a request object.
	 *
	 * @since 1.170.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request instance.
	 */
	public function create_request( Data_Request $data_request ) {
		$args = is_callable( $this->prepare_args ) ? call_user_func( $this->prepare_args, $data_request->data ) : array();

		return is_callable( $this->create_request ) ? call_user_func( $this->create_request, $args ) : null;
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.170.0
	 *
	 * @param mixed        $response Request response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed Parsed response data.
	 */
	public function parse_response( $response, Data_Request $data ) {
		if ( $response instanceof SearchAnalyticsQueryResponse ) {
			return $response->getRows();
		}

		if ( is_object( $response ) && method_exists( $response, 'getRows' ) ) {
			return $response->getRows();
		}

		return $response;
	}
}
