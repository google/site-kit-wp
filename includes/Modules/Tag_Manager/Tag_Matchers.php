<?php
/**
 * Class Google\Site_Kit\Core\Modules\Tag_Manager\Tag_Matchers
 *
 * @package   Google\Site_Kit\Core\Modules\Tag_Manager
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules\Tag_Manager;

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
			// Detect injection script (Google provided code, duracelltomi-google-tag-manager, metronet-tag-manager (uses user-provided)).
			"/<script[^>]*>[^>]+?www.googletagmanager.com\/gtm[^>]+?['|\"](GTM-[0-9A-Z]+)['|\"]/",

			// Detect gtm.js script calls.
			"/<script[^>]*src=['|\"]https:\/\/www.googletagmanager.com\/gtm.js\?id=(GTM-[0-9A-Z]+)['|\"]/",

			// Detect iframe version for no-js.
			"/<script[^>]*src=['|\"]https:\/\/www.googletagmanager.com\/ns.html\?id=(GTM-[0-9A-Z]+)['|\"]/",

			// Detect amp tag.
			"/<amp-analytics [^>]*config=['|\"]https:\/\/www.googletagmanager.com\/amp.json\?id=(GTM-[0-9A-Z]+)['|\"]/",

			// Detect GTag usage.
			"/gtag\\s*\\(\\s*['\"]config['\"]\\s*,\\s*['\"](GTM-[a-zA-Z0-9]+)['\"]\\s*\\)/i",
		);
	}
}
