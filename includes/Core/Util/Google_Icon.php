<?php
/**
 * Class Google\Site_Kit\Core\Util\Google_Icon
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

/**
 * Class for the Google SVG Icon
 *
 * @since n.e.x.t
 */
final class Google_Icon {

	const XML = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill="black" d="M17.6 8.5h-7.5v3h4.4c-.4 2.1-2.3 3.5-4.4 3.4-2.6-.1-4.6-2.1-4.7-4.7-.1-2.7 2-5 4.7-5.1 1.1 0 2.2.4 3.1 1.2l2.3-2.2C14.1 2.7 12.1 2 10.2 2c-4.4 0-8 3.6-8 8s3.6 8 8 8c4.6 0 7.7-3.2 7.7-7.8-.1-.6-.1-1.1-.3-1.7z" fillrule="evenodd" cliprule="evenodd" /></svg>';

	/**
	 * Returns a base64 encoded version of the SVG.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Base64 representation of SVG
	 */
	public static function to_base64() {
		return base64_encode( self::XML );
	}
}
