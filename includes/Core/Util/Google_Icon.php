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
	const XML = '<svg viewbox="0 0 30 30" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="m 20.617835,9.125 h -9.554141 v 3.75 H 16.66879 C 16.159236,15.5 13.738853,17.25 11.063694,17.125 7.7515921,17 5.2038217,14.5 5.0764333,11.25 4.9490446,7.8750002 7.6242038,5.0000002 11.063694,4.875 c 1.401274,0 2.802548,0.5000001 3.949045,1.5000001 L 17.942675,3.625 C 16.159236,1.875 13.611465,1 11.191083,1 5.5859875,1 1,5.5000003 1,11 1,16.5 5.5859875,21 11.191083,21 17.050955,21 21,17 21,11.25 20.872611,10.5 20.872611,9.875 20.617835,9.125 Z" /></svg>';

	/**
	 * Returns a base64 encoded version of the SVG.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @param string $color Any valid color for css, either word or hex code.
	 * @return string SVG XML with the fill color replaced
	 */
	public static function with_fill( $color ) {
		return str_replace( 'white', esc_attr( $color ), self::XML );
	}
}
