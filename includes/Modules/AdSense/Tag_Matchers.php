<?php
/**
 * Class Google\Site_Kit\Core\Modules\AdSense\Tag_Matchers
 *
 * @package   Google\Site_Kit\Core\Modules\AdSense
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules\AdSense;

use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Matchers;
use Google\Site_Kit\Core\Tags\Tag_Matchers_Interface;

/**
 * Class for Tag matchers.
 *
 * @since 1.119.0
 * @access private
 * @ignore
 */
class Tag_Matchers extends Module_Tag_Matchers implements Tag_Matchers_Interface {

	/**
	 * Holds array of regex tag matchers.
	 *
	 * @since 1.119.0
	 *
	 * @return array Array of regex matchers.
	 */
	public function regex_matchers() {
		return array(
			// Detect google_ad_client.
			"/google_ad_client: ?[\"|'](.*?)[\"|']/",

			// Detect old style auto-ads tags.
			'/<(?:script|amp-auto-ads) [^>]*data-ad-client="([^"]+)"/',

			// Detect new style auto-ads tags.
			'/<(?:script|amp-auto-ads)[^>]*src="[^"]*\\?client=(ca-pub-[^"]+)"[^>]*>/',
		);
	}
}
