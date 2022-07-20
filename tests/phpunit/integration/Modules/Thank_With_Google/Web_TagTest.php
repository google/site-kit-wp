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

	public function set_up() {
		parent::set_up();

		$this->web_tag = new Web_Tag( '12345', Thank_With_Google::MODULE_SLUG );

		$this->web_tag->set_publication_id( '12345' );
		$this->web_tag->set_button_post_types( array( 'post' ) );
	}

	public function test_content_placeholder_not_inserted_on_unselected_button_post_types() {
		remove_all_filters( 'the_content' );

		$this->web_tag->set_button_placement( 'static_auto' );
		$this->web_tag->register();

		$post_ID = $this->factory()->post->create(
			array(
				'post_type'    => 'page',
				'post_content' => '<p>Hello World</p><p>Goodbye World</p>',
			)
		);
		$this->go_to( get_permalink( $post_ID ) );

		$output = get_echo( 'the_content' );

		$this->assertStringNotContainsString( 'Thank with Google snippet added by Site Kit', $output );
		$this->assertStringNotContainsString( '<button twg-button', $output );
	}

	public function test_content_placeholder_inserted_on_button_post_types() {
		remove_all_filters( 'the_content' );

		$this->web_tag->set_button_placement( 'static_auto' );
		$this->web_tag->register();

		$this->create_post_and_go_to_it();

		$output = get_echo( 'the_content' );

		$this->assertStringContainsString( 'Thank with Google snippet added by Site Kit', $output );
		$this->assertStringContainsString( '<button twg-button', $output );
	}

	public function test_content_placeholder_not_inserted_on_dynamic_button_placement() {
		remove_all_filters( 'the_content' );

		$this->web_tag->set_button_placement( 'dynamic_low' );
		$this->web_tag->register();

		$this->create_post_and_go_to_it();

		$output = get_echo( 'the_content' );

		$this->assertStringNotContainsString( 'Thank with Google snippet added by Site Kit', $output );
		$this->assertStringNotContainsString( '<button twg-button', $output );
	}

	public function test_content_placeholder_inserted_static_below_content() {
		remove_all_filters( 'the_content' );

		$this->web_tag->set_button_placement( 'static_below-content' );
		$this->web_tag->register();

		$this->create_post_and_go_to_it();

		$output  = get_echo( 'the_content' );
		$content = get_the_content();

		$this->assertStringStartsWith( $content, $output );
		$this->assertStringContainsString( 'Thank with Google snippet added by Site Kit', $output );
		$this->assertStringContainsString( '<button twg-button', $output );
	}

	public function test_content_placeholder_inserted_static_above_content() {
		remove_all_filters( 'the_content' );

		$this->web_tag->set_button_placement( 'static_above-content' );
		$this->web_tag->register();

		$this->create_post_and_go_to_it();

		$output  = get_echo( 'the_content' );
		$content = get_the_content();

		$this->assertStringEndsWith( $content, $output );
		$this->assertStringContainsString( 'Thank with Google snippet added by Site Kit', $output );
		$this->assertStringContainsString( '<button twg-button', $output );
	}

	public function test_content_placeholder_inserted_static_below_first_paragraph() {
		remove_all_filters( 'the_content' );

		$this->web_tag->set_button_placement( 'static_below-first-paragraph' );
		$this->web_tag->register();

		$this->create_post_and_go_to_it();

		$output = get_echo( 'the_content' );

		$this->assertStringStartsWith( '<p>Hello World</p>', $output );
		$this->assertStringEndsWith( '<p>Goodbye World</p>', $output );
		$this->assertStringContainsString( 'Thank with Google snippet added by Site Kit', $output );
		$this->assertStringContainsString( '<button twg-button', $output );
	}

	private function create_post_and_go_to_it() {
		$post_ID = $this->factory()->post->create(
			array(
				'post_content' => '<p>Hello World</p><p>Goodbye World</p>',
				'post_status'  => 'publish',
			)
		);
		$this->go_to( get_permalink( $post_ID ) );
	}
}
