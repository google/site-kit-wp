<?php
/**
 * PointersTest
 *
 * @package   Google\Site_Kit\Tests\Core\Admin
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760


namespace Google\Site_Kit\Tests\Core\Admin;

use Google\Site_Kit\Core\Admin\Pointer;
use Google\Site_Kit\Core\Admin\Pointers;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Admin
 * @group Pointer
 */
class PointersTest extends TestCase {

	const TEST_HOOK_SUFFIX = 'test-hook-suffix';

	/**
	 * Pointers instance.
	 *
	 * @var Pointers
	 */
	private $pointers;

	public function set_up() {
		parent::set_up();

		remove_all_actions( 'admin_enqueue_scripts' );
		remove_all_actions( 'admin_print_footer_scripts' );

		// Register the core WordPress script/style that the Pointers class depends on.
		wp_register_script( 'wp-pointer', '', array(), GOOGLESITEKIT_VERSION, true );
		wp_register_style( 'wp-pointer', '', array(), GOOGLESITEKIT_VERSION, true );

		$this->pointers = new Pointers();
		$this->pointers->register();
	}

	public function test_register() {
		$this->assertTrue( has_action( 'admin_enqueue_scripts' ), 'Pointers should register the admin_enqueue_scripts action.' );
	}

	public function test_enqueue_pointers__no_hook_suffix() {
		do_action( 'admin_enqueue_scripts' );

		$this->assertFalse( wp_script_is( 'wp-pointer' ), 'wp-pointer script should not be enqueued when no hook suffix.' );
		$this->assertFalse( wp_style_is( 'wp-pointer' ), 'wp-pointer style should not be enqueued when no hook suffix.' );
		$this->assertFalse( has_action( 'admin_print_footer_scripts' ), 'No admin_print_footer_scripts action should be present when no hook suffix.' );
	}

	public function test_enqueue_pointers__no_pointers() {
		do_action( 'admin_enqueue_scripts', self::TEST_HOOK_SUFFIX );

		$this->assertFalse( wp_script_is( 'wp-pointer' ), 'wp-pointer script should not be enqueued when no pointers.' );
		$this->assertFalse( wp_style_is( 'wp-pointer' ), 'wp-pointer style should not be enqueued when no pointers.' );
		$this->assertFalse( has_action( 'admin_print_footer_scripts' ), 'No admin_print_footer_scripts action should be present when no pointers.' );
	}

	public function test_enqueue_pointers__no_active_pointers() {
		add_filter(
			'googlesitekit_admin_pointers',
			function ( $pointers ) {
				$pointers[] = new Pointer(
					'test-slug',
					array(
						'title'           => 'Test pointer title',
						'content'         => 'Test pointer content.',
						'target_id'       => 'test-target',
						'active_callback' => '__return_false',
					)
				);
				return $pointers;
			}
		);

		do_action( 'admin_enqueue_scripts', self::TEST_HOOK_SUFFIX );

		$this->assertFalse( wp_script_is( 'wp-pointer' ), 'wp-pointer script should not be enqueued when no active pointers.' );
		$this->assertFalse( wp_style_is( 'wp-pointer' ), 'wp-pointer style should not be enqueued when no active pointers.' );
		$this->assertFalse( has_action( 'admin_print_footer_scripts' ), 'No admin_print_footer_scripts action should be present when no active pointers.' );
	}

	public function test_enqueue_pointers() {
		add_filter(
			'googlesitekit_admin_pointers',
			function ( $pointers ) {
				$pointers[] = new Pointer(
					'test-slug',
					array(
						'title'           => 'Test pointer title',
						'content'         => 'Test pointer content.',
						'target_id'       => 'test-target',
						'active_callback' => '__return_true',
					)
				);
				return $pointers;
			}
		);

		do_action( 'admin_enqueue_scripts', self::TEST_HOOK_SUFFIX );

		$this->assertTrue( wp_script_is( 'wp-pointer' ), 'wp-pointer script should be enqueued when there are active pointers.' );
		$this->assertTrue( wp_style_is( 'wp-pointer' ), 'wp-pointer style should be enqueued when there are active pointers.' );
		$this->assertTrue( has_action( 'admin_print_footer_scripts' ), 'admin_print_footer_scripts action should be present when there are active pointers.' );

		$output = $this->capture_action( 'admin_print_footer_scripts' );

		$this->assertStringContainsString( 'test-slug', $output, 'Pointer output should contain the slug.' );
		$this->assertStringContainsString( 'Test pointer title', $output, 'Pointer output should contain the title.' );
		$this->assertStringContainsString( 'Test pointer content.', $output, 'Pointer output should contain the content.' );
		$this->assertStringContainsString( 'test-target', $output, 'Pointer output should contain the target ID.' );
	}

	public function test_print_pointer_script_with_buttons_and_class() {
		add_filter(
			'googlesitekit_admin_pointers',
			function ( $pointers ) {
				$pointers[] = new Pointer(
					'test-slug-with-buttons',
					array(
						// Title contains button/span markup which should be preserved by wp_kses.
						'title'             => "Title <button class='googlesitekit-pointer-cta--dismiss dashicons dashicons-no'><span class='screen-reader-text'>Dismiss</span></button>",
						'content'           => 'Test pointer content with buttons.',
						'target_id'         => 'test-target-buttons',
						'active_callback'   => '__return_true',
						'with_dismiss_icon' => true,
						'class'             => 'custom-class',
						'buttons'           => '<a class=\"googlesitekit-pointer-cta button-primary\" href="#">Set up</a>',
					)
				);
				return $pointers;
			}
		);

		do_action( 'admin_enqueue_scripts', self::TEST_HOOK_SUFFIX );

		$output = $this->capture_action( 'admin_print_footer_scripts' );

		// Buttons function should be present in the options object.
		$this->assertStringContainsString( 'buttons:', $output, 'Pointer output should include buttons property.' );
		$this->assertStringContainsString( 'googlesitekit-pointer-cta button-primary', $output, 'Pointer output should include CTA button class.' );

		// pointerClass should include wp-pointer, computed icon class, and custom class.
		$this->assertStringContainsString( 'pointerClass:', $output, 'Pointer output should include pointerClass property.' );
		$this->assertStringContainsString( 'wp-pointer', $output, 'Pointer class should include default wp-pointer.' );
		$this->assertStringContainsString( 'custom-class', $output, 'Pointer class should include custom class when provided.' );

		// Title markup should be preserved (sanitized) allowing button/span with class.
		$this->assertStringContainsString( 'googlesitekit-pointer-cta--dismiss', $output, 'Pointer title markup should include dismiss button class.' );
	}

	public function test_print_pointer_script() {
		add_filter(
			'googlesitekit_admin_pointers',
			function ( $pointers ) {
				$pointers[] = new Pointer(
					'test-slug',
					array(
						'title'           => 'Test pointer title',
						'content'         => 'Test pointer content.',
						'target_id'       => 'test-target',
						'active_callback' => '__return_true',
					)
				);
				return $pointers;
			}
		);

		do_action( 'admin_enqueue_scripts', self::TEST_HOOK_SUFFIX );

		$output = $this->capture_action( 'admin_print_footer_scripts' );

		$this->assertStringContainsString( 'test-slug', $output, 'Pointer output should contain the slug.' );
		$this->assertStringContainsString( 'Test pointer title', $output, 'Pointer output should contain the title.' );
		$this->assertStringContainsString( 'Test pointer content.', $output, 'Pointer output should contain the content.' );
		$this->assertStringContainsString( 'test-target', $output, 'Pointer output should contain the target ID.' );
	}
}
