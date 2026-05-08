<?php
/**
 * Class Google\Site_Kit\Core\Modules\Analytics_4\Tag_Matchers
 *
 * @package   Google\Site_Kit\Core\Modules\Analytics_4
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
		$tag_matchers = array(
			"/__gaTracker\s*\(\s*['|\"]create['|\"]\s*,\s*['|\"](G-[a-zA-Z0-9]+)['|\"]\, ?['|\"]auto['|\"]\s*\)/i",
			"/_gaq\.push\s*\(\s*\[\s*['|\"][^_]*_setAccount['|\"]\s*,\s*['|\"](G-[a-zA-Z0-9]+)['|\"]\s*],?\s*\)/i",
			'/<amp-analytics\s+[^>]*type="gtag"[^>]*>[^<]*<script\s+type="application\/json">[^<]*"gtag_id"\s*:\s*"(G-[a-zA-Z0-9]+)"/i',
			'/<amp-analytics\s+[^>]*type="googleanalytics"[^>]*>[^<]*<script\s+type="application\/json">[^<]*"account"\s*:\s*"(G-[a-zA-Z0-9]+)"/i',
		);

		$subdomains = array( '', 'www\\.' );
		foreach ( $subdomains as $subdomain ) {
			$tag_matchers[] = "/<script\\s+[^>]*src=['|\"]https?:\\/\\/" . $subdomain . "googletagmanager\\.com\\/gtag\\/js\\?id=(G-[a-zA-Z0-9]+)['|\"][^>]*><\\/script>/i";
			$tag_matchers[] = "/<script\\s+[^>]*src=['|\"]https?:\/\/" . $subdomain . "googletagmanager\\.com\\/gtag\\/js\\?id=(G-[a-zA-Z0-9]+)['|\"][^\\/]*\/>/i";
		}

		$funcs = array( '__gaTracker', 'ga', 'gtag' );
		foreach ( $funcs as $func ) {
			$tag_matchers[] = "/$func\\s*\\(\\s*['|\"]create['|\"]\\s*,\\s*['|\"](G-[a-zA-Z0-9]+)['|\"]\\,\\s*['|\"]auto['|\"]\\s*\\)/i";
			$tag_matchers[] = "/$func\\s*\\(\\s*['|\"]config['|\"]\\s*,\\s*['|\"](G-[a-zA-Z0-9]+)['|\"]\\s*\\)/i";
			$tag_matchers[] = "/$func\\s*\\(\\s*['|\"]config['|\"]\\s*,\\s*['|\"](GT-[a-zA-Z0-9]+)['|\"]\\s*\\)/i";
		}

		return $tag_matchers;
	}
}
