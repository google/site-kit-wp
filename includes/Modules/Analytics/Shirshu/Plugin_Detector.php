<?php

namespace Google\Site_Kit\Modules\Analytics\Shirshu;

/**
 * Detects the user's current active plugins that ShirshuClass supports
 *
 * Class Plugin_Detector
 */
class Plugin_Detector {

	/**
	 * A list of ShirshuClass supported plugins
	 *
	 * @var array of strings
	 */
	private $supported_plugins = null;

	/**
	 * PluginDetector constructor.
	 * @param $supported_plugins
	 */
	public function __construct($supported_plugins) {
		$this->supported_plugins = $supported_plugins;
	}

	/**
	 * Determines the user's current active plugins that ShirshuClass supports
	 *
	 * @return array of strings
	 */
	public function get_active_plugins() {
		$active_plugins = array();
		foreach ($this->supported_plugins as $key => $function_name) {
            if (defined($function_name) || function_exists($function_name)) {
                array_push($active_plugins, $key);
            }
		}
		return $active_plugins;
	}
}
