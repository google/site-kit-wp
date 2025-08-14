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

		// Register the core WordPress script that the Pointers class depends on.
		wp_register_script( 'wp-pointer', '', array(), GOOGLESITEKIT_VERSION, true );

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
		$this->assertStringContainsString( '#test-target', $output, 'Pointer output should contain the target selector.' );
	}

	public function test_print_pointer_scripy() {
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
		$this->assertStringContainsString( '#test-target', $output, 'Pointer output should contain the target selector.' );
	}
}
