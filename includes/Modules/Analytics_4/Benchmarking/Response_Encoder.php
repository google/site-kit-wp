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

use DateTimeImmutable;
use DateTimeZone;

/**
 * Encodes an assembled benchmarking response for the browser.
 *
 * The response has one count for each day of the selected period, up to
 * `Report_Options::MAXIMUM_PERIOD_DAYS` days. Written as objects, the counts
 * repeat a field name and a date on every day. The dashboard keeps one
 * response per date range in browser storage. The encoded response leaves out
 * the repeated field names and the date of every day but the first, and
 * stores each string once.
 *
 * @since 1.189.0
 * @access private
 * @ignore
 */
final class Response_Encoder {

	/**
	 * Encodes an assembled response.
	 *
	 * A key factor card or an attribute whose kind the format doesn't list is
	 * left out. A card is left out together with its attributes, so the list of
	 * cards and the list of their attributes stay the same length.
	 *
	 * @since 1.189.0
	 * @since 1.191.0 Encodes the key factor cards in place of the dimension rows, and reads `visits` in place of `visitors`.
	 * @since n.e.x.t Encodes the expected range of each day and the first day with recorded traffic.
	 *
	 * @param array $response Assembled response, with `visits`, `dailyTraffic`, `firstTrafficDate` and `keyFactors`. Each `dailyTraffic` row has `date`, `visits`, and the bounds of its expected range as `expectedMin` and `expectedMax`, which are null on a day without one. `firstTrafficDate` is the first day with recorded traffic, as `YYYY-MM-DD`, or null when there is none.
	 * @return array The encoded response.
	 */
	public function encode( array $response ) {
		$strings = array();

		$daily_traffic = isset( $response['dailyTraffic'] ) ? $response['dailyTraffic'] : array();
		$first_row     = reset( $daily_traffic );
		$visits        = isset( $response['visits'] ) ? $response['visits'] : array();
		$key_factors   = isset( $response['keyFactors'] ) ? $response['keyFactors'] : array();

		$encoded_key_factors           = array();
		$encoded_key_factor_attributes = array();

		foreach ( $key_factors as $key_factor ) {
			if ( ! isset( $key_factor['kind'], Wire_Format::KEY_FACTOR_KINDS[ $key_factor['kind'] ] ) ) {
				continue;
			}

			$encoded_key_factors[] = $this->encode_key_factor_row( Wire_Format::KEY_FACTOR_KINDS[ $key_factor['kind'] ], $key_factor, $strings );

			$encoded_attributes = array();
			$attributes         = isset( $key_factor['attributes'] ) ? $key_factor['attributes'] : array();

			foreach ( $attributes as $attribute ) {
				if ( ! isset( $attribute['kind'], Wire_Format::KEY_FACTOR_ATTRIBUTE_KINDS[ $attribute['kind'] ] ) ) {
					continue;
				}

				$encoded_attributes[] = $this->encode_key_factor_row( Wire_Format::KEY_FACTOR_ATTRIBUTE_KINDS[ $attribute['kind'] ], $attribute, $strings );
			}

			$encoded_key_factor_attributes[] = $encoded_attributes;
		}

		$encoded = array();

		$encoded[ Wire_Format::MEMBER_VERSION ]    = Wire_Format::FORMAT_VERSION;
		$encoded[ Wire_Format::MEMBER_STRINGS ]    = $strings;
		$encoded[ Wire_Format::MEMBER_FIRST_DATE ] = isset( $first_row['date'] ) ? $first_row['date'] : null;

		$encoded[ Wire_Format::MEMBER_DAILY_VISITS ] = array_map(
			function ( $row ) {
				return $this->encode_int( isset( $row['visits'] ) ? $row['visits'] : null );
			},
			array_values( $daily_traffic )
		);

		$encoded[ Wire_Format::MEMBER_VISIT_TOTALS ] = array(
			$this->encode_int( isset( $visits['current'] ) ? $visits['current'] : null ),
			$this->encode_int( isset( $visits['previous'] ) ? $visits['previous'] : null ),
		);

		$encoded[ Wire_Format::MEMBER_KEY_FACTORS ]           = $encoded_key_factors;
		$encoded[ Wire_Format::MEMBER_KEY_FACTOR_ATTRIBUTES ] = $encoded_key_factor_attributes;

		$encoded[ Wire_Format::MEMBER_DAILY_EXPECTED_RANGES ] = array_map(
			function ( $row ) {
				return $this->encode_expected_range( $row );
			},
			array_values( $daily_traffic )
		);

		$encoded[ Wire_Format::MEMBER_FIRST_TRAFFIC_DAY_OFFSET ] = $this->encode_day_offset(
			$encoded[ Wire_Format::MEMBER_FIRST_DATE ],
			isset( $response['firstTrafficDate'] ) ? $response['firstTrafficDate'] : null
		);

		return $encoded;
	}

