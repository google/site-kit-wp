<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Module_With_Existing_Tag
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Interface for a module that have data available state.
 *
 * @since 1.96.0
 * @access private
 * @ignore
 */
interface Module_With_Existing_Tag {

	/**
	 * Gets the existing tag for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The existing tag for the module.
	 */
	public function get_existing_tag();

	/**
	 * Gets the tag matchers for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The tag matchers for the module.
	 */
	public function get_existing_tag_matchers();

	/**
	 * Checks if a tag is valid for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $tag The tag to check.
	 * @return bool True if the tag is valid, false otherwise.
	 */
	public function is_valid_existing_tag( $tag );
}
