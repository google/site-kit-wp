<?php
/**
 * Google_IconTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Google_Icon;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Google_IconTest extends TestCase {

	const EXPECTED_XML = '<svg width="20" height="20" viewBox="-2.5 -2.5 25 25" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="M19.61 8.18H10.2V12.04H15.57C15.34 13.29 14.64 14.36 13.58 15.07C12.69 15.67 11.54 16.02 10.2 16.02C7.6 16.02 5.4 14.27 4.61 11.9C4.41 11.3 4.3 10.66 4.3 10C4.3 9.34 4.41 8.7 4.61 8.1C5.4 5.73 7.6 3.98 10.2 3.98C11.67 3.98 12.98 4.48 14.02 5.47L16.88 2.61C15.15 0.99 12.89 0 10.2 0C6.3 0 2.92 2.24 1.28 5.51C0.6 6.86 0.21 8.38 0.21 10C0.21 11.62 0.6 13.14 1.28 14.49C2.92 17.76 6.3 20 10.2 20C12.89 20 15.16 19.11 16.82 17.59C18.7 15.85 19.79 13.27 19.79 10.23C19.79 9.52 19.73 8.84 19.61 8.18V8.18Z"></path></svg>';

	public function test_xml__holds_the_google_g_markup() {
		$this->assertSame( self::EXPECTED_XML, Google_Icon::XML, 'Google_Icon::XML should hold the Google "G" markup the administrator menu draws.' );
	}

	public function test_with_fill__replaces_the_white_placeholder_with_the_color_it_receives() {
		$filled = Google_Icon::with_fill( '#a7aaad' );

		$this->assertStringContainsString( 'fill="#a7aaad"', $filled, 'with_fill() should write the color it receives into the fill attribute.' );
		$this->assertStringNotContainsString( 'fill="white"', $filled, 'with_fill() should leave no white placeholder behind.' );
	}

	public function test_with_fill__escapes_the_color_it_receives() {
		$filled = Google_Icon::with_fill( '"><script>alert(1)</script>' );

		$this->assertStringNotContainsString( '<script>', $filled, 'with_fill() should escape a color that would close the attribute.' );
	}

	public function test_to_base64__defaults_to_the_icon_markup() {
		$this->assertSame( self::EXPECTED_XML, base64_decode( Google_Icon::to_base64() ), 'to_base64() should encode Google_Icon::XML when it receives no source.' );
	}

	public function test_to_base64__encodes_the_source_it_receives() {
		$this->assertSame( 'PHN2ZyAvPg==', Google_Icon::to_base64( '<svg />' ), 'to_base64() should return the base64 of the source it receives, not of Google_Icon::XML.' );
	}
}
