<?php
/**
 * Class Google\Site_Kit\Core\Tracking\Feature_Metrics
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Screen;
use Google\Site_Kit\Core\Admin\Screens;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class managing the collection of internal site-wide feature
 * metrics for tracking via the `site-management/features` endpoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Feature_Metrics {

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		/**
		 * Filters internal feature metrics data sent with the body of a remote-controlled features request.
		 *
		 * @since n.e.x.t
		 *
		 * @param array $feature_metrics Feature metrics tracking data to be sent with the features request.
		 */
		$feature_metrics = apply_filters( 'googlesitekit_feature_metrics', array() );

		add_filter(
			'googlesitekit_features_request_data',
			function ( $body ) use ( $feature_metrics ) {
				$body['feature_metrics'] = $feature_metrics;
				return $body;
			}
		);
	}
}
