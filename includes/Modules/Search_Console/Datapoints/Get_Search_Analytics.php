<?php
/**
 * Class Google\Site_Kit\Modules\Search_Console\Datapoints\Get_Search_Analytics
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

/**
 * Datapoint class for Search Console searchanalytics requests.
 *
 * @since 1.170.0
 * @since 1.186.0 Renamed from `SearchAnalytics` and refactored onto `Search_Analytics_Trait`.
 * @access private
 * @ignore
 */
class Get_Search_Analytics extends Shareable_Datapoint implements Executable_Datapoint {

	use Search_Analytics_Trait;

	/**
	 * Constructor.
	 *
	 * @since 1.170.0
	 * @since 1.186.0 Replaced request callbacks with the module settings and context.
	 *
	 * @param array $definition Datapoint definition.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );

		$this->settings = $definition['settings'];
		$this->context  = $definition['context'];
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
		$args = $this->prepare_search_analytics_request_args( $data_request->data );

		return $this->create_search_analytics_request( $args );
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
		return $this->parse_search_analytics_rows( $response );
	}
}
