<?php
/**
 * Class Google\Site_Kit\Modules\Ads\Ads_Conversion_Tracking_Intent
 *
 * @package   Google\Site_Kit\Modules\Ads
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Ads;

use Google\Site_Kit\Core\Intents\Intent;
use Google\Site_Kit\Core\Util\Feature_Flags;

/**
 * Class for the intent to set up Ads conversion tracking.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Ads_Conversion_Tracking_Intent extends Intent {

	/**
	 * Intent ID.
	 *
	 * @since n.e.x.t
	 */
	const INTENT_ID = 'ads-conversion-tracking';

	/**
	 * Gets the intent ID.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Intent ID.
	 */
	public function get_id() {
		return self::INTENT_ID;
	}

	/**
	 * Checks whether the intent can currently be handled.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if the `adsConversionTrackingIntent` feature flag is enabled, false otherwise.
	 */
	public function is_available() {
		return Feature_Flags::enabled( 'adsConversionTrackingIntent' );
	}
}