	/**
	 * Encodes a key factor card or one of its attributes, which travel in the
	 * same layout.
	 *
	 * @since 1.191.0
	 *
	 * @param int   $kind_index The position the card's or the attribute's kind travels as.
	 * @param array $row        Card or attribute to encode, with `label`, `current`, `previous` and `sharePct`.
	 * @param array $strings    String table, added to as strings are seen.
	 * @return array The encoded card or attribute, as the list `[ kind, label, current, previous, sharePct ]`.
	 */
	private function encode_key_factor_row( $kind_index, array $row, array &$strings ) {
		return array(
			$kind_index,
			$this->encode_string( isset( $row['label'] ) ? $row['label'] : null, $strings ),
			$this->encode_int( isset( $row['current'] ) ? $row['current'] : null ),
			$this->encode_int( isset( $row['previous'] ) ? $row['previous'] : null ),
			$this->encode_share( isset( $row['sharePct'] ) ? $row['sharePct'] : null ),
		);
	}

	/**
	 * Stores a string in the table and returns its position, so a string two
	 * cards or attributes share travels once.
	 *
	 * @since 1.189.0
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
	 * @since 1.189.0
	 *
	 * @param mixed $value Value to encode.
	 * @return int|null The value as an integer, or null when there is no value.
	 */
	private function encode_int( $value ) {
		return null === $value ? null : (int) $value;
	}

	/**
	 * Encodes a share of the site's change, which the format keeps decimals
	 * for, as it does for the bounds of the expected range.
	 *
	 * @since 1.191.0
	 * @since n.e.x.t Names the bounds of the expected range as the other numbers with decimals.
	 *
	 * @param mixed $value Value to encode.
	 * @return float|null The rounded value, or null when there is no value.
	 */
	private function encode_share( $value ) {
		return null === $value ? null : round( (float) $value, Wire_Format::SHARE_DECIMAL_PLACES );
	}

	/**
	 * Encodes the expected range of a day.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $row The `dailyTraffic` row, with `expectedMin` and `expectedMax`.
	 * @return array|null The rounded bounds, as the list `[ expectedMin, expectedMax ]`, or null when the day has no expected range.
	 */
	private function encode_expected_range( array $row ) {
		if ( ! isset( $row['expectedMin'], $row['expectedMax'] ) ) {
			return null;
		}

		return array(
			round( (float) $row['expectedMin'], Wire_Format::EXPECTED_RANGE_DECIMAL_PLACES ),
			round( (float) $row['expectedMax'], Wire_Format::EXPECTED_RANGE_DECIMAL_PLACES ),
		);
	}

	/**
	 * Encodes a day as the number of days from the first plotted day.
	 *
	 * @since n.e.x.t
	 *
	 * @param string|null $first_date The first plotted day, as `YYYY-MM-DD`.
	 * @param string|null $date       The day to encode, as `YYYY-MM-DD`.
	 * @return int|null The number of days from `$first_date` to `$date`, negative when `$date` is earlier, or null when either day is missing.
	 */
	private function encode_day_offset( $first_date, $date ) {
		if ( null === $first_date || null === $date ) {
			return null;
		}

		// Both days are at midnight UTC, where every day is 24 hours long, so
		// the difference of their timestamps is a whole number of days.
		$utc = new DateTimeZone( 'UTC' );

		return intdiv(
			( new DateTimeImmutable( $date, $utc ) )->getTimestamp() - ( new DateTimeImmutable( $first_date, $utc ) )->getTimestamp(),
			DAY_IN_SECONDS
		);
	}
}
