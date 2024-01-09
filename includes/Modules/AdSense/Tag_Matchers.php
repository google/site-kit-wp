<?php
/**
 * Class Google\Site_Kit\Core\Modules\Tags\Tag_Matchers
 *
 * @package   Google\Site_Kit\Core\Modules\Tags
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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Tag_Matchers extends Module_Tag_Matchers implements Tag_Matchers_Interface {

	/**
	 * Holds array of regex tag matchers.
	 *
	 * @since n.e.x.t
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
