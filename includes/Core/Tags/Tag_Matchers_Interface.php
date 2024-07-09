<?php
/**
 * Interface Google\Site_Kit\Core\Tags\Tag_Matchers_Interface
 *
 * @package   Google\Site_Kit\Core\Tags
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags;

/**
 * Interface for tag matchers.
 *
 * @since 1.119.0
 * @access private
 * @ignore
 */
interface Tag_Matchers_Interface {

	/**
	 * Holds array of regex tag matchers.
	 *
	 * @since 1.119.0
	 *
	 * @return array Array of regex matchers.
	 */
	public function regex_matchers();
}
