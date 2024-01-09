<?php
/**
 * Class Google\Site_Kit\Core\Modules\Tags\Tag_Matchers
 *
 * @package   Google\Site_Kit\Core\Modules\Tags
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules\Analytics_4;

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
			// Detect gtag script calls.
			"/<script [^>]*src=['|\"]https:\/\/www.googletagmanager.com\/gtag\/js\?id=(UA-.*?)['|\"][^>]*><\/script>/",

			// Detect common analytics code usage.
			'/<script[^>]*>[^<]+google-analytics\.com\/analytics\.js[^<]+(UA-\d+-\d+)/',

			// Detect __gaTracker create calls.
			"/__gaTracker\( ?['|\"]create['|\"]\, ?['|\"](UA-.*?)['|\"]\, ?['|\"]auto['|\"] ?\)/",

			// Detect ga create calls.
			"/ga\( ?['|\"]create['|\"]\, ?['|\"](UA-.*?)['|\"]\, ?['|\"]auto['|\"] ?\)/",

			// Detect _gaq.push calls.
			"/_gaq.push\( ?\[ ?['|\"]_setAccount['|\"]\, ?['|\"](UA-.*?)['|\"] ?\] ?\)/",

			// Detect amp-analytics gtag.
			'/<amp-analytics [^>]*type="gtag"[^>]*>[^<]*<script type="application\/json">[^<]*"gtag_id":\s*"(UA-[^""]+)"/',

			// Detect amp-analytics googleanalytics.
			'/<amp-analytics [^>]*type="googleanalytics"[^>]*>[^<]*<script type="application\/json">[^<]*"account":\s*"(UA-[^""]+)"/',
		);
	}

}
