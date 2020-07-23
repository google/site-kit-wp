<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Advanced_Tracking\Plugin_Detector
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

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
	 * Determines the user's current active plugins that Advanced_Tracking supports.
	 *
	 * @since n.e.x.t.
	 *
	 * @param  array $supported_plugins The List of supported plugins.
	 * @return array $active_plugins The list of active plugin configurations.
	 */
	public function determine_active_plugins( $supported_plugins ) {
		return array_filter(
			$supported_plugins,
			function( $plugin_config ) {
				if ( self::TYPE_CONSTANT === $plugin_config['check_type'] &&
				     defined( $plugin_config['check_name'] ) ) { // phpcs:ignore WordPressVIPMinimum.Constants.ConstantString.NotCheckingConstantName
					return true;
				}
				if ( self::TYPE_FUNCTION === $plugin_config['check_type'] &&
				     function_exists( $plugin_config['check_name'] ) ) {
					return true;
				}
				return false;
			}
		);
	}
}
