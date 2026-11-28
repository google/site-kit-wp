<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Datapoints\Conversion_Insight_Reader
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Datapoints;

use WP_Error;

/**
 * Reads the generated Site Goals insight, for `POST:conversion-insights`,
 * which asks for the insight, and `GET:conversion-insights`, which reads the
 * operation that generates it.
 *
 * @since 1.193.0
 * @access private
 * @ignore
 */
class Conversion_Insight_Reader extends AI_Insight_Reader {

	/**
	 * The code of the error for an answer the reader can't read.
	 *
	 * @since 1.193.0
	 */
	const INVALID_RESPONSE_ERROR_CODE = 'invalid_conversion_insight_response';

	/**
	 * The code of the error for an operation that failed to generate the
	 * insight.
	 *
	 * @since n.e.x.t
	 */
	const FAILED_OPERATION_ERROR_CODE = 'conversion_insight_failed';

	/**
	 * Reads the insight from the service's answer.
	 *
	 * The service writes one insight for the one entry the request sends, so
	 * the insight is the first entry of `insights`. An insight without a
	 * `text` is an answer the reader can't read, rather than an empty insight,
	 * and an `actionableRecommendation` that isn't a string is null.
	 * `interactionID` and `scenario` are the ones the feedback endpoint checks
	 * a vote against, so they pass through unchanged too.
	 *
	 * @since 1.193.0
	 *
	 * @param array $response The service's answer, or the response of a succeeded operation.
	 * @return array|null|WP_Error The insight, with `interactionID`, `scenario`, `code`, `text` and `actionableRecommendation`; null when the service wrote no insight: `insights` is missing or empty, its first entry isn't an object, or that entry has the code `NO_INSIGHT`; or an error with status 500 when the insight has no `text`.
	 */
	public function read( array $response ) {
		$entry = $response['insights'][0] ?? null;

		if ( ! is_array( $entry ) || 'NO_INSIGHT' === ( $entry['code'] ?? null ) ) {
			return null;
		}

		if ( ! isset( $entry['text'] ) || ! is_string( $entry['text'] ) || '' === $entry['text'] ) {
			return $this->get_invalid_response_error();
		}

		return array(
			'interactionID'            => $this->get_string( $response, 'interaction_id' ),
			'scenario'                 => $this->get_string( $response, 'scenario' ),
			'code'                     => $this->get_string( $entry, 'code' ),
			'text'                     => $entry['text'],
			'actionableRecommendation' => $this->get_string( $entry, 'actionable_recommendation' ),
		);
	}

	/**
	 * Gets a field of the service's answer that the browser reads as text.
	 *
	 * @since 1.193.0
	 *
	 * @param array  $entry The answer, or the entry of `insights`, the field is in.
	 * @param string $field The name of the field.
	 * @return string|null The field, or null when it is missing or not a string.
	 */
	private function get_string( array $entry, $field ) {
		return isset( $entry[ $field ] ) && is_string( $entry[ $field ] ) ? $entry[ $field ] : null;
	}
}
