<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Web_TagTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Web_Tag;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 */
class Web_TagTest extends TestCase {
	const PUBLICATION_ID = '12345';

	public function test_register() {
		$web_tag = new Web_Tag( self::PUBLICATION_ID, Reader_Revenue_Manager::MODULE_SLUG );
		$web_tag->register();

		do_action( 'wp_enqueue_scripts' );

		$footer_html = $this->capture_action( 'wp_footer' );

		$this->assertStringContainsString( 'Google Reader Revenue Manager snippet added by Site Kit', $footer_html );
		$this->assertStringContainsString( 'script type="text/javascript" src="https://news.google.com/swg/js/v1/swg-basic.js" id="google_swgjs-js"></script>', $footer_html );
		$this->assertStringContainsString( '(self.SWG_BASIC=self.SWG_BASIC||[]).push(basicSubscriptions=>{basicSubscriptions.init({"type":"NewsArticle","isPartOfType":["Product"],"isPartOfProductId":"' . self::PUBLICATION_ID . ':openaccess","clientOptions":{"theme":"light","lang":"en-US"}});});', $footer_html );
	}
}
