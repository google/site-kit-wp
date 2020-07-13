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
	const TYPE_CONSTANT = 'CONSTANT';

	/**
	 * The function check_type string for support_plugins array in the Advanced_Tracking class.
	 *
	 * @since n.e.x.t.
	 * @var string
	 */
	const TYPE_FUNCTION = 'FUNCTION';

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
	 * Determines the user's current active plugins that Advanced_Tracking supports.
	 *
	 * @since n.e.x.t.
	 *
	 * @return array $active_plugins The list of active plugin configurations.
	 */
	public function determine_active_plugins() {
		return array_filter(
			$this->supported_plugins,
			function( $plugin_config ) {
				return ( self::TYPE_CONSTANT === $plugin_config['check_type'] &&
					defined( $plugin_config['check_name'] ) ) ||
				( self::TYPE_FUNCTION === $plugin_config['check_type'] &&
					function_exists( $plugin_config['check_name'] ) );
			}
		);
	}
}
