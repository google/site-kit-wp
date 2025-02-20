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
 * @group Assets
 */
class Plugin_StatusTest extends TestCase {
	/**
	 * Initial active plugin state array.
	 */
	private $initial_active_plugins_state;

	public function set_up() {
		parent::set_up();

		$this->initial_active_plugins_state = $GLOBALS['wp_tests_options']['active_plugins'];
	}

	public function tear_down() {
		parent::tear_down();
		$this->reset_plugins();
	}

	public function activate_plugin( $plugin_path = '' ) {
		if ( empty( $plugin_path ) ) {
			return;
		}
		if ( ! array_key_exists( $plugin_path, $GLOBALS['wp_tests_options']['active_plugins'] ) ) {
			$GLOBALS['wp_tests_options']['active_plugins'][] = $plugin_path;
		}
	}

	public function deactivate_plugin( $plugin_path = '' ) {
		if ( array_key_exists( $plugin_path, $GLOBALS['wp_tests_options']['active_plugins'] ) ) {
			unset( $GLOBALS['wp_tests_options']['active_plugins'][ $plugin_path ] );
		}
	}

	public function reset_plugins() {
		$GLOBALS['wp_tests_options']['active_plugins'] = $this->initial_active_plugins_state;
	}
}
