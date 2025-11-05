<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Report_Data_Section_Part
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use InvalidArgumentException;

/**
 * Single email report section part.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Email_Report_Data_Section_Part {

	/**
	 * Unique section key.
	 *
	 * @var string
	 */
	private $section_key;

	/**
	 * Section title.
	 *
	 * @var string
	 */
	private $title;

	/**
	 * Labels for the section rows/series.
	 *
	 * @var array
	 */
	private $labels;

	/**
	 * Values formatted as strings for output.
	 *
	 * @var array
	 */
	private $values;

	/**
	 * Optional trends matching values.
	 *
	 * @var array|null
	 */
	private $trends;

	/**
	 * Optional date range data.
	 *
	 * @var array|null
	 */
	private $date_range;

	/**
	 * Optional dashboard deeplink URL.
	 *
	 * @var string|null
	 */
	private $dashboard_link;

	/**
	 * Constructor.
	 *
	 * @param string      $section_key    Unique section key.
	 * @param string      $title          Section title.
	 * @param array       $labels         Labels (strings) for the section rows/series.
	 * @param array       $values         Values (already formatted to strings for output).
	 * @param array|null  $trends         Optional trends (strings) matching values.
	 * @param array|null  $date_range     Optional date range array with 'startDate' and 'endDate'.
	 * @param string|null $dashboard_link Optional dashboard deeplink.
	 *
	 * @throws InvalidArgumentException When validation fails.
	 */
	public function __construct(
		$section_key,
		$title,
		array $labels,
		array $values,
		$trends = null,
		$date_range = null,
		$dashboard_link = null
	) {
		$section_key = is_string( $section_key ) ? $section_key : '';
		$title       = is_string( $title ) ? $title : '';

		if ( '' === $section_key ) {
			throw new InvalidArgumentException( 'section_key must be a non-empty string' );
		}
		if ( '' === $title ) {
			throw new InvalidArgumentException( 'title must be a non-empty string' );
		}

		$this->labels = array_map( 'strval', $labels );
		$this->values = array_map( 'strval', $values );

		if ( ! is_array( $labels ) ) {
			throw new InvalidArgumentException( 'labels must be an array' );
		}
		if ( ! is_array( $values ) ) {
			throw new InvalidArgumentException( 'values must be an array' );
		}

		if ( null !== $trends ) {
			if ( ! is_array( $trends ) ) {
				throw new InvalidArgumentException( 'trends must be an array or null' );
			}
			$this->trends = array_map( 'strval', $trends );
		} else {
			$this->trends = null;
		}

		if ( null !== $date_range ) {
			if ( ! is_array( $date_range ) ) {
				throw new InvalidArgumentException( 'date_range must be an array or null' );
			}
			// Validate presence of keys if provided.
			$start = isset( $date_range['startDate'] ) ? (string) $date_range['startDate'] : null;
			$end   = isset( $date_range['endDate'] ) ? (string) $date_range['endDate'] : null;
			if ( null === $start || null === $end ) {
				throw new InvalidArgumentException( 'date_range must contain startDate and endDate' );
			}
			$compare_start_provided = array_key_exists( 'compareStartDate', $date_range );
			$compare_end_provided   = array_key_exists( 'compareEndDate', $date_range );
			if ( $compare_start_provided xor $compare_end_provided ) {
				throw new InvalidArgumentException( 'date_range must contain both compareStartDate and compareEndDate when comparison dates are provided' );
			}
			$this->date_range = array(
				'startDate' => $start,
				'endDate'   => $end,
			);
			if ( $compare_start_provided && $compare_end_provided ) {
				$this->date_range['compareStartDate'] = (string) $date_range['compareStartDate'];
				$this->date_range['compareEndDate']   = (string) $date_range['compareEndDate'];
			}
		} else {
			$this->date_range = null;
		}

		if ( null !== $dashboard_link && ! is_string( $dashboard_link ) ) {
			throw new InvalidArgumentException( 'dashboard_link must be a string or null' );
		}

		$this->section_key    = $section_key;
		$this->title          = $title;
		$this->dashboard_link = $dashboard_link;
	}

	/**
	 * Gets the section key.
	 *
	 * @return string
	 */
	public function get_section_key() {
		return $this->section_key;
	}

	/**
	 * Gets the title.
	 *
	 * @return string
	 */
	public function get_title() {
		return $this->title;
	}

	/**
	 * Gets labels.
	 *
	 * @return array
	 */
	public function get_labels() {
		return $this->labels;
	}

	/**
	 * Gets values.
	 *
	 * @return array
	 */
	public function get_values() {
		return $this->values;
	}

	/**
	 * Gets trends.
	 *
	 * @return array|null
	 */
	public function get_trends() {
		return $this->trends;
	}

	/**
	 * Gets date range.
	 *
	 * @return array|null
	 */
	public function get_date_range() {
		return $this->date_range;
	}

	/**
	 * Gets dashboard link.
	 *
	 * @return string|null
	 */
	public function get_dashboard_link() {
		return $this->dashboard_link;
	}

	/**
	 * Whether the section is empty (no values or all empty strings).
	 *
	 * @return bool
	 */
	public function is_empty() {
		if ( empty( $this->values ) ) {
			return true;
		}
		foreach ( $this->values as $value ) {
			if ( '' !== trim( (string) $value ) ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Returns normalized array representation for templates.
	 *
	 * @return array
	 */
	public function to_array() {
		return array(
			'section_key'    => $this->section_key,
			'title'          => $this->title,
			'labels'         => $this->labels,
			'values'         => $this->values,
			'trends'         => $this->trends,
			'date_range'     => $this->date_range,
			'dashboard_link' => $this->dashboard_link,
		);
	}
}
