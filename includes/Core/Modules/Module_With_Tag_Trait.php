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

use Google\Site_Kit\Core\Modules\Tags\Module_Tag;
use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Matchers;
use Google\Site_Kit\Core\Tags\GTag;

trait Module_With_Tag_Trait {

	/**
	 * Checks if the module tag is found in the provided content.
	 *
	 * Site Kit placed the tag where one of the module's tag IDs is in an element's tag ID attribute. Site Kit also
	 * placed the tag where one of the module's Google tag IDs is in a config call of Site Kit's Google tag.
	 *
	 * @since 1.119.0
	 * @since n.e.x.t Finds the tag Site Kit placed by its tag ID, in place of its HTML comment.
	 *
	 * @param string $content Content to search for the tags.
	 * @return int One of `Module_Tag_Matchers::TAG_PLACED_BY_SITE_KIT`, `TAG_EXISTS` and `NO_TAG_FOUND`.
	 */
	public function has_placed_tag_in_content( $content ) {
		if ( $this->has_tag_id_attribute_in_content( $content ) || $this->has_google_tag_id_in_content( $content ) ) {
			return Module_Tag_Matchers::TAG_PLACED_BY_SITE_KIT;
		}

		foreach ( $this->get_tag_matchers()->regex_matchers() as $pattern ) {
			if ( preg_match( $pattern, $content ) ) {
				return Module_Tag_Matchers::TAG_EXISTS;
			}
		}

		return Module_Tag_Matchers::NO_TAG_FOUND;
	}

	/**
	 * Gets the tag IDs that the module's elements can have in their tag ID attribute.
	 *
	 * @since n.e.x.t
	 *
	 * @return string[] Tag IDs.
	 */
	abstract protected function get_tag_attribute_ids();

	/**
	 * Gets the tag IDs that the module adds to Site Kit's Google tag.
	 *
	 * @since n.e.x.t
	 *
	 * @return string[] Tag IDs. None by default.
	 */
	protected function get_google_tag_ids() {
		return array();
	}

	/**
	 * Checks if an element in the content has one of the module's tag IDs in its tag ID attribute.
	 *
	 * The value can be in double, single or no quotes, because optimization plugins rewrite the markup.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $content Content to search for the attribute.
	 * @return bool TRUE if an element has one of the module's tag IDs in the attribute, FALSE if not.
	 */
	private function has_tag_id_attribute_in_content( $content ) {
		$attribute = preg_quote( Module_Tag::TAG_ID_ATTRIBUTE, '/' );

		foreach ( array_filter( $this->get_tag_attribute_ids() ) as $tag_id ) {
			$quoted_tag_id = preg_quote( $tag_id, '/' );

			// The closing quote, or a space or `>` after a value with no quotes, ends the whole ID.
			$pattern = "/\\s{$attribute}\\s*=\\s*(?:\"{$quoted_tag_id}\"|'{$quoted_tag_id}'|{$quoted_tag_id}(?=[\\s>]))/";

			if ( preg_match( $pattern, $content ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Checks if Site Kit's Google tag configures one of the module's Google tag IDs.
	 *
	 * Site Kit's Google tag is the inline script that sets Site Kit's developer ID. The `config` call can
	 * have single or double quotes, and spaces or none, because optimization plugins rewrite the script.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $content Content to search for Site Kit's Google tag.
	 * @return bool TRUE if Site Kit's Google tag configures one of the module's Google tag IDs, FALSE if not.
	 */
	private function has_google_tag_id_in_content( $content ) {
		$tag_ids = array_filter( $this->get_google_tag_ids() );

		if ( empty( $tag_ids ) || ! preg_match_all( '/<script\b[^>]*>(.*?)<\/script>/is', $content, $scripts ) ) {
			return false;
		}

		foreach ( $scripts[1] as $script ) {
			if ( false === strpos( $script, 'developer_id.' . GTag::DEVELOPER_ID ) ) {
				continue;
			}

			foreach ( $tag_ids as $tag_id ) {
				$pattern = '/gtag\s*\(\s*([\'"])config\1\s*,\s*([\'"])' . preg_quote( $tag_id, '/' ) . '\2/';

				if ( preg_match( $pattern, $script ) ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Gets the URL of the page where a tag for the module would be placed.
	 *
	 * For all modules like Analytics, Tag Manager, AdSense, Ads, etc. except for
	 * Sign in with Google, tags can be detected on the home page. SiwG places its
	 * snippet on the login page and thus, overrides this method.
	 *
	 * @since 1.140.0
	 *
	 * @return string The home page URL string where tags are placed for most modules.
	 */
	public function get_content_url() {
		return home_url();
	}
}
