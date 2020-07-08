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

	private $mock_active_plugins;

	/**
	 * MockPluginDetector constructor.
	 */
	public function __construct() {
		$this->mock_active_plugins = array();
	}

	/**
	 * Returns the current list of active_plugins.
	 *
	 * @return array
	 */
	public function determine_active_plugins() {
		return $this->mock_active_plugins;
	}

	/**
	 * Adds the specified plugin to active plugin list if not already added.
	 *
	 * @param string $plugin_name plugin to be added.
	 */
	public function add_active_plugin( $plugin_name ) {
		if ( in_array( $plugin_name, $this->mock_active_plugins ) ) {
			return;
		}
		array_push( $this->mock_active_plugins, $plugin_name );
	}

	/**
	 * Removes the specified plugin from active plugin list.
	 *
	 * @param string $plugin_name plugin to be removed.
	 */
	public function remove_active_plugin( $plugin_name ) {
		$key = array_search( $plugin_name, $this->mock_active_plugins );
		if ( false !== $key ) {
			unset( $this->mock_active_plugins[ $key ] );
		}
	}
}
