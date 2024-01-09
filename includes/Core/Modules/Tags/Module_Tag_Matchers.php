<?php
/**
 * Class Google\Site_Kit\Core\Modules\Tags\Module_Tag_Matchers
 *
 * @package   Google\Site_Kit\Core\Modules\Tags
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules\Tags;

use Google\Site_Kit\Core\Tags\Tag_Matchers_Interface;

/**
 * Base class for Tag matchers.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
abstract class Module_Tag_Matchers implements Tag_Matchers_Interface {

	/**
	 * Holds array of regex tag matchers.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Array of regex matchers.
	 */
	public function regex_matchers() {
		return array();
	}

	/**
	 * Checks if module tag is found in the provided content.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $content Content to search for the tags.
	 * @return bool TRUE if tag is found, FALSE if not.
	 */
	public function has_tag( $content ) {
		$tag_matchers = $this->regex_matchers();

		$matches = array_filter(
			$tag_matchers,
			function( $pattern ) use ( $content ) {
				return preg_match( $pattern, $content );
			}
		);

		return ! empty( $matches );
	}
}
