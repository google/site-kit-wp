<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Subscribe_With_Google_BlockTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Post_Meta;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Subscribe_With_Google_Block;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Post_Product_ID;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Tag_Guard;
use Google\Site_Kit\Tests\TestCase;

class Subscribe_With_Google_BlockTest extends TestCase {

	/**
	 * @var Settings
	 */
	private $settings;

	/**
	 * @var Subscribe_With_Google_Block
	 */
	private $block;

	public function set_up() {
		parent::set_up();

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$this->settings = new Settings( $options );

		$post_meta       = new Post_Meta();
		$post_product_id = new Post_Product_ID( $post_meta, $this->settings );
		$tag_guard       = new Tag_Guard( $this->settings, $post_product_id );

		$this->block = new Subscribe_With_Google_Block( $context, $tag_guard, $this->settings );
	}

	public function test_cannot_register_in_wordpress_version_below_5_8() {
		if ( version_compare( get_bloginfo( 'version' ), '5.8', '<' ) === false ) {
			$this->markTestSkipped( 'This test only runs on WordPress 5.8 and below.' );
		}

		$this->block->register();

		$this->assertFalse( has_action( 'init' ) );
	}

	public function test_can_register_in_wordpress_version_5_8_and_above() {
		if ( version_compare( get_bloginfo( 'version' ), '5.8', '>=' ) === false ) {
			$this->markTestSkipped( 'This test only runs on WordPress 5.8 and above.' );
		}

		$this->block->register();

		$this->assertTrue( has_action( 'init' ) );
	}

	public function test_render_callback_with_incorrect_payment_option() {
		$this->settings->set(
			array(
				'paymentOption' => 'contributions',
				'publicationID' => 'test-publication-id',
			)
		);

		$output = $this->block->render_callback();

		$this->assertEquals( '', $output );
	}

	public function test_render_callback_with_tag_guard_preventing_activation() {
		$this->settings->set(
			array(
				'paymentOption' => 'subscriptions',
				'publicationID' => '',
			)
		);

		$output = $this->block->render_callback();

		$this->assertEquals( '', $output );
	}

	public function test_render_callback_with_tag_guard_allowing_activation() {
		$this->settings->set(
			array(
				'paymentOption' => 'subscriptions',
				'publicationID' => 'test-publication-id',
			)
		);

		$output = $this->block->render_callback();

		$this->assertStringContainsString( '<button swg-standard-button="subscription">', $output );
		$this->assertStringContainsString( '<div style="margin: 0 auto;">', $output );
	}
}
