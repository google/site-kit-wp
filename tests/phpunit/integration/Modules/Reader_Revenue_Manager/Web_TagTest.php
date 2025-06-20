<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Web_TagTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760

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

	const EXPECTED_SNIPPET_STRINGS = array(
		'Google Reader Revenue Manager snippet added by Site Kit',
		'https://news.google.com/swg/js/v1/swg-basic.js',
		'(self.SWG_BASIC=self.SWG_BASIC||[]).push(basicSubscriptions=>{basicSubscriptions.init({"type":"NewsArticle","isPartOfType":["Product"],"isPartOfProductId":"' . self::PUBLICATION_ID . ':openaccess","clientOptions":{"theme":"light","lang":"en-US"}});});',
	);

	public function set_up() {
		parent::set_up();

		$web_tag = new Web_Tag(
			self::PUBLICATION_ID,
			Reader_Revenue_Manager::MODULE_SLUG
		);
		$web_tag->register();
		$web_tag->set_product_id( 'openaccess' );
	}

	public function test_snippet_inserted() {
		do_action( 'wp_enqueue_scripts' );

		$footer_html = $this->capture_action( 'wp_footer' );

		foreach ( self::EXPECTED_SNIPPET_STRINGS as $snippet_string ) {
			$this->assertStringContainsString( $snippet_string, $footer_html );
		}
	}
}
