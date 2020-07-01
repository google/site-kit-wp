<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Measurement_Events\Measurement_Event
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics\Measurement_Events;

/**
 * Use to instantiate MeasurementEvent objects
 *
 * @class Measurement_Event_Builder
 */
class Measurement_Event_Builder {
	/**
	 * Associative array of event configuration containing event attributes
	 *
	 * @var array
	 */
	private $configuration;

	/**
	 * Measurement_Event_Builder constructor.
	 *
	 * @param array $config
	 */
	public function __construct( array $config ) {
		$this->configuration = $config;
	}

	/**
	 * Gets the name of the plugin
	 *
	 * @return string
	 */
	public function get_plugin_name() {
		return $this->configuration['pluginName'];
	}

	/**
	 * Gets the name of the event category
	 *
	 * @return string
	 */
	public function get_category() {
		return $this->configuration['category'];
	}

	/**
	 * Gets the name of the specific event
	 *
	 * @return string
	 */
	public function get_action() {
		return $this->configuration['action'];
	}

	/**
	 * Gets the CSS selector used to grab element that this event is tied to
	 *
	 * @return string
	 */
	public function get_selector() {
		return $this->configuration['selector'];
	}

	/**
	 * Gets the inner layer event to bind to in order to track the event
	 *
	 * @return string
	 */
	public function get_on() {
		return $this->configuration['on'];
	}

	/**
	 * Returns MeasurementEvent object once all params have been set
	 *
	 * @return Measurement_Event
	 */
	public function build() {
		return new Measurement_Event( $this );
	}

}

/**
 * Represents a single event that ShirshuClass tracks
 *
 * @class Measurement_Event
 */
class Measurement_Event implements \JsonSerializable {

	/**
	 * The plugin that this event is associated with
	 *
	 * @var string
	 */
	private $plugin_name;

	/**
	 * Event category e.g. ecommerce, engagement
	 *
	 * @var string
	 */
	private $event_category;

	/**
	 * Name of specific event
	 *
	 * @var string
	 */
	private $event_action;

	/**
	 * CSS selector used to grab element that this event is tied to
	 *
	 * @var string
	 */
	private $event_selector;

	/**
	 * Inner layer event to bind to in order to track the event
	 *
	 * @var string
	 */
	private $event_on;

	/**
	 *
	 *
	 * @param $plugin
	 *
	 * @return Measurement_Event_Builder
	 */
	public static function create_builder( $plugin ) {
		return new Measurement_Event_Builder( $plugin );
	}

	/**
	 * Measurement_Event constructor.
	 *
	 * @param Measurement_Event_Builder $builder
	 */
	public function __construct( Measurement_Event_Builder $builder ) {
		$this->plugin_name = $builder->get_plugin_name();
		$this->event_category = $builder->get_category();
		$this->event_action = $builder->get_action();
		$this->event_selector = $builder->get_selector();
		$this->event_on = $builder->get_on();
	}

	/**
	 * Returns an associative event containing the event attributes
	 *
	 * @return array
	 */
	public function jsonSerialize() {
		return array(
			'pluginName' => $this->plugin_name,
			'category' => $this->event_category,
			'action' => $this->event_action,
			'selector' => $this->event_selector,
			'on' => $this->event_on,
		);
	}

}
