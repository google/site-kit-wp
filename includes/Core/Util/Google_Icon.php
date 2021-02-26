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
	const XML = '<svg viewbox="0 0 30 30" width="48" height="48" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="M 47.082803,19.872611 H 24.152866 v 9.171975 h 13.45223 C 36.382166,35.464968 30.573248,39.745223 24.152866,39.43949 16.203821,39.133757 10.089172,33.019108 9.78344,25.070064 9.477707,16.815287 15.898089,9.78344 24.152866,9.477707 c 3.363057,0 6.726115,1.22293 9.477707,3.66879 L 40.66242,6.4203821 C 36.382166,2.1401274 30.267516,0 24.458599,0 11.00637,0 0,11.00637 0,24.458599 0,37.910828 11.00637,48.917197 24.458599,48.917197 38.522293,48.917197 48,39.133757 48,25.070064 47.694267,23.235669 47.694267,21.707006 47.082803,19.872611 Z" /></svg>';

	/**
	 * Returns a base64 encoded version of the SVG.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $source SVG icon source.
	 * @return string Base64 representation of SVG
	 */
	public static function to_base64( $source = false ) {
		$svg = $source ? $source : self::XML;
		return base64_encode( $svg );
	}

	/**
	 * Returns SVG XML with fill color replaced.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $color Any valid color for css, either word or hex code.
	 *
	 * @return string SVG XML with the fill color replaced
	 */
	public static function with_fill( $color ) {
		return str_replace( 'white', esc_attr( $color ), self::XML );
	}
}
