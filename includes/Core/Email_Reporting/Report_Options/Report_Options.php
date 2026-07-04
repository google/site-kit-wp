<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Report_Options\Report_Options
 *
 * @package   Google\Site_Kit\Core\Email_Reporting\Report_Options
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting\Report_Options;

/**
 * Base helper for building email reporting report options.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
abstract class Report_Options {

	/**
	 * Current period date range.
	 *
	 * @since 1.167.0
	 *
	 * @var array
	 */
	private $current_range;

	/**
	 * Compare period date range.
	 *
	 * @since 1.167.0
	 *
	 * @var array
	 */
	private $compare_range;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
	 *
	 * @param array $date_range    Current period range array containing `startDate` and `endDate`.
	 * @param array $compare_range Optional. Compare period range array containing `startDate` and `endDate`.
	 * @throws \InvalidArgumentException When the required date range payload is missing.
	 */
	public function __construct( $date_range, $compare_range = array() ) {
		if ( empty( $date_range ) ) {
			throw new \InvalidArgumentException( 'Email reporting date range is required.' );
		}

		$this->current_range = $this->normalize_range( $date_range, 'date range' );
		$this->compare_range = $this->normalize_range(
			$this->extract_compare_range( $date_range, $compare_range ),
			'compare date range'
		);
	}

	/**
	 * Applies the current (and optional compare) date range to the report options.
	 *
	 * @since 1.167.0
	 *
	 * @param array $options         Base report options.
	 * @param bool  $include_compare Optional. Whether to include compare dates. Default false.
	 * @return array Report request options array with applied date ranges.
	 */
	protected function with_current_range( $options, $include_compare = false ) {
		$options['startDate'] = $this->current_range['startDate'];
		$options['endDate']   = $this->current_range['endDate'];

		if ( $include_compare ) {
			$options['compareStartDate'] = $this->compare_range['startDate'];
			$options['compareEndDate']   = $this->compare_range['endDate'];
		}

		return $options;
	}

	/**
	 * Gets a combined range spanning compare start to current end.
	 *
	 * @since 1.167.0
	 *
	 * @return array Combined date range spanning compare start to current end.
	 */
	protected function get_combined_range() {
		return array(
			'startDate' => $this->compare_range['startDate'],
			'endDate'   => $this->current_range['endDate'],
		);
	}

	/**
	 * Gets the current period range values.
	 *
	 * @since 1.167.0
	 *
	 * @return array Current period range array.
	 */
	protected function get_current_range_values() {
		return $this->current_range;
	}

	/**
	 * Gets the compare period range values.
	 *
	 * @since 1.167.0
	 *
	 * @return array Compare period range array.
	 */
	protected function get_compare_range_values() {
		return $this->compare_range;
	}

	/**
	 * Normalizes and validates the provided range.
	 *
	 * @since 1.167.0
	 *
	 * @param array  $range Potential date range.
	 * @param string $label Human friendly label used in exceptions.
	 * @throws \InvalidArgumentException When required start or end dates are absent.
	 * @return array Normalized date range array.
	 */
	private function normalize_range( $range, $label ) {
		if ( empty( $range['startDate'] ) || empty( $range['endDate'] ) ) {
			throw new \InvalidArgumentException(
				sprintf( 'Email reporting %s must include startDate and endDate.', $label )
			);
		}

		return array(
			'startDate' => $range['startDate'],
			'endDate'   => $range['endDate'],
		);
	}

	/**
	 * Extracts the compare range array.
	 *
	 * @since 1.167.0
	 *
	 * @param array $date_range    Current period range (possibly containing compare keys).
	 * @param array $compare_range Explicit compare range override.
	 * @return array Compare range payload.
	 */
	private function extract_compare_range( $date_range, $compare_range ) {
		if ( ! empty( $compare_range ) ) {
			return $compare_range;
		}

		$keys = array(
			'startDate' => $date_range['compareStartDate'] ?? null,
			'endDate'   => $date_range['compareEndDate'] ?? null,
		);

		return $keys;
	}
}
