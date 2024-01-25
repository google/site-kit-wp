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
	 * @since 1.119.0
	 *
	 * @param string $content Content to search for the tags.
	 * @return bool TRUE if tag is found, FALSE if not.
	 */
	public function has_placed_tag_in_content( $content ) {
		$tag_matchers = $this->get_tag_matchers()->regex_matchers();
		$module_name  = $this->name;

		// Remove 4 from translatable string name of the module if present.
		if ( strpos( $module_name, '4' ) !== false ) {
			$module_name = trim( str_replace( '4', '', $module_name ) );
		}

		$search_string = 'Google ' . $module_name . ' snippet added by Site Kit';
		// @TODO Replace the comment text around the module name with methods that should expose it.
		$search_translatable_string = sprintf(
			/* translators: %s: translatable module name */
			__( 'Google %s snippet added by Site Kit', 'google-site-kit' ),
			$module_name
		);

		if ( strpos( $content, $search_string ) !== false || strpos( $content, $search_translatable_string ) !== false ) {
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

}
