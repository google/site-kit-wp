<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Tag_Guard
 *
 * @package   Google\Site_Kit\Modules\AdSense
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\AdSense;

use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Guard;

/**
 * Class for the AdSense tag guard.
 *
 * @since 1.24.0
 * @access private
 * @ignore
 */
class Tag_Guard extends Module_Tag_Guard {

	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since 1.24.0
	 * @since 1.30.0 Update to return FALSE on 404 pages deliberately.
	 *
	 * @return bool|WP_Error TRUE if guarded tag can be activated, otherwise FALSE or an error.
	 */
	public function can_activate() {
		// Do not allow AdSense tags on 404 pages.
		if ( is_404() ) {
			return false;
		}

		$settings = $this->settings->get();

		// For web stories, the tag must only be rendered if a story-specific ad unit is provided.
		if ( is_singular( 'web-story' ) && empty( $settings['webStoriesAdUnit'] ) ) {
			return false;
		}

		return ! empty( $settings['useSnippet'] ) && ! empty( $settings['clientID'] );
	}

}
