<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Thank_With_Google\Web_TagTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Thank_With_Google
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Thank_With_Google;

use Google\Site_Kit\Modules\Thank_With_Google;
use Google\Site_Kit\Modules\Thank_With_Google\Web_Tag;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Thank_With_Google
 */
class Web_TagTest extends TestCase {
	/**
	 * Web_Tag instance.
	 *
	 * @var Web_Tag
	 */
	private $web_tag;

	private $dummy_content = '<p>Hello World</p><p>Goodbye World</p>';

	public function set_up() {
		parent::set_up();

		$this->web_tag = new Web_Tag( '12345', Thank_With_Google::MODULE_SLUG );
		$this->web_tag->set_cta_post_types( array( 'post' ) );

		remove_all_filters( 'the_content' );
		$this->web_tag->register();
	}

	public function test_content_placeholder_not_inserted_on_unselected_cta_post_types() {
		$this->web_tag->set_cta_placement( Web_Tag::PLACEMENT_STATIC_AUTO );

		$post_ID = $this->factory()->post->create( array( 'post_type' => 'page' ) );
		$this->go_to( get_permalink( $post_ID ) );

		$output = apply_filters( 'the_content', $this->dummy_content );

		$this->assertStringNotContainsString( 'Thank with Google snippet added by Site Kit', $output );
		$this->assertStringNotContainsString( '<button twg-button', $output );
		$this->assertStringNotContainsString( '<div counter-button', $output );
	}

	public function test_content_placeholder_inserted_on_cta_post_types() {
		$this->web_tag->set_cta_placement( Web_Tag::PLACEMENT_STATIC_AUTO );

		$this->create_post_and_go_to_it();

		$output = apply_filters( 'the_content', $this->dummy_content );

		$this->assertStringContainsString( 'Thank with Google snippet added by Site Kit', $output );
		$this->assertStringContainsString( '<button twg-button', $output );
		$this->assertStringContainsString( '<div counter-button', $output );
	}

	public function test_content_cta_placeholder_not_inserted_on_dynamic_cta_placement() {
		$this->web_tag->set_cta_placement( Web_Tag::PLACEMENT_DYNAMIC_LOW );

		$this->create_post_and_go_to_it();

		$output = apply_filters( 'the_content', $this->dummy_content );

		$this->assertStringNotContainsString( '<button twg-button', $output );
	}

	public function test_content_counter_placeholder_inserted_on_dynamic_cta_placement() {
		$this->web_tag->set_cta_placement( Web_Tag::PLACEMENT_DYNAMIC_LOW );

		$this->create_post_and_go_to_it();

		$output = apply_filters( 'the_content', $this->dummy_content );

		$this->assertStringEndsWith(
			'<div counter-button style="height: 34px; visibility: hidden; box-sizing: content-box; padding: 12px 0; display: inline-block; overflow: hidden;"></div></div>'
			. PHP_EOL
			. '<!-- End Thank with Google snippet added by Site Kit -->'
			. PHP_EOL,
			$output
		);
	}

	public function test_content_cta_placeholder_inserted_static_below_content() {
		$this->web_tag->set_cta_placement( Web_Tag::PLACEMENT_STATIC_BELOW_CONTENT );

		$this->create_post_and_go_to_it();

		$output = apply_filters( 'the_content', $this->dummy_content );

		$this->assertStringStartsWith( $this->dummy_content, $output );
		$this->assertStringContainsString( 'Thank with Google snippet added by Site Kit', $output );
		$this->assertStringContainsString( '<button twg-button', $output );
	}

	public function test_content_counter_placeholder_not_inserted_static_below_content() {
		$this->web_tag->set_cta_placement( Web_Tag::PLACEMENT_STATIC_BELOW_CONTENT );

		$this->create_post_and_go_to_it();

		$output = apply_filters( 'the_content', $this->dummy_content );

		$this->assertStringStartsWith( $this->dummy_content, $output );
		$this->assertStringContainsString( 'Thank with Google snippet added by Site Kit', $output );
		$this->assertStringNotContainsString( '<div counter-button', $output ); }

	public function test_content_placeholder_inserted_static_above_content() {
		$this->web_tag->set_cta_placement( Web_Tag::PLACEMENT_STATIC_ABOVE_CONTENT );

		$this->create_post_and_go_to_it();

		$output = apply_filters( 'the_content', $this->dummy_content );

		$this->assertStringStartsNotWith(
			'<!-- Thank with Google snippet added by Site Kit -->'
			. PHP_EOL
			. '<div class="googlesitekit-twg-wrapper"><button twg-button',
			$output
		);
		$this->assertStringEndsWith(
			'<div counter-button style="height: 34px; visibility: hidden; box-sizing: content-box; padding: 12px 0; display: inline-block; overflow: hidden;"></div></div>'
			. PHP_EOL
			. '<!-- End Thank with Google snippet added by Site Kit -->'
			. PHP_EOL,
			$output
		);
	}

	public function test_content_placeholder_inserted_static_below_first_paragraph() {
		$this->web_tag->set_cta_placement( Web_Tag::PLACEMENT_STATIC_BELOW_FIRST_P );

		$this->create_post_and_go_to_it();

		$output = apply_filters( 'the_content', $this->dummy_content );

		$this->assertStringStartsWith(
			'<p>Hello World</p>'
			. PHP_EOL
			. '<!-- Thank with Google snippet added by Site Kit -->'
			. PHP_EOL
			. '<div class="googlesitekit-twg-wrapper"><button twg-button',
			$output
		);
		$this->assertStringContainsString( '<p>Goodbye World</p>', $output );
		$this->assertStringEndsWith(
			'<div counter-button style="height: 34px; visibility: hidden; box-sizing: content-box; padding: 12px 0; display: inline-block; overflow: hidden;"></div></div>'
			. PHP_EOL
			. '<!-- End Thank with Google snippet added by Site Kit -->'
			. PHP_EOL,
			$output
		);
	}

	private function create_post_and_go_to_it() {
		$post_ID = $this->factory()->post->create();
		$this->go_to( get_permalink( $post_ID ) );
	}
}
