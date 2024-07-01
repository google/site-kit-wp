<?php
/**
 * NoticeTest
 *
 * @package   Google\Site_Kit\Tests\Core\Admin
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Notice;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Admin
 */
class NoticeTest extends TestCase {

	const TEST_HOOK_SUFFIX = 'test-hook-suffix';

	public function test_get_slug() {
		$notice = new Notice( 'test-slug', array() );

		$this->assertEquals( 'test-slug', $notice->get_slug() );
	}

	/**
	 * @dataProvider data_is_active
	 *
	 * @param array  $args     Arguments to pass to the notice constructor.
	 * @param bool   $expected Whether the check is expected to evaluate to true or false.
	 */
	public function test_is_active( array $args, $expected ) {
		$notice = new Notice( 'test-slug', $args );
		if ( $expected ) {
			$this->assertTrue( $notice->is_active( self::TEST_HOOK_SUFFIX ) );
		} else {
			$this->assertFalse( $notice->is_active( self::TEST_HOOK_SUFFIX ) );
		}
	}

	public function data_is_active() {
		return array(
			'no args'             => array(
				array(),
				false,
			),
			'no content'          => array(
				array(
					'content'         => '',
					'active_callback' => '__return_true',
				),
				false,
			),
			'no callback'         => array(
				array(
					'content'         => 'Test notice content.',
					'active_callback' => null,
				),
				true,
			),
			'test_hook_callback'  => array(
				array(
					'content'         => 'Test notice content.',
					'active_callback' => function ( $hook_suffix ) {
						return self::TEST_HOOK_SUFFIX === $hook_suffix;
					},
				),
				true,
			),
			'other_hook_callback' => array(
				array(
					'content'         => 'Test notice content.',
					'active_callback' => function ( $hook_suffix ) {
						return 'other-hook-suffix' === $hook_suffix;
					},
				),
				false,
			),
		);
	}

	public function test_render() {
		$notice = new Notice(
			'test-slug',
			array(
				'content' => 'Successfully saved<script></script>.',
				'type'    => Notice::TYPE_SUCCESS,
			)
		);

		ob_start();
		$notice->render();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<div id="googlesitekit-notice-test-slug" class="notice notice-success">', $output );
		$this->assertStringContainsString( '<p>Successfully saved.</p>', $output );
	}

	public function test_render_with_callable() {
		$notice = new Notice(
			'test-slug',
			array(
				'content'     => function () {
					return '<p>Successfully saved<script>document.write(" just now");</script>.</p>';
				},
				'type'        => Notice::TYPE_WARNING,
				'dismissible' => true,
			)
		);

		ob_start();
		$notice->render();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<div id="googlesitekit-notice-test-slug" class="notice notice-warning is-dismissible">', $output );
		$this->assertStringContainsString( '<p>Successfully saved<script>document.write(" just now");</script>.</p>', $output );
	}
}
