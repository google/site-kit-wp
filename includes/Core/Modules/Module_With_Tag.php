<?php
/**
 * Trait Google\Site_Kit\Core\Modules\Module_With_Tag
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Matchers;

interface Module_With_Tag {

	/**
	 * Registers the tag.
	 *
	 * @since 1.119.0
	 */
	public function register_tag();

	/**
	 * Returns the Module_Tag_Matchers instance.
	 *
	 * @since 1.119.0
	 *
	 * @return Module_Tag_Matchers Module_Tag_Matchers instance.
	 */
	public function get_tag_matchers();

	/**
	 * Checks if the module tag is found in the provided content.
	 *
	 * @since 1.119.0
	 *
	 * @param string $content Content to search for the tags.
	 * @return bool TRUE if tag is found, FALSE if not.
	 */
	public function has_placed_tag_in_content( $content );
}
