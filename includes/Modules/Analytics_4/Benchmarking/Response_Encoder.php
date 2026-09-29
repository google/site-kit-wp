<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Response_Encoder
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Benchmarking;

/**
 * Encodes an assembled benchmarking response for the browser.
 *
 * Thirteen months of daily counts next to seven ranked lists is tens of
 * kilobytes written as objects, and the dashboard keeps one of those per date
 * range in browser storage. The encoded response drops the repeated field
 * names, the date of every day but the first, and every repeated string.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Response_Encoder {

	/**
	 * Encodes an assembled response.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $response Assembled response, with `visitors`, `dailyTraffic`, `dimensions` and `contextualData`.
	 * @return array The encoded response.
	 */
	public function encode( array $response ) {
		$strings = array();

		$daily_traffic = isset( $response['dailyTraffic'] ) ? $response['dailyTraffic'] : array();
		$first_row     = reset( $daily_traffic );
		$visitors      = isset( $response['visitors'] ) ? $response['visitors'] : array();
		$dimensions    = isset( $response['dimensions'] ) ? $response['dimensions'] : array();

		$dimension_rows  = array();
		$dimension_order = array();

		foreach ( $dimensions as $dimension ) {
			if ( ! isset( Wire_Format::DIMENSION_INDEXES[ $dimension ] ) ) {
				continue;
			}

			$index = Wire_Format::DIMENSION_INDEXES[ $dimension ];
			$key   = Wire_Format::CONTEXTUAL_DATA_KEYS[ $dimension ];
			$rows  = isset( $response['contextualData'][ $key ] ) ? $response['contextualData'][ $key ] : array();

			$dimension_rows[ $index ] = array_map(
				function ( $row ) use ( $dimension, &$strings ) {
					return $this->encode_row( $dimension, $row, $strings );
				},
				$rows
			);

			$dimension_order[] = $index;
		}

		$encoded = array();

		$encoded[ Wire_Format::MEMBER_VERSION ]    = Wire_Format::FORMAT_VERSION;
		$encoded[ Wire_Format::MEMBER_STRINGS ]    = $strings;
		$encoded[ Wire_Format::MEMBER_FIRST_DATE ] = isset( $first_row['date'] ) ? $first_row['date'] : null;

		$encoded[ Wire_Format::MEMBER_DAILY_VISITORS ] = array_map(
			function ( $row ) {
				return $this->encode_int( isset( $row['visitors'] ) ? $row['visitors'] : null );
			},
			array_values( $daily_traffic )
		);

		$encoded[ Wire_Format::MEMBER_VISITOR_TOTALS ] = array(
			$this->encode_int( isset( $visitors['current'] ) ? $visitors['current'] : null ),
			$this->encode_int( isset( $visitors['previous'] ) ? $visitors['previous'] : null ),
		);

		// Cast so the rows travel keyed by dimension index. Left as an array,
		// indexes that happen to run 0, 1, 2 would serialize as a list instead.
		$encoded[ Wire_Format::MEMBER_DIMENSION_ROWS ]  = (object) $dimension_rows;
		$encoded[ Wire_Format::MEMBER_DIMENSION_ORDER ] = $dimension_order;

		return $encoded;
	}

	/**
	 * Encodes one dimension row in the layout its dimension travels in.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $dimension Dimension code the row belongs to.
	 * @param array  $row       Row to encode.
	 * @param array  $strings   String table, added to as strings are seen.
	 * @return array The encoded row.
	 */
	private function encode_row( $dimension, array $row, array &$strings ) {
		if ( 'CONTENT' === $dimension ) {
			return array(
				$this->encode_string( isset( $row['url'] ) ? $row['url'] : null, $strings ),
				$this->encode_string( isset( $row['title'] ) ? $row['title'] : null, $strings ),
				$this->encode_int( isset( $row['visitors'] ) ? $row['visitors'] : null ),
				$this->encode_int( isset( $row['publishedDaysAgo'] ) ? $row['publishedDaysAgo'] : null ),
			);
		}

		$encoded = array(
			$this->encode_string( isset( $row['label'] ) ? $row['label'] : null, $strings ),
			$this->encode_int( isset( $row['current'] ) ? $row['current'] : null ),
			$this->encode_int( isset( $row['previous'] ) ? $row['previous'] : null ),
		);

		if ( 'SEARCH_QUERIES' === $dimension ) {
			$encoded[] = $this->encode_position( isset( $row['positionCurrent'] ) ? $row['positionCurrent'] : null );
			$encoded[] = $this->encode_position( isset( $row['positionPrevious'] ) ? $row['positionPrevious'] : null );
		}

		return $encoded;
	}

	/**
	 * Stores a string in the table and returns its position, so a string two
	 * rows share travels once.
	 *
	 * @since n.e.x.t
	 *
	 * @param string|null $value   String to store.
	 * @param array       $strings String table, added to when the string is new.
	 * @return int|null The string's position, or null when there is no string.
	 */
	private function encode_string( $value, array &$strings ) {
		if ( null === $value ) {
			return null;
		}

		$value    = (string) $value;
		$position = array_search( $value, $strings, true );

		if ( false === $position ) {
			$strings[] = $value;

			$position = count( $strings ) - 1;
		}

		return $position;
	}

	/**
	 * Encodes a count as an integer.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value Value to encode.
	 * @return int|null The value as an integer, or null when there is no value.
	 */
	private function encode_int( $value ) {
		return null === $value ? null : (int) $value;
	}

	/**
	 * Encodes an average position, the only number the format keeps decimals for.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value Value to encode.
	 * @return float|null The rounded value, or null when there is no value.
	 */
	private function encode_position( $value ) {
		return null === $value ? null : round( (float) $value, Wire_Format::POSITION_DECIMAL_PLACES );
	}
}
