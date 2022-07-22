<?php
/**
 * Thank_With_GoogleTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Thank_With_Google;
use Google\Site_Kit\Modules\Thank_With_Google\Settings;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class Thank_With_GoogleTest extends TestCase {

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * Thank_With_Google instance.
	 *
	 * @var Thank_With_Google
	 */
	private $thank_with_google;

	public function set_up() {
		parent::set_up();

		$this->context           = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options           = new Options( $this->context );
		$this->thank_with_google = new Thank_With_Google( $this->context, $this->options );

		$this->options->set(
			Settings::OPTION,
			array(
				'publicationID'   => '12345',
				'colorTheme'      => 'blue',
				'buttonPlacement' => 'static_auto',
				'buttonPostTypes' => array( 'post' ),
			)
		);
	}

	public function test_web_tag_hooks_are_added_when_tag_is_registered() {
		remove_all_actions( 'template_redirect' );

		$this->thank_with_google->register();

		remove_all_actions( 'wp_enqueue_scripts' );
		remove_all_filters( 'the_content' );

		do_action( 'template_redirect' );
		$this->assertTrue( has_action( 'wp_enqueue_scripts' ) );
		$this->assertTrue( has_filter( 'the_content' ) );
	}

	public function test_web_tag_hooks_are_not_added_when_tag_is_blocked() {
		remove_all_actions( 'template_redirect' );

		$this->thank_with_google->register();

		remove_all_actions( 'wp_enqueue_scripts' );
		remove_all_filters( 'the_content' );

		add_filter( 'googlesitekit_' . Thank_With_Google::MODULE_SLUG . '_tag_blocked', '__return_true' );

		do_action( 'template_redirect' );

		$this->assertFalse( has_action( 'wp_enqueue_scripts' ) );
		$this->assertFalse( has_filter( 'the_content' ) );
	}

	public function test_web_tag_snippet_is_not_enqueued_for_non_singular_pages() {
		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_enqueue_scripts' );

		$this->thank_with_google->register();

		// Hook `wp_print_footer_scripts` on placeholder action for capturing.
		add_action( '__test_print_scripts', 'wp_print_footer_scripts' );

		do_action( 'template_redirect' );
		do_action( 'wp_enqueue_scripts' );

		$output = $this->capture_action( '__test_print_scripts' );

		$this->assertEmpty( $output );
	}

	public function test_web_tag_is_enqueued_for_singular_pages() {
		$post_ID = $this->factory()->post->create();
		$this->go_to( get_permalink( $post_ID ) );

		remove_all_actions( 'template_redirect' );
		remove_all_actions( 'wp_enqueue_scripts' );

		$this->thank_with_google->register();

		// Hook `wp_print_footer_scripts` on placeholder action for capturing.
		add_action( '__test_print_scripts', 'wp_print_footer_scripts' );

		do_action( 'template_redirect' );
		do_action( 'wp_enqueue_scripts' );

		$output = $this->capture_action( '__test_print_scripts' );

		$this->assertStringContainsString( 'Thank with Google snippet added by Site Kit', $output );
		$this->assertStringContainsString( 'buttonPosition: \'inline\',', $output );
		$this->assertStringContainsString( 'isPartOfProductId: \'12345:default\',', $output );
	}

	public function test_is_connected() {
		$this->options->delete( Settings::OPTION );

		$this->assertFalse( $this->thank_with_google->is_connected() );

		$this->options->set(
			Settings::OPTION,
			array(
				'publicationID'   => '12345',
				'colorTheme'      => 'blue',
				'buttonPlacement' => 'static_auto',
				'buttonPostTypes' => array( 'post' ),
			)
		);

		$this->assertTrue( $this->thank_with_google->is_connected() );
	}

	public function test_on_deactivation() {
		$this->assertOptionExists( Settings::OPTION );

		$this->thank_with_google->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
	}
}
