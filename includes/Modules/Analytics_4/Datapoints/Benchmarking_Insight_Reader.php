<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Benchmarking_Insight_Reader
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use WP_Error;

/**
 * Reads the generated benchmarking insight, for `POST:benchmarking-insight`,
 * which asks for the insight, and `GET:benchmarking-insight`, which reads the
 * operation that generates it.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Benchmarking_Insight_Reader extends AI_Insight_Reader {

	/**
	 * The code of the error for an answer the reader can't read.
	 *
	 * @since n.e.x.t
	 */
	const INVALID_RESPONSE_ERROR_CODE = 'invalid_benchmarking_insight_response';

	/**
	 * The code of the error for an operation that failed to generate the
	 * insight.
	 *
	 * @since n.e.x.t
	 */
	const FAILED_OPERATION_ERROR_CODE = 'benchmarking_insight_failed';

	/**
	 * The fields of an insight, keyed by their names in the service's response.
	 *
	 * @since n.e.x.t
	 */
	const INSIGHT_FIELDS = array(
		'scenario'       => 'scenario',
		'teaser'         => 'teaser',
		'analysis'       => 'analysis',
		'driver'         => 'driver',
		'interaction_id' => 'interactionID',
		'model_version'  => 'modelVersion',
	);

	/**
	 * Reads the insight from the fields the service generated.
	 *
	 * A field the service left empty, such as a teaser it didn't write, is
	 * null. The service always writes an analysis or a driver, so an insight
	 * with neither is an answer the reader can't read.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $response The service's answer, or the response of a succeeded operation.
	 * @return array|WP_Error The insight, with `scenario`, `teaser`, `analysis`, `driver`, `interactionID` and `modelVersion`, or an error with status 500 when it has neither an analysis nor a driver.
	 */
	public function read( array $response ) {
		$insight = array();

		foreach ( self::INSIGHT_FIELDS as $field => $key ) {
			$insight[ $key ] = isset( $response[ $field ] ) && is_string( $response[ $field ] ) && '' !== $response[ $field ]
				? $response[ $field ]
				: null;
		}

		if ( null === $insight['analysis'] && null === $insight['driver'] ) {
			return $this->get_invalid_response_error();
		}

		return $insight;
	}
}
