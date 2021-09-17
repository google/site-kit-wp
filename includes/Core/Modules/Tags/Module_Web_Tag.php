<?php
/**
 * Class Google\Site_Kit\Core\Modules\Tags\Module_Web_Tag
 *
 * @package   Google\Site_Kit\Core\Modules\Tags
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules\Tags;

use Google\Site_Kit\Core\Tags\Blockable_Tag_Interface;

/**
 * Base class for Web tag.
 *
 * @since 1.24.0
 * @access private
 * @ignore
 */
abstract class Module_Web_Tag extends Module_Tag implements Blockable_Tag_Interface {

	/**
	 * Checks whether or not the tag should be blocked from rendering.
	 *
	 * @since 1.24.0
	 *
	 * @return bool TRUE if the tag should be blocked, otherwise FALSE.
	 */
	public function is_tag_blocked() {
		/**
		 * Filters whether or not the tag should be blocked from rendering.
		 *
		 * @since 1.24.0
		 *
		 * @param bool $blocked Whether or not the tag output is suppressed. Default: false.
		 */
		return (bool) apply_filters( "googlesitekit_{$this->module_slug}_tag_blocked", false );
	}

	/**
	 * Gets the HTML attributes for a script tag that may potentially require user consent before loading.
	 *
	 * @since 1.24.0
	 *
	 * @return string HTML attributes to add if the tag requires consent to load, or an empty string.
	 */
	public function get_tag_blocked_on_consent_attribute() {
		/**
		 * Filters whether the tag requires user consent before loading.
		 *
		 * @since 1.24.0
		 *
		 * @param bool $blocked Whether or not the tag requires user consent to load. Default: false.
		 */
		if ( apply_filters( "googlesitekit_{$this->module_slug}_tag_block_on_consent", false ) ) {
			return ' type="text/plain" data-block-on-consent';
		}

		return '';
	}

	/**
	 * Gets the array of HTML attributes for a script tag that may potentially require user consent before loading.
	 *
	 * @since 1.41.0
	 *
	 * @return array containing HTML attributes to add if the tag requires consent to load, or an empty array.
	 */
	public function get_tag_blocked_on_consent_attribute_array() {
		/**
		 * Filters whether the tag requires user consent before loading.
		 *
		 * @since 1.24.0
		 *
		 * @param bool $blocked Whether or not the tag requires user consent to load. Default: false.
		 */
		if ( apply_filters( "googlesitekit_{$this->module_slug}_tag_block_on_consent", false ) ) {
			return array(
				'type'                  => 'text/plain',
				'data-block-on-consent' => true,
			);
		}

		return array();
	}

	/**
	 * Fires the "googlesitekit_{module_slug}_init_tag" action to let 3rd party plugins to perform required setup.
	 *
	 * @since 1.24.0
	 */
	protected function do_init_tag_action() {
		/**
		 * Fires when the tag has been initialized which means that the tag will be rendered in the current request.
		 *
		 * @since 1.24.0
		 *
		 * @param string $tag_id Tag ID.
		 */
		do_action( "googlesitekit_{$this->module_slug}_init_tag", $this->tag_id );
	}

}
