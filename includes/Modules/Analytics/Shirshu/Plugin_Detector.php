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
		if (!function_exists('get_plugins')) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$this->supported_plugins = $supported_plugins;
	}

	/**
	 * Determines the user's current active plugins that ShirshuClass supports
	 *
	 * @return array of strings
	 */
	public function get_active_plugins() {
		$plugins = get_plugins();
		$plugin_keys = array_keys($plugins);
		$active_plugins = array();

		foreach ($plugin_keys as $plugin_key) {
			$potential_plugin_name = $plugins[$plugin_key]['Name'];
			if (in_array($potential_plugin_name, $this->supported_plugins) && is_plugin_active( $plugin_key)) {
				array_push($active_plugins, $potential_plugin_name);
			}
		}

		return $active_plugins;
	}
}
