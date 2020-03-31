<?php
/**
 * Class Google\Site_Kit\Core\Util\Timezones
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class managing admin tracking.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Timezones {

	/**
	 * Is tracking active for the current user?
	 *
	 * @since 1.0.0
	 * @since 1.3.0 Timezones is now user-specific.
	 *
	 * @return bool True if tracking enabled, and False if not.
	 */
	public function get_timezone_data() {
		$selected_zone = get_option( 'timezone_string' );

		// Build the timezones dropdown data, based on core's wp_timezone_choice.
		$continents = array( 'Africa', 'America', 'Antarctica', 'Arctic', 'Asia', 'Atlantic', 'Australia', 'Europe', 'Indian', 'Pacific' );

		$timezone_data = timezone_identifiers_list();
		$zonen         = array();
		foreach ( timezone_identifiers_list() as $zone ) {
			$zone = explode( '/', $zone );
			if ( ! in_array( $zone[0], $continents ) ) {
				continue;
			}

			// This determines what gets set and translated - we don't translate Etc/* strings here, they are done later.
			$exists    = array(
				0 => ( isset( $zone[0] ) && $zone[0] ),
				1 => ( isset( $zone[1] ) && $zone[1] ),
				2 => ( isset( $zone[2] ) && $zone[2] ),
			);
			$exists[3] = ( $exists[0] && 'Etc' !== $zone[0] );
			$exists[4] = ( $exists[1] && $exists[3] );
			$exists[5] = ( $exists[2] && $exists[3] );

			// phpcs:disable WordPress.WP.I18n.LowLevelTranslationFunction,WordPress.WP.I18n.NonSingularStringLiteralText
			$zonen[] = array(
				'continent'   => ( $exists[0] ? $zone[0] : '' ),
				'city'        => ( $exists[1] ? $zone[1] : '' ),
				'subcity'     => ( $exists[2] ? $zone[2] : '' ),
				't_continent' => ( $exists[3] ? translate( str_replace( '_', ' ', $zone[0] ), 'continents-cities' ) : '' ),
				't_city'      => ( $exists[4] ? translate( str_replace( '_', ' ', $zone[1] ), 'continents-cities' ) : '' ),
				't_subcity'   => ( $exists[5] ? translate( str_replace( '_', ' ', $zone[2] ), 'continents-cities' ) : '' ),
			);
			// phpcs:enable
		}
		usort( $zonen, '_wp_timezone_choice_usort_callback' );
		$structure = array();

		if ( empty( $selected_zone ) ) {
			$structure[] = array(
				'selected' => 'selected',
				'value'    => '',
				'name'     => __( 'Select a city', 'google-site-kit' ),
			);
		}

		foreach ( $zonen as $key => $zone ) {
			// Build value in an array to join later.
			$value = array( $zone['continent'] );

			if ( empty( $zone['city'] ) ) {
				// It's at the continent level (generally won't happen).
				$display = $zone['t_continent'];
			} else {
				// It's inside a continent group.

				// Continent optgroup.
				if ( ! isset( $zonen[ $key - 1 ] ) || $zonen[ $key - 1 ]['continent'] !== $zone['continent'] ) {
					$label = $zone['t_continent'];

				}

				// Add the city to the value.
				$value[] = $zone['city'];

				$display = $zone['t_city'];
				if ( ! empty( $zone['subcity'] ) ) {
					// Add the subcity to the value.
					$value[]  = $zone['subcity'];
					$display .= ' - ' . $zone['t_subcity'];
				}
			}

			// Build the value.
			$value    = join( '/', $value );
			$selected = '';
			if ( $value === $selected_zone ) {
				$selected = 'selected="selected" ';
			}
			$structure[] = array(
				'selected' => $selected,
				'value'    => esc_attr( $value ),
				'name'     => esc_html( $display ),
			);
		}

		// Do UTC.
		$selected = '';
		if ( 'UTC' === $selected_zone ) {
			$selected = 'selected="selected" ';
		}
		$structure[] = array(
			'selected' => $selected,
			'value'    => esc_attr( 'UTC' ),
			'name'     => __( 'UTC' ),
		);

		// Do manual UTC offsets.
		$offset_range = array(
			-12,
			-11.5,
			-11,
			-10.5,
			-10,
			-9.5,
			-9,
			-8.5,
			-8,
			-7.5,
			-7,
			-6.5,
			-6,
			-5.5,
			-5,
			-4.5,
			-4,
			-3.5,
			-3,
			-2.5,
			-2,
			-1.5,
			-1,
			-0.5,
			0,
			0.5,
			1,
			1.5,
			2,
			2.5,
			3,
			3.5,
			4,
			4.5,
			5,
			5.5,
			5.75,
			6,
			6.5,
			7,
			7.5,
			8,
			8.5,
			8.75,
			9,
			9.5,
			10,
			10.5,
			11,
			11.5,
			12,
			12.75,
			13,
			13.75,
			14,
		);
		foreach ( $offset_range as $offset ) {
			if ( 0 <= $offset ) {
				$offset_name = '+' . $offset;
			} else {
				$offset_name = (string) $offset;
			}

			$offset_value = $offset_name;
			$offset_name  = str_replace( array( '.25', '.5', '.75' ), array( ':15', ':30', ':45' ), $offset_name );
			$offset_name  = 'UTC' . $offset_name;
			$offset_value = 'UTC' . $offset_value;
			$selected     = '';
			if ( $offset_value === $selected_zone ) {
				$selected = 'selected="selected" ';
			}
			$structure[] = array(
				'selected' => $selected,
				'value'    => esc_attr( $offset_value ),
				'name'     => esc_html( $offset_name ),
			);
		}
		return $structure;
	}


}
