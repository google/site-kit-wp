<?php
/**
 * Class Google\Site_Kit\Modules\Ads\Tag_Matchers
 *
 * @package   Google\Site_Kit\Core\Modules\Ads
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Ads;

use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Matchers;
use Google\Site_Kit\Core\Tags\Tag_Matchers_Interface;

/**
 * Class for Tag matchers.
 *
 * @since 1.124.0
 * @access private
 * @ignore
 */
class Tag_Matchers extends Module_Tag_Matchers implements Tag_Matchers_Interface {

	/**
	 * Holds array of regex tag matchers.
	 *
	 * @since 1.124.0
	 *
	 * @return array Array of regex matchers.
	 */
	public function regex_matchers() {
		return array(
			"/gtag\\s*\\(\\s*['|\"]config['|\"]\\s*,\\s*['|\"](AW-[0-9]+)['|\"]\\s*\\)/i",
		);
	}
}
