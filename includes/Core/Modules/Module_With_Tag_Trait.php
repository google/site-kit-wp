<?php
/**
 * Trait Google\Site_Kit\Core\Modules\Module_With_Tag_Trait
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Matchers;

trait Module_With_Tag_Trait {

	/**
	 * Checks if the module tag is found in the provided content.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $content Content to search for the tags.
	 * @return bool TRUE if tag is found, FALSE if not.
	 */
	public function has_tag( $content ) {
		$tag_matchers = $this->get_tag_matchers()->regex_matchers();
		$module_name  = $this->get_module_name_from_slug();

		$search_string = 'Google ' . $module_name . ' snippet added by Site Kit';

		if ( strpos( $content, $search_string ) !== false ) {
			return Module_Tag_Matchers::TAG_EXISTS_WITH_COMMENTS;
		} else {
			foreach ( $tag_matchers as $pattern ) {
				if ( preg_match( $pattern, $content ) ) {
					return Module_Tag_Matchers::TAG_EXISTS;
				}
			}
		}

		return Module_Tag_Matchers::NO_TAG_FOUND;
	}

	/**
	 * Checks if the module tag is found in the provided content.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Formatted module name.
	 */
	public function get_module_name_from_slug() {
		if ( 'adsense' === $this->slug ) {
			$module_name = 'AdSense';
		}
		if ( 'analytics-4' === $this->slug ) {
			$module_name = 'Analytics';
		}
		if ( 'tagmanager' === $this->slug ) {
			$module_name = 'Tag Manager';
		}

		return $module_name;
	}
}
