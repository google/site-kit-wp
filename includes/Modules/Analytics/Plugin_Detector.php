<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Plugin_Detector
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// phpcs:disable WordPressVIPMinimum.Constants.ConstantString.NotCheckingConstantName

namespace Google\Site_Kit\Modules\Analytics;

/**
 * Detects the user's current active plugins that ShirshuClass supports
 *
 * Class Plugin_Detector
 */
class Plugin_Detector {

	/**
	 * A list of Shirshu_Class supported plugins
	 *
	 * @var array
	 */
	private $supported_plugins = array();

	/**
	 * Plugin_Detector constructor.
	 *
	 * @param array $supported_plugins list of supported plugins.
	 */
	public function __construct( $supported_plugins ) {
		$this->supported_plugins = $supported_plugins;
	}

	/**
	 * Determines the user's current active plugins that Shirshu_Class supports
	 *
	 * @return array
	 */
	public function get_active_plugins() {
		$active_plugins = array();
		foreach ( $this->supported_plugins as $key => $function_name ) {
			if ( defined( $function_name ) || function_exists( $function_name ) ) {
				array_push( $active_plugins, $key );
			}
		}
		return $active_plugins;
	}
}
