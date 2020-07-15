<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Measurement_Event_Pipe
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events;

/**
 * Class for converting measurement event configurations into JSON objects.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
final class Measurement_Event_Pipe {

	/**
	 * Converts Measurement_Event config to JSON object with added JS callback function support.
	 *
	 * @since n.e.x.t.
	 *
	 * @param Measurement_Event $measurement_event Event to convert to Json object.
	 * @return false|string|string[] Event configuration in JSON format.
	 */
	private static function encode_measurement_event( $measurement_event ) {
		$config       = $measurement_event->get_config();
		$value_arr    = array();
		$replace_keys = array();
		foreach ( $config as $key => &$value ) {
			if ( strpos( $value, 'function(' ) === 0 ) {
				$value_arr[]    = $value;
				$value          = '%' . $key . '%';
				$replace_keys[] = '"' . $value . '"';
			}
		}
		$json_config = wp_json_encode( $config );
		$json_config = str_replace( $replace_keys, $value_arr, $json_config );
		return $json_config;
	}

	/**
	 * Converts a list of measurement events to JSON object.
	 *
	 * @since n.e.x.t.
	 *
	 * @param array $event_configurations The list of events.
	 * @return false|string List of events in JSON format.
	 */
	public static function encode_measurement_event_list( $event_configurations ) {
		$result = '[';
		foreach ( $event_configurations as $event ) {
			$result = $result . self::encode_measurement_event( $event ) . ',';
		}
		$result = substr( $result, 0, -1 );
		$result = $result . ']';
		return $result;
	}

}
