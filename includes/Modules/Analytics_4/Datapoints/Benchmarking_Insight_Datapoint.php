<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Benchmarking_Insight_Datapoint
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

/**
 * Base class for the two datapoints of the benchmarking insight:
 * `POST:benchmarking-insight`, which asks for the insight, and
 * `GET:benchmarking-insight`, which reads the operation that generates it.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
abstract class Benchmarking_Insight_Datapoint extends AI_Insight_Datapoint {

	/**
	 * The code of the error for a service response the datapoint can't read.
	 *
	 * @since n.e.x.t
	 */
	const INVALID_RESPONSE_ERROR_CODE = 'invalid_benchmarking_insight_response';

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
	 * Gets the insight from the fields the service generated.
	 *
	 * The texts are the model's output, so they pass through unchanged, and the
	 * browser renders them as text. A field the service left empty, such as a
	 * teaser it didn't write, is null.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $response The service's response, or the response of a succeeded operation.
	 * @return array|null The insight, with `scenario`, `teaser`, `analysis`, `driver`, `interactionID` and `modelVersion`, or null when it has neither an analysis nor a driver.
	 */
	protected function get_insight( $response ) {
		if ( ! is_array( $response ) ) {
			return null;
		}

		$insight = array();

		foreach ( self::INSIGHT_FIELDS as $field => $key ) {
			$insight[ $key ] = isset( $response[ $field ] ) && is_string( $response[ $field ] ) && '' !== $response[ $field ]
				? $response[ $field ]
				: null;
		}

		if ( null === $insight['analysis'] && null === $insight['driver'] ) {
			return null;
		}

		return $insight;
	}
}
