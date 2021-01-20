<?php
/**
 * Interface Google\Site_Kit\Core\Tags\Blockable_Tag_Interface
 *
 * @package   Google\Site_Kit\Core\Tags
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags;

/**
 * Interface for a blockable tag.
 *
 * @since 1.24.0
 * @access private
 * @ignore
 */
interface Blockable_Tag_Interface {

	/**
	 * Checks whether or not the tag should be blocked from rendering.
	 *
	 * @since 1.24.0
	 *
	 * @return bool TRUE if the tag should be blocked, otherwise FALSE.
	 */
	public function is_tag_blocked();

	/**
	 * Gets the HTML attributes for a script tag that may potentially require user consent before loading.
	 *
	 * @since 1.24.0
	 *
	 * @return string HTML attributes to add if the tag requires consent to load, or an empty string.
	 */
	public function get_tag_blocked_on_consent_attribute();

}
