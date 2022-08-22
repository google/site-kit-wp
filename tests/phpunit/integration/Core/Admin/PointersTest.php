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

	public function test_register() {
		remove_all_actions( 'admin_enqueue_scripts' );
		$pointers = new Pointers();
		$pointers->register();

		$this->assertTrue( has_action( 'admin_enqueue_scripts' ) );
	}

	public function test_enqueue_pointers__no_hook_suffix() {
		remove_all_actions( 'admin_enqueue_scripts' );
		$pointers = new Pointers();
		$pointers->register();

		do_action( 'admin_enqueue_scripts' );

		$this->assertFalse( wp_script_is( 'wp-pointer' ) );
		$this->assertFalse( wp_style_is( 'wp-pointer' ) );
	}

	public function test_enqueue_pointers__no_pointers() {
		remove_all_actions( 'admin_enqueue_scripts' );
		$pointers = new Pointers();
		$pointers->register();

		do_action( 'admin_enqueue_scripts', self::TEST_HOOK_SUFFIX );

		$this->assertFalse( wp_script_is( 'wp-pointer' ) );
		$this->assertFalse( wp_style_is( 'wp-pointer' ) );
	}

	public function test_enqueue_pointers__no_active_pointers() {
		remove_all_actions( 'admin_enqueue_scripts' );
		$pointers = new Pointers();
		$pointers->register();

		add_filter(
			'googlesitekit_admin_pointers',
			function( $pointers ) {
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
	}

	public function test_enqueue_pointers() {
		remove_all_actions( 'admin_enqueue_scripts' );
		$pointers = new Pointers();
		$pointers->register();

		add_filter(
			'googlesitekit_admin_pointers',
			function( $pointers ) {
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
	}
}
