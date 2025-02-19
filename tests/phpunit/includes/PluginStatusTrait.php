<?php
/**
 * PluginStatusTrait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

trait PluginStatusTrait {

	protected $active_plugins = array();

	protected $active_plugins_callback;

	public function activate_plugin( $plugin_path ) {
		if ( ! in_array( $plugin_path, $this->active_plugins, true ) ) {
			$this->active_plugins[] = $plugin_path;
		}

		if ( null === $this->active_plugins_callback ) {
			$this->active_plugins_callback = array( $this, 'filter_active_plugins' );
			add_filter( 'pre_option_active_plugins', $this->active_plugins_callback );
		}
	}

	public function filter_active_plugins( $plugins ) {
		return array_merge( $plugins, $this->active_plugins );
	}

	public function deactivate_all_test_plugins() {
		if ( null !== $this->active_plugins_callback ) {
			remove_filter( 'pre_option_active_plugins', $this->active_plugins_callback );
			$this->active_plugins_callback = null;
		}

		$this->active_plugins = array();
	}
}
