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

	const XML = '<svg width="147" height="150" viewBox="0 0 147 150" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30.5611 74.7909C30.5611 70.0315 31.2403 65.272 32.9381 60.8526L7.81006 41.4749C2.71654 51.6736 0 62.8923 0 74.7909C0 86.6895 2.71654 97.9082 7.81006 107.767L32.9381 88.3893C31.2403 84.3098 30.5611 79.5503 30.5611 74.7909Z" fill="white"/><path d="M74.7029 30.5964C85.2295 30.5964 94.7374 34.3359 102.208 40.4552L123.94 18.6978C110.697 7.13915 93.7187 0 74.7029 0C45.1605 0 19.6928 16.998 7.80796 41.815L32.936 61.1928C38.7087 43.1749 55.0079 30.5964 74.7029 30.5964Z" fill="white"/><path d="M74.7029 118.986C55.0079 118.986 38.7087 106.408 32.936 88.7297L7.80796 108.107C19.6928 132.585 45.1605 149.583 74.7029 149.583C93.0395 149.583 110.358 143.123 123.261 130.885L99.4913 112.527C92.7 116.606 84.2108 118.986 74.7029 118.986Z" fill="white"/><path d="M32.936 88.7297L7.80796 108.107L32.936 88.7297Z" fill="#34A853"/><path d="M74.7036 61.1929V90.0894H114.773C112.735 99.9483 107.302 107.427 99.492 112.527L123.262 130.885C136.844 117.966 146.013 99.2684 146.013 74.7913C146.013 70.3718 145.334 65.6123 144.315 61.1929H74.7036Z" fill="white"/></svg>';

	/**
	 * Returns a base64 encoded version of the SVG.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $source SVG icon source.
	 *
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
	public static function replace_fill( $color ) {
		return str_replace( 'white', esc_attr( $color ), self::XML );
	}
}

