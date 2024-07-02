<?php
/**
 * PointersTest
 *
 * @package   Google\Site_Kit\Tests\Core\Admin
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

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
		$this->pointers = new Pointers();
		$this->pointers->register();
	}

	public function test_register() {
		$this->assertTrue( has_action( 'admin_enqueue_scripts' ) );
	}

	public function test_enqueue_pointers__no_hook_suffix() {
		do_action( 'admin_enqueue_scripts' );

		$this->assertFalse( wp_script_is( 'wp-pointer' ) );
		$this->assertFalse( wp_style_is( 'wp-pointer' ) );
		$this->assertFalse( has_action( 'admin_print_footer_scripts' ) );
	}

	public function test_enqueue_pointers__no_pointers() {
		do_action( 'admin_enqueue_scripts', self::TEST_HOOK_SUFFIX );

		$this->assertFalse( wp_script_is( 'wp-pointer' ) );
		$this->assertFalse( wp_style_is( 'wp-pointer' ) );
		$this->assertFalse( has_action( 'admin_print_footer_scripts' ) );
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

		$this->assertFalse( wp_script_is( 'wp-pointer' ) );
		$this->assertFalse( wp_style_is( 'wp-pointer' ) );
		$this->assertFalse( has_action( 'admin_print_footer_scripts' ) );
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

		$this->assertTrue( wp_script_is( 'wp-pointer' ) );
		$this->assertTrue( wp_style_is( 'wp-pointer' ) );
		$this->assertTrue( has_action( 'admin_print_footer_scripts' ) );

		$output = $this->capture_action( 'admin_print_footer_scripts' );

		$this->assertStringContainsString( 'test-slug', $output );
		$this->assertStringContainsString( 'Test pointer title', $output );
		$this->assertStringContainsString( 'Test pointer content.', $output );
		$this->assertStringContainsString( '#test-target', $output );
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

		$this->assertStringContainsString( 'test-slug', $output );
		$this->assertStringContainsString( 'Test pointer title', $output );
		$this->assertStringContainsString( 'Test pointer content.', $output );
		$this->assertStringContainsString( '#test-target', $output );
	}
}
