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
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Email_Report_Data_Section_Part {

	/**
	 * Unique section key.
	 *
	 * @since 1.167.0
	 * @var string
	 */
	private $section_key;

	/**
	 * Section title.
	 *
	 * @since 1.167.0
	 * @var string
	 */
	private $title;

	/**
	 * Labels for the section rows/series.
	 *
	 * @since 1.167.0
	 * @var array
	 */
	private $labels;

	/**
	 * Values formatted as strings for output.
	 *
	 * @since 1.167.0
	 * @var array
	 */
	private $values;

	/**
	 * Optional trends matching values.
	 *
	 * @since 1.167.0
	 * @var array|null
	 */
	private $trends;

	/**
	 * Optional date range data.
	 *
	 * @since 1.167.0
	 * @var array|null
	 */
	private $date_range;

	/**
	 * Optional dashboard deeplink URL.
	 *
	 * @since 1.167.0
	 * @var string|null
	 */
	private $dashboard_link;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
	 *
	 * @param string $section_key  Unique section key.
	 * @param array  $section_data Section data (title, labels, values, optional trends, date_range, dashboard_link).
	 *
	 * @throws InvalidArgumentException When validation fails.
	 */
	public function __construct( $section_key, $section_data ) {
		if ( ! is_string( $section_key ) || '' === $section_key ) {
			throw new InvalidArgumentException( 'section_key must be a non-empty string' );
		}

		if ( ! is_array( $section_data ) ) {
			throw new InvalidArgumentException( 'section_data must be an array' );
		}

		$this->set_title( $section_data['title'] ?? null );
		$this->set_labels( $section_data['labels'] ?? null );
		$this->set_values( $section_data['values'] ?? null );
		$this->set_trends( $section_data['trends'] ?? null );
		$this->set_date_range( $section_data['date_range'] ?? null );
		$this->set_dashboard_link( $section_data['dashboard_link'] ?? null );

		$this->section_key = $section_key;
	}

	/**
	 * Gets the section key.
	 *
	 * @since 1.167.0
	 *
	 * @return string Section key.
	 */
	public function get_section_key() {
		return $this->section_key;
	}

	/**
	 * Gets the title.
	 *
	 * @since 1.167.0
	 *
	 * @return string Title.
	 */
	public function get_title() {
		return $this->title;
	}

	/**
	 * Gets labels.
	 *
	 * @since 1.167.0
	 *
	 * @return array Labels list.
	 */
	public function get_labels() {
		return $this->labels;
	}

	/**
	 * Gets values.
	 *
	 * @since 1.167.0
	 *
	 * @return array Values list.
	 */
	public function get_values() {
		return $this->values;
	}

	/**
	 * Gets trends.
	 *
	 * @since 1.167.0
	 *
	 * @return array|null Trends list or null.
	 */
	public function get_trends() {
		return $this->trends;
	}

	/**
	 * Gets date range.
	 *
	 * @since 1.167.0
	 *
	 * @return array|null Date range data or null.
	 */
	public function get_date_range() {
		return $this->date_range;
	}

	/**
	 * Gets dashboard link.
	 *
	 * @since 1.167.0
	 *
	 * @return string|null Dashboard link or null.
	 */
	public function get_dashboard_link() {
		return $this->dashboard_link;
	}

	/**
	 * Validates and assigns title.
	 *
	 * @since 1.167.0
	 *
	 * @param string $title Title.
	 *
	 * @throws InvalidArgumentException When validation fails.
	 */
	private function set_title( $title ) {
		if ( ! is_string( $title ) || '' === $title ) {
			throw new InvalidArgumentException( 'title must be a non-empty string' );
		}

		$this->title = $title;
	}

	/**
	 * Validates and assigns labels.
	 *
	 * @since 1.167.0
	 *
	 * @param array $labels Labels.
	 *
	 * @throws InvalidArgumentException When validation fails.
	 */
	private function set_labels( $labels ) {
		if ( ! is_array( $labels ) ) {
			throw new InvalidArgumentException( 'labels must be an array' );
		}

		$this->labels = $labels;
	}

	/**
	 * Validates and assigns values.
	 *
	 * @since 1.167.0
	 *
	 * @param array $values Values.
	 *
	 * @throws InvalidArgumentException When validation fails.
	 */
	private function set_values( $values ) {
		if ( ! is_array( $values ) ) {
			throw new InvalidArgumentException( 'values must be an array' );
		}

		$this->values = $values;
	}

	/**
	 * Validates and assigns trends.
	 *
	 * @since 1.167.0
	 *
	 * @param array|null $trends Trends data.
	 *
	 * @throws InvalidArgumentException When validation fails.
	 */
	private function set_trends( $trends ) {
		if ( null === $trends ) {
			$this->trends = null;
			return;
		}

		if ( ! is_array( $trends ) ) {
			throw new InvalidArgumentException( 'trends must be an array or null' );
		}

		$this->trends = $trends;
	}

	/**
	 * Validates and assigns date range.
	 *
	 * @since 1.167.0
	 *
	 * @param array|null $date_range Date range data.
	 *
	 * @throws InvalidArgumentException When validation fails.
	 */
	private function set_date_range( $date_range ) {
		if ( null === $date_range ) {
			$this->date_range = null;
			return;
		}

		if ( ! is_array( $date_range ) ) {
			throw new InvalidArgumentException( 'date_range must be an array or null' );
		}

		// Validate presence of keys if provided.
		foreach ( array( 'startDate', 'endDate' ) as $required_key ) {
			if ( empty( $date_range[ $required_key ] ) ) {
				throw new InvalidArgumentException( 'date_range must contain startDate and endDate' );
			}
		}

		$compare_start_provided = ! empty( $date_range['compareStartDate'] );
		$compare_end_provided   = ! empty( $date_range['compareEndDate'] );
		if ( ! $compare_start_provided || ! $compare_end_provided ) {
			throw new InvalidArgumentException( 'date_range must contain both compareStartDate and compareEndDate when comparison dates are provided' );
		}

		$this->date_range = array(
			'startDate' => $date_range['startDate'],
			'endDate'   => $date_range['endDate'],
		);

		if ( $compare_start_provided && $compare_end_provided ) {
			$this->date_range['compareStartDate'] = $date_range['compareStartDate'];
			$this->date_range['compareEndDate']   = $date_range['compareEndDate'];
		}
	}

	/**
	 * Validates and assigns dashboard link.
	 *
	 * @since 1.167.0
	 *
	 * @param string|null $dashboard_link Dashboard link.
	 *
	 * @throws InvalidArgumentException When validation fails.
	 */
	private function set_dashboard_link( $dashboard_link ) {
		if ( null === $dashboard_link ) {
			$this->dashboard_link = null;
			return;
		}

		if ( ! filter_var( $dashboard_link, FILTER_VALIDATE_URL ) ) {
			throw new InvalidArgumentException( 'dashboard_link must be a valid URL string or null' );
		}

		$this->dashboard_link = $dashboard_link;
	}

	/**
	 * Whether the section is empty (no values or all empty strings).
	 *
	 * @since 1.167.0
	 *
	 * @return bool Whether the section is empty.
	 */
	public function is_empty() {
		if ( empty( $this->values ) ) {
			return true;
		}

		foreach ( $this->values as $value ) {
			if ( '' !== trim( $value ) ) {
				return false;
			}
		}

		return true;
	}
}
