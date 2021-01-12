<?php
/**
 * Interface Google\Site_Kit\Core\Tags\Tag_Interface
 *
 * @package   Google\Site_Kit\Core\Tags
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags;

/**
 * Interface for a tag.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
interface Tag_Interface {

	/**
	 * Registers tag hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register();

	/**
	 * Determines whether the tag can be register or not.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool TRUE if the tag can be register, otherwise FALSE.
	 */
	public function can_register();

}
