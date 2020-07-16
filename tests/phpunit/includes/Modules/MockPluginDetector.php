<?php
/**
 * Class Google\Site_Kit\Tests\Modules\MockPluginDetector
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Plugin_Detector;

class MockPluginDetector extends Plugin_Detector {

	/**
	 * The list of current active plugin configs.
	 *
	 * @since n.e.x.t.
	 * @var array
	 */
	private $mock_active_plugins;

	/**
	 * MockPluginDetector constructor.
	 *
	 * @since n.e.x.t.
	 */
	public function __construct() {
		$this->mock_active_plugins = array();
	}

	/**
	 * Returns the current list of active_plugins.
	 *
	 * @since n.e.x.t.
	 *
	 * @param array The list of supported plugins.
	 * @return array Current plugin configuration list.
	 */
	public function determine_active_plugins( $supported_plugins ) {
		return $this->mock_active_plugins;
	}

	/**
	 * Adds the specified plugin to active plugin list if not already added.
	 *
	 * @since n.e.x.t.
	 *
	 * @param string $plugin_name Plugin to be added.
	 * @param array $plugin_config The event tracking configuration information array for the plugin.
	 */
	public function add_active_plugin( $plugin_name, $plugin_config ) {
		if ( in_array( $plugin_config, $this->mock_active_plugins ) ) {
			return;
		}
		$this->mock_active_plugins[ $plugin_name ] = $plugin_config;
	}

	/**
	 * Removes the specified plugin from active plugin list.
	 *
	 * @since n.e.x.t.
	 *
	 * @param string $plugin_name plugin to be removed.
	 */
	public function remove_active_plugin( $plugin_name ) {
		unset( $this->mock_active_plugins[ $plugin_name ] );
	}
}
