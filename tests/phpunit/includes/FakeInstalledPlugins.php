<?php

namespace Google\Site_Kit\Tests;

trait FakeInstalledPlugins {

	/**
	 * Mocks a fake set of known installed plugins, returned by `get_plugins()`.
	 */
	protected function mock_installed_plugins() {
		// Installed plugins are stored in cache as an array, under an empty string key.
		// [ plugin-file ] => Array(data)

		$sk_plugin_data = get_plugin_data( GOOGLESITEKIT_PLUGIN_MAIN_FILE, false, false );
		$installed      = array(
			// Include SK using a fixed file path to avoid fragility.
			'google-site-kit/google-site-kit.php' => $sk_plugin_data,
			'test/test.php'                       => array_merge(
				$sk_plugin_data,
				array(
					'Name'      => 'Test Plugin',
					'PluginURI' => 'https://example.com/test-plugin',
					'Version'   => '1.0',
				)
			),
		);

		$this->set_installed_plugins( $installed );
		// Cache is flushed in the core testcase's set_up method, so no reset is needed.
	}

	/**
	 * Sets the installed plugin data with the given.
	 * @param array $installed {
	 *     @type string $plugin_file => {
	 *         @type string $Name Plugin name. (see `get_plugin_data` for rest)
	 *     }
	 * }
	 * @return void
	 */
	protected function set_installed_plugins( array $installed ) {
		wp_cache_set( 'plugins', array( '' => $installed ), 'plugins' );
	}
}
