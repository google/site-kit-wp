<?php
/**
 * Interface Google\Site_Kit\Core\Tracking\Provides_Feature_Metrics
 *
 * @package   Google\Site_Kit\Core\Tracking
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tracking;

/**
 * Interface for any feature that has metrics to be tracked via the
 * `site-management/features` endpoint.
 *
 * @since 1.162.0
 * @access private
 * @ignore
 */
interface Provides_Feature_Metrics {

	/**
	 * Gets feature metrics to be tracked.
	 *
	 * @since 1.162.0
	 *
	 * @return array Feature metrics tracking data to be tracked via the
	 * `site-management/features` endpoint.
	 */
	public function get_feature_metrics();
}
