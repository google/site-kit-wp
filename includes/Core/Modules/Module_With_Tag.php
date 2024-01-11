<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Module_With_Tag
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
	 * Returns the module Tag_Matchers instance.
	 *
	 * @since n.e.x.t
	 *
	 * @return Module_Tag_Matchers Instance of Module_Tag_Matchers.
	 */
	public function get_tag_matchers();

	/**
	 * Checks if the module tag is found in the provided content.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $content Content to search for the tags.
	 * @return bool TRUE if tag is found, FALSE if not.
	 */
	public function has_tag( $content );

	/**
	 * Checks if the module tag is found in the provided content.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Formatted module name.
	 */
	public function get_module_name_from_slug();
}
