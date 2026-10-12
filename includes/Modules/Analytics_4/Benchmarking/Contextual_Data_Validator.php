<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Contextual_Data_Validator
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Benchmarking;

/**
 * Keeps only the keys and rows of the contextual data that the benchmarking
 * response defines.
 *
 * Any plugin can add a callback to the `googlesitekit_benchmarking_contextual_data`
 * filter, so what a callback returns is checked before it is ranked or sent
 * to the browser.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Contextual_Data_Validator {

	/**
	 * The fields of a row, and the type of each, keyed by dimension code.
	 *
	 * A `CONTENT` row has `current` and `previous` rather than `visitors`
	 * because the rows are validated before they are scored.
	 *
	 * @since n.e.x.t
	 */
	const ROW_FIELDS = array(
		'CHANNELS'       => array(
			'label'    => 'string',
			'current'  => 'count',
			'previous' => 'count',
		),
		'DEVICES'        => array(
			'label'    => 'string',
			'current'  => 'count',
			'previous' => 'count',
		),
		'VISITOR_MIX'    => array(
			'label'    => 'string',
			'current'  => 'count',
			'previous' => 'count',
		),
		'REFERRERS'      => array(
			'label'    => 'string',
			'current'  => 'count',
			'previous' => 'count',
		),
		'SEARCH_QUERIES' => array(
			'label'            => 'string',
			'current'          => 'count',
			'previous'         => 'count',
			'positionCurrent'  => 'position',
			'positionPrevious' => 'position',
		),
		'CONTENT'        => array(
			'url'              => 'string',
			'title'            => 'string',
			'publishedDaysAgo' => 'count',
			'current'          => 'count',
			'previous'         => 'count',
		),
		'CATEGORIES'     => array(
			'label'    => 'string',
			'current'  => 'count',
			'previous' => 'count',
		),
	);

	/**
	 * Validates contextual data returned by a filter callback.
	 *
	 * A key the response doesn't define is removed, and so is a key whose
	 * value isn't a list. A row that misses a field, or has a value of the
	 * wrong type, is removed, and the other rows of its key are kept.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $contextual_data The rows, keyed by `contextualData` key, such as `channels`.
	 * @return array The valid rows, keyed by `contextualData` key. Each row has only the fields its key defines, with a count as an integer and an average position as a float or `null`.
	 */
	public function validate( array $contextual_data ) {
		$validated_data = array();

		foreach ( Wire_Format::CONTEXTUAL_DATA_KEYS as $dimension_code => $contextual_data_key ) {
			if ( ! isset( $contextual_data[ $contextual_data_key ] ) || ! wp_is_numeric_array( $contextual_data[ $contextual_data_key ] ) ) {
				continue;
			}

			$validated_rows = array();

			foreach ( $contextual_data[ $contextual_data_key ] as $row ) {
				$validated_row = $this->validate_row( self::ROW_FIELDS[ $dimension_code ], $row );

				if ( null !== $validated_row ) {
					$validated_rows[] = $validated_row;
				}
			}

			$validated_data[ $contextual_data_key ] = $validated_rows;
		}

		return $validated_data;
	}

	/**
	 * Validates one row against the fields of its key.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $fields The fields the row must have, and the type of each.
	 * @param mixed $row    The row a filter callback returned.
	 * @return array|null The row with only its defined fields, each cast to its type, or `null` when the row is not valid.
	 */
	private function validate_row( array $fields, $row ) {
		if ( ! is_array( $row ) ) {
			return null;
		}

		$validated_row = array();

		foreach ( $fields as $field => $type ) {
			if ( ! array_key_exists( $field, $row ) ) {
				return null;
			}

			$value = $row[ $field ];

			// A query missing from one period has no average position in it.
			if ( 'position' === $type && null === $value ) {
				$validated_row[ $field ] = null;
				continue;
			}

			if ( 'string' === $type ) {
				if ( ! is_scalar( $value ) ) {
					return null;
				}

				$validated_row[ $field ] = (string) $value;
				continue;
			}

			// `is_numeric()` accepts `NAN` and `INF`, which `wp_json_encode()`
			// can't encode, so one such value would break the whole response.
			if ( ! is_numeric( $value ) || ! is_finite( (float) $value ) ) {
				return null;
			}

			$validated_row[ $field ] = 'position' === $type ? (float) $value : (int) $value;
		}

		return $validated_row;
	}
}
