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

}
