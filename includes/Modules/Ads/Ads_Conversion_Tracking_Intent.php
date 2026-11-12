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

/**
 * Class for the intent to set up Ads conversion tracking.
 *
 * @since 1.188.0
 * @access private
 * @ignore
 */
class Ads_Conversion_Tracking_Intent extends Intent {

	/**
	 * Intent ID.
	 *
	 * @since 1.188.0
	 */
	const INTENT_ID = 'ads-conversion-tracking';

	/**
	 * Gets the intent ID.
	 *
	 * @since 1.188.0
	 *
	 * @return string Intent ID.
	 */
	public function get_id() {
		return self::INTENT_ID;
	}
}
