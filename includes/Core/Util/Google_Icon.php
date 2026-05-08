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
 * @since 1.28.0
 * @access private
 * @ignore
 */
final class Google_Icon {

	/**
	 * We use fill="white" as a placeholder attribute that we replace in with_fill()
	 * to match the colorscheme that the user has set.
	 *
	 * See the comment in includes/Core/Admin/Screen.php::add() for more information.
	 */
	const XML = '<svg width="20" height="20" viewbox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="M17.6 8.5h-7.5v3h4.4c-.4 2.1-2.3 3.5-4.4 3.4-2.6-.1-4.6-2.1-4.7-4.7-.1-2.7 2-5 4.7-5.1 1.1 0 2.2.4 3.1 1.2l2.3-2.2C14.1 2.7 12.1 2 10.2 2c-4.4 0-8 3.6-8 8s3.6 8 8 8c4.6 0 7.7-3.2 7.7-7.8-.1-.6-.1-1.1-.3-1.7z" fillrule="evenodd" cliprule="evenodd"></path></svg>';

	/**
	 * Returns a base64 encoded version of the SVG.
	 *
	 * @since 1.28.0
	 *
	 * @param string $source SVG icon source.
	 * @return string Base64 representation of SVG
	 */
	public static function to_base64( $source = self::XML ) {
		return base64_encode( $source );
	}

	/**
	 * Returns SVG XML with fill color replaced.
	 *
	 * @since 1.28.0
	 *
	 * @param string $color Any valid color for css, either word or hex code.
	 * @return string SVG XML with the fill color replaced
	 */
	public static function with_fill( $color ) {
		return str_replace( 'white', esc_attr( $color ), self::XML );
	}
}
