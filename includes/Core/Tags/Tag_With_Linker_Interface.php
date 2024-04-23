<?php
/**
 * Class Google\Site_Kit\Core\Tags\Tag_With_Linker_Interface
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags;

/**
 * Interface for a tag implementing linker domain.
 *
 * @since 1.125.0
 * @access private
 * @ignore
 */
interface Tag_With_Linker_Interface {
	/**
	 * Sets the current home domain.
	 *
	 * @since 1.125.0
	 *
	 * @param string $domain Domain name.
	 */
	public function set_home_domain( $domain );
}
