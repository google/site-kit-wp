<?php
/**
 * Trait Google\Site_Kit\Core\Tracking\Feature_Metrics_Trait
 *
 * @package   Google\Site_Kit\Core\Tracking
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tracking;

trait Feature_Metrics_Trait {

	/**
	 * Registers the feature metrics to be tracked.
	 *
	 * @since 1.162.0
	 *
	 * @return void
	 */
	public function register_feature_metrics() {
		add_filter(
			'googlesitekit_feature_metrics',
			function ( $feature_metrics ) {
				$feature_metrics = array_merge(
					is_array( $feature_metrics ) ? $feature_metrics : array(),
					$this->get_feature_metrics()
				);

				return $feature_metrics;
			}
		);
	}
}
