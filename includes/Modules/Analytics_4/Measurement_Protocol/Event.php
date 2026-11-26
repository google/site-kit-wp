<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol\Event
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Measurement_Protocol;

/**
 * Class for one server-side event, as Site Kit sends it to the Measurement Protocol.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Event {

	/**
	 * Maximum number of characters in a param value.
	 *
	 * @since n.e.x.t
	 */
	const MAX_PARAM_VALUE_LENGTH = 100;

	/**
	 * Event name.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $name;

	/**
	 * Param values as strings, keyed by param name.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $params;

	/**
	 * Key of the event, as `<event name>:<object type>:<object ID>`.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	private $dedupe_key;

	/**
	 * How specific the event is.
	 *
	 * It decides which of two events with one dedupe key the collector keeps.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $specificity;

	/**
	 * Unix time in microseconds when the event was created.
	 *
	 * @since n.e.x.t
	 * @var int
	 */
	private $timestamp_micros;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $name        Event name.
	 * @param array  $params      Event params, keyed by param name. A param whose value is not a scalar is dropped.
	 * @param string $dedupe_key  Key of the event, as `<event name>:<object type>:<object ID>`.
	 * @param int    $specificity Optional. How specific the event is. Default 0.
	 */
	public function __construct( string $name, array $params, string $dedupe_key, int $specificity = 0 ) {
		$this->name             = $name;
		$this->params           = array_map(
			fn ( $value ) => mb_substr( (string) $value, 0, self::MAX_PARAM_VALUE_LENGTH ),
			array_filter( $params, 'is_scalar' )
		);
		$this->dedupe_key       = $dedupe_key;
		$this->specificity      = $specificity;
		$this->timestamp_micros = (int) ( microtime( true ) * 1000000 );
	}

	/**
	 * Gets the event name.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Event name.
	 */
	public function get_name() {
		return $this->name;
	}

	/**
	 * Gets the event params.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Param values as strings, keyed by param name.
	 */
	public function get_params() {
		return $this->params;
	}

	/**
	 * Gets the dedupe key.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Key of the event, as `<event name>:<object type>:<object ID>`.
	 */
	public function get_dedupe_key() {
		return $this->dedupe_key;
	}

	/**
	 * Gets how specific the event is.
	 *
	 * @since n.e.x.t
	 *
	 * @return int Specificity.
	 */
	public function get_specificity() {
		return $this->specificity;
	}

	/**
	 * Gets the time the event was created.
	 *
	 * @since n.e.x.t
	 *
	 * @return int Unix time in microseconds.
	 */
	public function get_timestamp_micros() {
		return $this->timestamp_micros;
	}
}
