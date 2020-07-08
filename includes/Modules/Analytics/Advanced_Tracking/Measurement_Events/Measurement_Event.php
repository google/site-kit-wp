<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events\Measurement_Event
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Measurement_Events;

/**
 * Represents a single event that Advanced_Tracking tracks
 *
 * @class Measurement_Event
 * @access private
 * @ignore
 */
final class Measurement_Event implements \JsonSerializable {

	/**
	 * The measurement event's configuration.
	 *
	 * @var array
	 */
	private $config;

	/**
	 * Measurement_Event constructor.
	 *
	 * @param array $config The event's configuration.
	 */
	public function __construct( $config ) {
		$this->config = $config;
	}

	/**
	 * Returns an associative event containing the event attributes
	 *
	 * @return array
	 */
	public function jsonSerialize() {
		return $this->config;
	}

}
