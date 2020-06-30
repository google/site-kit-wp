<?php

namespace Google\Site_Kit\Modules\Analytics\Shirshu;

/**
 * Injects Javascript based on the current active plugins
 *
 * Class Injector
 */
class Measurement_Code_Injector {
	/**
	 * A list of user's current active plugins that ShirshuClass supports
	 *
	 * @var array of string
	 */
	private $active_plugins = null;

	/**
	 * Holds a list of event configurations to be injected
	 *
	 * @var array
	 */
	private $event_configurations;

	/**
	 * Measurement_Event_Factory instance
	 *
	 * @var Measurement_Event_Factory
	 */
	private $event_factory = null;

	/**
	 * Injector constructor.
	 * @param $active_plugins
	 */
	public function __construct($active_plugins) {
		$this->active_plugins = $active_plugins;
		$this->event_factory = Measurement_Event_Factory::get_instance();
		$this->event_configurations = $this->build_event_configurations();
		add_action('wp_head', array($this, 'inject_event_tracking'), 1);
	}

	/**
	 * Sets the event configurations
	 */
	public function build_event_configurations() {
		$event_configurations = array();
		foreach($this->active_plugins as $plugin_name) {
			$measurement_event_list = $this->event_factory->create_measurement_event_list($plugin_name);
			if($measurement_event_list != null) {
				foreach ($measurement_event_list->get_events() as $measurement_event) {
					array_push($event_configurations, $measurement_event);
				}
			}
		}
		return $event_configurations;
	}

	/**
	 * Gets the event configurations
	 */
	public function get_event_configurations() {
		return $this->event_configurations;
	}

	/**
	 * Creates list of measurement event configurations and javascript to inject
	 */
	public function inject_event_tracking() {
		?>
		<script>
            let event_configurations = <?php echo json_encode($this->event_configurations); ?>;
            let config;
            for(config of event_configurations) {
                const this_config = config;
                document.addEventListener(config.on, function(e){
                    if(e.target.matches(this_config.selector)) {
                        alert('Got an event called: '.concat(this_config.action));
                    }else if(e.target.matches(this_config.selector.concat(' *'))){
                        alert('Got an event called: '.concat(this_config.action));
                    }
                }, true);
            }
		</script>
		<?php
	}
}
