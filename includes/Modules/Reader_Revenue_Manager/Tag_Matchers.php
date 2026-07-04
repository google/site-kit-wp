<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Tag_Matchers
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Matchers;
use Google\Site_Kit\Core\Tags\Tag_Matchers_Interface;

/**
 * Class for Tag matchers.
 *
 * @since 1.132.0
 * @access private
 * @ignore
 */
class Tag_Matchers extends Module_Tag_Matchers implements Tag_Matchers_Interface {

	/**
	 * Holds array of regex tag matchers.
	 *
	 * @since 1.132.0
	 *
	 * @return array Array of regex matchers.
	 */
	public function regex_matchers() {
		return array(
			"/<script\s+[^>]*src=['|\"]https?:\/\/news\.google\.com\/swg\/js\/v1\/swg-basic\.js['|\"][^>]*>/",
			'/\(self\.SWG_BASIC=self\.SWG_BASIC\|\|\[\]\)\.push/',
		);
	}
}
