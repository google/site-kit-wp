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
 * Class for the Google SVG Icon.
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
	const XML = '<svg width="20" height="20" viewBox="-2.5 -2.5 25 25" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="M19.61 8.18H10.2V12.04H15.57C15.34 13.29 14.64 14.36 13.58 15.07C12.69 15.67 11.54 16.02 10.2 16.02C7.6 16.02 5.4 14.27 4.61 11.9C4.41 11.3 4.3 10.66 4.3 10C4.3 9.34 4.41 8.7 4.61 8.1C5.4 5.73 7.6 3.98 10.2 3.98C11.67 3.98 12.98 4.48 14.02 5.47L16.88 2.61C15.15 0.99 12.89 0 10.2 0C6.3 0 2.92 2.24 1.28 5.51C0.6 6.86 0.21 8.38 0.21 10C0.21 11.62 0.6 13.14 1.28 14.49C2.92 17.76 6.3 20 10.2 20C12.89 20 15.16 19.11 16.82 17.59C18.7 15.85 19.79 13.27 19.79 10.23C19.79 9.52 19.73 8.84 19.61 8.18V8.18Z"></path></svg>';

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
