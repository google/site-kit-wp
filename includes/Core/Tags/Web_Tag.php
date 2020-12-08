<?php
/**
 * Class Google\Site_Kit\Core\Tags\Web_Tag
 *
 * @package   Google\Site_Kit\Core\Tags
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags;

/**
 * Base class for Web tag.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
abstract class Web_Tag extends Tag implements Blockable_Tag_Interface {

	/**
	 * Checks whether or not the tag should be blocked from rendering.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool TRUE if the tag should be blocked, otherwise FALSE.
	 */
	public function is_tag_blocked() {
		/**
		 * Filters whether or not the tag should be blocked from rendering.
		 *
		 * @since n.e.x.t
		 *
		 * @param bool $blocked Whether or not the tag output is suppressed. Default: false.
		 */
		return (bool) apply_filters( "googlesitekit_{$this->module_slug}_tag_blocked", false );
	}

	/**
	 * Gets the HTML attributes for a script tag that may potentially require user consent before loading.
	 *
	 * @since n.e.x.t
	 *
	 * @return string HTML attributes to add if the tag requires consent to load, or an empty string.
	 */
	public function get_tag_blocked_on_consent_attribute() {
		/**
		 * Filters whether the tag requires user consent before loading.
		 *
		 * @since n.e.x.t
		 *
		 * @param bool $blocked Whether or not the tag requires user consent to load. Default: false.
		 */
		if ( apply_filters( "googlesitekit_{$this->module_slug}_tag_block_on_consent", false ) ) {
			return ' type="text/plain" data-block-on-consent';
		}

		return '';
	}

}
