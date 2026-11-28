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
 * The response has one count for each day of the selected period, which can
 * be over a year long. Written as objects, the counts repeat a field name and
 * a date on every day. The dashboard keeps one
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
	 * @since n.e.x.t Encodes the expected range of each day and which parts of the typical traffic view show.
	 * @since n.e.x.t Encodes the locale and the signed request of the generated insight when the response has them.
	 * @since n.e.x.t Encodes the content markers.
	 * @since n.e.x.t Encodes whether traffic was steady.
	 * @since n.e.x.t Encodes the days of traffic the band is fitted on.
	 * @since n.e.x.t Encodes the path of a post's card.
	 * @since n.e.x.t Encodes the basis of a card's share and the channel a card's share is of, and whether an attribute moved further than its card.
	 * @since n.e.x.t Encodes the channel of a part of a channel on whatever basis its share is, whether a channel's card is for its other pages, and a landing page's title and whether a search keyword's site has no search clicks.
	 *
	 * @param array $response Assembled response, with `visits`, `dailyTraffic`, `availability`, `bandReferenceDays`, `keyFactors`, `steadyTraffic` and `contentMarkers`. `bandReferenceDays` is the number of days of traffic the band of the period's last day is fitted on, or null without a band. `steadyTraffic` is whether no channel changed notably, when the key factor cards are the channels with the most visits. Each `dailyTraffic` row has `date`, `visits`, and the bounds of its expected range as `expectedMin` and `expectedMax`, which are null on a day without one. `availability` is which parts of the typical traffic view show, as `Typical_Traffic_Availability::get()` returns it. Each `contentMarkers` item has a `date`, as `YYYY-MM-DD`, and its `posts`, each with `title` and `url`. With the `trafficInsights` feature, the response also has `insightLocale`, the locale the insight is written in, and `insightPayload`, the signed request the insight is generated from, or null when there is no insight to request.
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

			$encoded_key_factors[] = $this->encode_key_factor_card( $key_factor, $strings );

			$encoded_attributes = array();
			$attributes         = isset( $key_factor['attributes'] ) ? $key_factor['attributes'] : array();

			foreach ( $attributes as $attribute ) {
				if ( ! isset( $attribute['kind'], Wire_Format::KEY_FACTOR_ATTRIBUTE_KINDS[ $attribute['kind'] ] ) ) {
					continue;
				}

				$encoded_attributes[] = $this->encode_key_factor_attribute( $attribute, $strings );
			}

			$encoded_key_factor_attributes[] = $encoded_attributes;
		}

		$first_date = isset( $first_row['date'] ) ? $first_row['date'] : null;

		// The markers add their titles and paths to the string table after the
		// cards add their labels, so the cards' strings keep their positions.
		$encoded_content_markers = $this->encode_content_markers(
			$first_date,
			isset( $response['contentMarkers'] ) ? $response['contentMarkers'] : array(),
			$strings
		);

		$encoded = array();

		$encoded[ Wire_Format::MEMBER_VERSION ]    = Wire_Format::FORMAT_VERSION;
		$encoded[ Wire_Format::MEMBER_STRINGS ]    = $strings;
		$encoded[ Wire_Format::MEMBER_FIRST_DATE ] = $first_date;

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

		$encoded[ Wire_Format::MEMBER_AVAILABILITY ] = $this->encode_availability(
			$first_date,
			isset( $response['availability'] ) ? $response['availability'] : array()
		);

		$encoded[ Wire_Format::MEMBER_CONTENT_MARKERS ]     = $encoded_content_markers;
		$encoded[ Wire_Format::MEMBER_STEADY_TRAFFIC ]      = ! empty( $response['steadyTraffic'] );
		$encoded[ Wire_Format::MEMBER_BAND_REFERENCE_DAYS ] = $this->encode_int( isset( $response['bandReferenceDays'] ) ? $response['bandReferenceDays'] : null );

		// Only a response built with the `trafficInsights` feature has the
		// insight members, so a response built without it ends with the days
		// of traffic the band is fitted on.
		if ( array_key_exists( 'insightPayload', $response ) ) {
			$encoded[ Wire_Format::MEMBER_INSIGHT_LOCALE ]  = $this->encode_optional_string( isset( $response['insightLocale'] ) ? $response['insightLocale'] : null );
			$encoded[ Wire_Format::MEMBER_INSIGHT_PAYLOAD ] = $this->encode_optional_string( $response['insightPayload'] );
		}

		return $encoded;
	}

	/**
	 * Encodes a string that travels as itself rather than through the string
	 * table, since no other part of the response repeats it.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $value The value to encode.
	 * @return string|null The value as a string, or null when it is not a non-empty string.
	 */
	private function encode_optional_string( $value ) {
		return is_string( $value ) && '' !== $value ? $value : null;
	}

	/**
	 * Encodes a key factor card.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $card    Card to encode, with `kind`, `label`, `current`, `previous`, `sharePct` and `shareBasis`, a post's card with its path as `url`, a part of a channel that took the channel's card with `parentChannel` and `parentChannelChange`, a card whose change was spread across many pages with `spreadAcrossPages`, and a channel's card for its other pages, after a page that brought visits from several channels took a card, with `otherPages`.
	 * @param array $strings String table, added to as strings are seen.
	 * @return array The encoded card, as the list `[ kind, label, current, previous, sharePct, url, shareBasis, parentChannel, parentChannelChange, spreadAcrossPages, otherPages ]`, without the trailing fields that have no value. `url` and `parentChannel` are positions in the string table, `shareBasis` is the position its basis travels as, and `spreadAcrossPages` and `otherPages` are `true`, or left out when the card has no such mark.
	 */
	private function encode_key_factor_card( array $card, array &$strings ) {
		$encoded = $this->encode_key_factor_row( Wire_Format::KEY_FACTOR_KINDS[ $card['kind'] ], $card, $strings );

		$url         = $this->get_non_empty_string( $card, 'url' );
		$share_basis = isset( $card['shareBasis'], Wire_Format::KEY_FACTOR_SHARE_BASES[ $card['shareBasis'] ] ) ? $card['shareBasis'] : null;
		// A part of a channel names the channel whatever its share is of: of
		// the channel's change, or, for a part that moved further than the
		// channel, of something else or of nothing.
		$parent_channel = $this->get_non_empty_string( $card, 'parentChannel' );
		$has_parent     = null !== $parent_channel && isset( $card['parentChannelChange'] );

		$encoded[] = null === $url ? null : $this->encode_string( $url, $strings );
		$encoded[] = null === $share_basis ? null : Wire_Format::KEY_FACTOR_SHARE_BASES[ $share_basis ];
		$encoded[] = $has_parent ? $this->encode_string( $parent_channel, $strings ) : null;
		$encoded[] = $has_parent ? $this->encode_int( $card['parentChannelChange'] ) : null;
		$encoded[] = ! empty( $card['spreadAcrossPages'] ) ? true : null;
		$encoded[] = ! empty( $card['otherPages'] ) ? true : null;

		return $this->trim_trailing_fields( $encoded );
	}

	/**
	 * Encodes an attribute of a key factor card.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $attribute Attribute to encode, with `kind`, `label`, `current`, `previous`, `sharePct` and `oversized`, a landing page with the page's `title` when it is known, and a search keyword with `noSearchClicks` when the site's search clicks are unknown.
	 * @param array $strings   String table, added to as strings are seen.
	 * @return array The encoded attribute, as the list `[ kind, label, current, previous, sharePct, oversized, title, noSearchClicks ]`, without the trailing fields that have no value. `title` is a position in the string table, and `oversized` and `noSearchClicks` are `true`, or left out when the attribute has no such mark.
	 */
	private function encode_key_factor_attribute( array $attribute, array &$strings ) {
		$encoded = $this->encode_key_factor_row( Wire_Format::KEY_FACTOR_ATTRIBUTE_KINDS[ $attribute['kind'] ], $attribute, $strings );

		$title = $this->get_non_empty_string( $attribute, 'title' );

		$encoded[] = ! empty( $attribute['oversized'] ) ? true : null;
		$encoded[] = null === $title ? null : $this->encode_string( $title, $strings );
		$encoded[] = ! empty( $attribute['noSearchClicks'] ) ? true : null;

		return $this->trim_trailing_fields( $encoded );
	}

	/**
	 * Gets a field of a card or an attribute that is a string, when it is one
	 * that isn't empty.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $row   The card or the attribute.
	 * @param string $field The field's name, such as `url`.
	 * @return string|null The field's value, or null when it is missing, not a string, or empty.
	 */
	private function get_non_empty_string( array $row, $field ) {
		return isset( $row[ $field ] ) && is_string( $row[ $field ] ) && '' !== $row[ $field ] ? $row[ $field ] : null;
	}

	/**
	 * Encodes the fields a key factor card and its attributes share.
	 *
	 * @since 1.191.0
	 * @since n.e.x.t Encodes the shared fields alone. The card's and the attribute's own fields are added by `encode_key_factor_card()` and `encode_key_factor_attribute()`.
	 *
	 * @param int   $kind_index The position the card's or the attribute's kind travels as.
	 * @param array $row        Card or attribute to encode, with `label`, `current`, `previous` and `sharePct`.
	 * @param array $strings    String table, added to as strings are seen.
	 * @return array The encoded fields, as the list `[ kind, label, current, previous, sharePct ]`.
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
	 * Leaves out the trailing fields of an encoded card or attribute that have
	 * no value, from the last one, so a row carries only the fields it uses.
	 * The fields every row travels with are kept, null or not.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $encoded The encoded card or attribute.
	 * @return array The encoded card or attribute, without its trailing nulls after `Wire_Format::KEY_FACTOR_ROW_FIELD_COUNT`.
	 */
	private function trim_trailing_fields( array $encoded ) {
		$length = count( $encoded );

		while ( $length > Wire_Format::KEY_FACTOR_ROW_FIELD_COUNT && null === $encoded[ $length - 1 ] ) {
			--$length;
		}

		return array_slice( $encoded, 0, $length );
	}

	/**
	 * Encodes the content markers, each as its day followed by its posts.
	 *
	 * A marker's day travels as its offset from the first plotted day, so the
	 * response carries no date but the first. A marker without posts, or without
	 * a day to count from, is left out.
	 *
	 * @since n.e.x.t
	 *
	 * @param string|null $first_date The first plotted day, as `YYYY-MM-DD`.
	 * @param array       $markers    The markers, oldest first, each with `date`, as `YYYY-MM-DD`, and `posts`, each with `title` and `url`.
	 * @param array       $strings    String table, added to as strings are seen.
	 * @return array The encoded markers, each as the list `[ dayOffset, [ title, url ], … ]`, where `title` and `url` are positions in the string table.
	 */
	private function encode_content_markers( $first_date, array $markers, array &$strings ) {
		$encoded_markers = array();

		foreach ( $markers as $marker ) {
			$day_offset = $this->encode_day_offset( $first_date, isset( $marker['date'] ) ? $marker['date'] : null );
			$posts      = isset( $marker['posts'] ) ? $marker['posts'] : array();

			if ( null === $day_offset || empty( $posts ) ) {
				continue;
			}

			$encoded_marker = array( $day_offset );

			foreach ( $posts as $post ) {
				$encoded_marker[] = array(
					$this->encode_string( isset( $post['title'] ) ? $post['title'] : null, $strings ),
					$this->encode_string( isset( $post['url'] ) ? $post['url'] : null, $strings ),
				);
			}

			$encoded_markers[] = $encoded_marker;
		}

		return $encoded_markers;
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
	 * Encodes which parts of the typical traffic view show.
	 *
	 * A part the availability doesn't name doesn't show.
	 *
	 * @since n.e.x.t
	 *
	 * @param string|null $first_date   The first plotted day, as `YYYY-MM-DD`.
	 * @param array       $availability Which parts show, as `Typical_Traffic_Availability::get()` returns them.
	 * @return array The encoded availability, as the list of its fields at the `Wire_Format::AVAILABILITY_*` positions. Each flag is a boolean, and each day is its offset from `$first_date`, or null when there is no day.
	 */
	private function encode_availability( $first_date, array $availability ) {
		$encoded = array();

		$encoded[ Wire_Format::AVAILABILITY_RANGE_TOO_SHORT ]               = ! empty( $availability['range_too_short'] );
		$encoded[ Wire_Format::AVAILABILITY_BAND_AVAILABLE ]                = ! empty( $availability['band_available'] );
		$encoded[ Wire_Format::AVAILABILITY_BAND_AVAILABLE_FROM ]           = $this->encode_day_offset( $first_date, isset( $availability['band_available_from'] ) ? $availability['band_available_from'] : null );
		$encoded[ Wire_Format::AVAILABILITY_KEY_FACTORS_AVAILABLE ]         = ! empty( $availability['key_factors_available'] );
		$encoded[ Wire_Format::AVAILABILITY_KEY_FACTORS_AVAILABLE_FROM ]    = $this->encode_day_offset( $first_date, isset( $availability['key_factors_available_from'] ) ? $availability['key_factors_available_from'] : null );
		$encoded[ Wire_Format::AVAILABILITY_INSIGHT_REQUEST_ALLOWED ]       = ! empty( $availability['insight_request_allowed'] );
		$encoded[ Wire_Format::AVAILABILITY_PERFORMANCE_INSIGHT_AVAILABLE ] = ! empty( $availability['performance_insight_available'] );
		$encoded[ Wire_Format::AVAILABILITY_LAST_YEAR_AVAILABLE ]           = ! empty( $availability['last_year_available'] );
		$encoded[ Wire_Format::AVAILABILITY_RANGE_TOO_LONG ]                = ! empty( $availability['range_too_long'] );
		$encoded[ Wire_Format::AVAILABILITY_LOW_TRAFFIC ]                   = ! empty( $availability['low_traffic'] );

		return $encoded;
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
