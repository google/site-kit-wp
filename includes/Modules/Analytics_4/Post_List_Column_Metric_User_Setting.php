<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Post_List_Column_Metric_User_Setting
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * User setting: GA4 post list metric.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Post_List_Column_Metric_User_Setting extends User_Setting {

	const OPTION = Post_List_Column_Preferences::OPTION_METRIC;

	/**
	 * Gets the default metric.
	 *
	 * @since n.e.x.t
	 *
	 * @return string
	 */
	protected function get_default() {
		return Post_List_Column_Preferences::DEFAULT_METRIC;
	}

	/**
	 * Sanitizes stored value.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable|null
	 */
	protected function get_sanitize_callback() {
		return function ( $value ) {
			if ( ! is_string( $value ) ) {
				return Post_List_Column_Preferences::DEFAULT_METRIC;
			}
			return in_array( $value, Post_List_Column_Preferences::ALLOWED_METRICS, true )
				? $value
				: Post_List_Column_Preferences::DEFAULT_METRIC;
		};
	}
}
