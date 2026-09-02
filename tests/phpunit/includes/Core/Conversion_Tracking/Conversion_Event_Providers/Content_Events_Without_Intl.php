<?php
/**
 * Class Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers\Content_Events_Without_Intl
 *
 * @package   Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Content_Events;

/**
 * Content events provider that counts words without International Components
 * for Unicode (ICU).
 *
 * `intl` is an optional PHP extension, and a server can run without it. This
 * subclass turns the ICU word count off, so the tests cover the path a server
 * without `intl` takes.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Content_Events_Without_Intl extends Content_Events {

	/**
	 * Reports ICU as missing, even where PHP has the `intl` extension.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $text Text with the tags and shortcodes already removed.
	 * @return null Always `null`, so the provider counts words without ICU.
	 */
	protected function count_words_with_intl( $text ) {
		return null;
	}
}
