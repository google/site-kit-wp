<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Ads\Web_TagTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Ads
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Ads;

use Google\Site_Kit\Modules\Ads;
use Google\Site_Kit\Modules\Ads\Web_Tag;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Ads
 */
class Web_TagTest extends TestCase {
	const ADS_CONVERSION_ID = 'AW-123456789';

	public function test_register() {
		remove_all_actions( 'googlesitekit_setup_gtag' );
		do_action( 'wp_enqueue_scripts' );

		$web_tag = new Web_Tag( self::ADS_CONVERSION_ID, Ads::MODULE_SLUG );
		$web_tag->register();

		$this->assertTrue( has_action( 'googlesitekit_setup_gtag' ) );

		$head_html = $this->capture_action( 'wp_head' );
		$this->assertNotEmpty( $head_html );

		$this->assertStringContainsString(
			'gtag("config", "' . self::ADS_CONVERSION_ID . '")',
			$head_html
		);
	}

}
