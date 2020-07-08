<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Plugin_Detector
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// phpcs:disable WordPressVIPMinimum.Constants.ConstantString.NotCheckingConstantName
// phpcs:disable WordPress.NamingConventions.ValidVariableName.PropertyNotSnakeCase
// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

namespace Google\Site_Kit\Modules\Analytics\Advanced_Tracking;

/**
 * Class for detecting the user's current active plugins that Advanced_Tracking class supports.
 *
 * @since n.e.x.t.
 * @access private
 * @ignore
 */
class Plugin_Detector {

	/**
	 * A list of AdvancedTracking supported plugins.
	 *
	 * @since n.e.x.t.
	 * @var array
	 */
	private $supported_plugins = array();

	/**
	 * The constant check_type string for support_plugins array in the Advanced_Tracking class.
	 *
	 * @since n.e.x.t.
	 * @var string
	 */
	public static $TYPE_CONSTANT = 'CONSTANT';

	/**
	 * The function check_type string for support_plugins array in the Advanced_Tracking class.
	 *
	 * @since n.e.x.t.
	 * @var string
	 */
	public static $TYPE_FUNCTION = 'FUNCTION';

	/**
	 * Plugin_Detector constructor.
	 *
	 * @since n.e.x.t.
	 *
	 * @param array $supported_plugins list of supported plugins.
	 */
	public function __construct( $supported_plugins ) {
		$this->supported_plugins = $supported_plugins;
	}

	/**
	 * Determines the user's current active plugins that AdvancedTracking supports.
	 *
	 * @since n.e.x.t.
	 *
	 * @return array
	 */
	public function determine_active_plugins() {
		$active_plugins = array();
		foreach ( $this->supported_plugins as $current_plugin ) {
			if ( ( $current_plugin['check_type'] == self::$TYPE_CONSTANT &&
					defined( $current_plugin['check_name'] ) ) ||
					( $current_plugin['check_type'] == self::$TYPE_FUNCTION &&
					function_exists( $current_plugin['check_name'] ) ) ) {
				array_push( $active_plugins, $current_plugin['name'] );
			}
		}
		return $active_plugins;
	}
}
