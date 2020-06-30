<?php

namespace Google\Site_Kit\Modules\Analytics\Measurement_Events;

/**
 * Use to instantiate MeasurementEvent objects
 *
 * @class Measurement_Event_Builder
 */
class Measurement_Event_Builder {

	private $configuration;

	function __construct(array $config) {
		$this->configuration = $config;
	}

	function get_plugin_name() {
		return $this->configuration['pluginName'];
	}

	function get_category() {
		return $this->configuration['category'];
	}

	function get_action() {
		return $this->configuration['action'];
	}

	function get_selector() {
		return $this->configuration['selector'];
	}

	function get_on() {
		return $this->configuration['on'];
	}

	/**
	 * returns MeasurementEvent object once all params have been set
	 *
	 * @return Measurement_Event
	 */
	function build() {
		return new Measurement_Event($this);
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

	static function create_builder($plugin) {
		return new Measurement_Event_Builder($plugin);
	}

	function __construct(Measurement_Event_Builder $builder) {
		$this->plugin_name = $builder->get_plugin_name();
		$this->event_category = $builder->get_category();
		$this->event_action = $builder->get_action();
		$this->event_selector = $builder->get_selector();
		$this->event_on = $builder->get_on();
	}

	public function jsonSerialize() {
		return [
			'pluginName' => $this->plugin_name,
			'category' => $this->event_category,
			'action' => $this->event_action,
			'selector' => $this->event_selector,
			'on' => $this->event_on
		];
	}

}
