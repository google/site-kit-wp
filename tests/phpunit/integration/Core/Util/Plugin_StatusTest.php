<?php
/**
 * Plugin_StatusTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Plugin_Status;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Plugin_StatusTest extends TestCase {

	/**
	 * @dataProvider data_is_plugin_installed
	 * @param string|\Closure $input
	 * @param boolean $expected
	 */
	public function test_is_plugin_installed( $input, $expected ) {
		$this->mock_installed_plugins();
		$actual = Plugin_Status::is_plugin_installed( $input );
		$this->assertEquals( $expected, $actual );
	}

	public function data_is_plugin_installed() {
		yield 'non-existent plugin' => array(
			'non-existent-plugin/non-existent-plugin.php',
			false,
		);

		yield 'existing plugin using file' => array(
			'google-site-kit/google-site-kit.php',
			true,
		);

		yield 'existing plugin using predicate returns file' => array(
			fn ( $plugin ) => 'https://example.com/test-plugin' === $plugin['PluginURI'],
			'test/test.php',
		);
	}

	private function mock_installed_plugins() {
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

		wp_cache_set( 'plugins', array( '' => $installed ), 'plugins' );
	}
}
