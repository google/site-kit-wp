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

		if ( ! is_string( $section_data['title'] ) || '' === $section_data['title'] ) {
			throw new InvalidArgumentException( 'title must be a non-empty string' );
		}

		if ( ! array_key_exists( 'labels', $section_data ) || ! is_array( $section_data['labels'] ) ) {
			throw new InvalidArgumentException( 'labels must be an array' );
		}

		if ( ! array_key_exists( 'values', $section_data ) || ! is_array( $section_data['values'] ) ) {
			throw new InvalidArgumentException( 'values must be an array' );
		}

		$this->labels = array_map( 'strval', $section_data['labels'] );
		$this->values = array_map( 'strval', $section_data['values'] );

		$trends = array_key_exists( 'trends', $section_data ) ? $section_data['trends'] : null;

		if ( null !== $trends ) {
			if ( ! is_array( $trends ) ) {
				throw new InvalidArgumentException( 'trends must be an array or null' );
			}
			$this->trends = array_map( 'strval', $trends );
		}

		$date_range = array_key_exists( 'date_range', $section_data ) ? $section_data['date_range'] : null;

		if ( null !== $date_range ) {
			if ( ! is_array( $date_range ) ) {
				throw new InvalidArgumentException( 'date_range must be an array or null' );
			}
			// Validate presence of keys if provided.
			foreach ( array( 'startDate', 'endDate' ) as $required_key ) {
				if ( empty( $date_range[ $required_key ] ) ) {
					throw new InvalidArgumentException( 'date_range must contain startDate and endDate' );
				}
			}
			$compare_start_provided = array_key_exists( 'compareStartDate', $date_range );
			$compare_end_provided   = array_key_exists( 'compareEndDate', $date_range );
			if ( $compare_start_provided xor $compare_end_provided ) {
				throw new InvalidArgumentException( 'date_range must contain both compareStartDate and compareEndDate when comparison dates are provided' );
			}
			$this->date_range = array(
				'startDate' => (string) $date_range['startDate'],
				'endDate'   => (string) $date_range['endDate'],
			);
			if ( $compare_start_provided && $compare_end_provided ) {
				$this->date_range['compareStartDate'] = (string) $date_range['compareStartDate'];
				$this->date_range['compareEndDate']   = (string) $date_range['compareEndDate'];
			}
		}

		$dashboard_link = array_key_exists( 'dashboard_link', $section_data ) ? $section_data['dashboard_link'] : null;

		if ( null !== $dashboard_link && ! is_string( $dashboard_link ) ) {
			throw new InvalidArgumentException( 'dashboard_link must be a string or null' );
		}

		$this->section_key    = $section_key;
		$this->title          = $section_data['title'];
		$this->dashboard_link = $dashboard_link;
	}

	/**
	 * Gets the section key.
	 *
	 * @since n.e.x.t
	 *
	 * @return string
	 */
	public function get_section_key() {
		return $this->section_key;
	}

	/**
	 * Gets the title.
	 *
	 * @since n.e.x.t
	 *
	 * @return string
	 */
	public function get_title() {
		return $this->title;
	}

	/**
	 * Gets labels.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	public function get_labels() {
		return $this->labels;
	}

	/**
	 * Gets values.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	public function get_values() {
		return $this->values;
	}

	/**
	 * Gets trends.
	 *
	 * @since n.e.x.t
	 *
	 * @return array|null
	 */
	public function get_trends() {
		return $this->trends;
	}

	/**
	 * Gets date range.
	 *
	 * @since n.e.x.t
	 *
	 * @return array|null
	 */
	public function get_date_range() {
		return $this->date_range;
	}

	/**
	 * Gets dashboard link.
	 *
	 * @since n.e.x.t
	 *
	 * @return string|null
	 */
	public function get_dashboard_link() {
		return $this->dashboard_link;
	}

	/**
	 * Gets the array representation of the section part.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	public function to_array() {
		return array(
			'section_key'    => $this->get_section_key(),
			'title'          => $this->get_title(),
			'labels'         => $this->get_labels(),
			'values'         => $this->get_values(),
			'trends'         => $this->get_trends(),
			'date_range'     => $this->get_date_range(),
			'dashboard_link' => $this->get_dashboard_link(),
		);
	}

	/**
	 * Whether the section is empty (no values or all empty strings).
	 *
	 * @since n.e.x.t
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
}
