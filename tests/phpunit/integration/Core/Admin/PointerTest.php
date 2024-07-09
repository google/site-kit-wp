<?php
/**
 * PointerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Admin
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Admin;

use Google\Site_Kit\Core\Admin\Pointer;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Admin
 * @group Pointer
 */
class PointerTest extends TestCase {

	const TEST_HOOK_SUFFIX = 'test-hook-suffix';

	public function test_get_slug() {
		$pointer = new Pointer( 'test-slug', array() );

		$this->assertEquals( 'test-slug', $pointer->get_slug() );
	}

	public function test_get_title() {
		$pointer = new Pointer(
			'test-slug',
			array(
				'title' => 'Test Title',
			)
		);

		$this->assertEquals( 'Test Title', $pointer->get_title() );
	}

	public function test_get_content_string() {
		$pointer = new Pointer(
			'test-slug',
			array(
				'content' => 'Test Content',
			)
		);

		$this->assertEquals( '<p>Test Content</p>', $pointer->get_content() );
	}

	public function test_get_content_callback() {
		$pointer = new Pointer(
			'test-slug',
			array(
				'content' => function () {
					return '<strong>Test Content</strong>';
				},
			)
		);

		$this->assertEquals( '<strong>Test Content</strong>', $pointer->get_content() );
	}

	public function test_get_target_id() {
		$pointer = new Pointer(
			'test-slug',
			array(
				'target_id' => 'test-target-id',
			)
		);

		$this->assertEquals( 'test-target-id', $pointer->get_target_id() );
	}

	public function test_get_position_string() {
		$pointer = new Pointer(
			'test-slug',
			array(
				'position' => 'bottom',
			)
		);

		$this->assertEquals(
			'bottom',
			$pointer->get_position()
		);
	}

	public function test_get_position_array() {
		$pointer = new Pointer(
			'test-slug',
			array(
				'position' => array(
					'edge'  => 'top',
					'align' => 'left',
				),
			)
		);

		$this->assertEquals(
			array(
				'edge'  => 'top',
				'align' => 'left',
			),
			$pointer->get_position()
		);
	}

	public function test_get_position_default() {
		$pointer = new Pointer( 'test-slug', array() );

		$this->assertEquals(
			'top',
			$pointer->get_position()
		);
	}

	/**
	 * @dataProvider data_is_active
	 *
	 * @param array  $args     Arguments to pass to the pointer constructor.
	 * @param bool   $expected Whether the check is expected to evaluate to true or false.
	 */
	public function test_is_active( array $args, $expected ) {
		$pointer = new Pointer( 'test-slug', $args );
		if ( $expected ) {
			$this->assertTrue( $pointer->is_active( self::TEST_HOOK_SUFFIX ) );
		} else {
			$this->assertFalse( $pointer->is_active( self::TEST_HOOK_SUFFIX ) );
		}
	}

	public function data_is_active() {
		return array(
			'no args'             => array(
				array(),
				false,
			),
			'no title'            => array(
				array(
					'title'           => '',
					'content'         => 'Test pointer content.',
					'target_id'       => 'test-target',
					'active_callback' => '__return_true',
				),
				false,
			),
			'no content'          => array(
				array(
					'title'           => 'Test pointer title',
					'content'         => '',
					'target_id'       => 'test-target',
					'active_callback' => '__return_true',
				),
				false,
			),
			'no target_id'        => array(
				array(
					'title'           => 'Test pointer title',
					'content'         => 'Test pointer content.',
					'target_id'       => '',
					'active_callback' => '__return_true',
				),
				false,
			),
			'no callback'         => array(
				array(
					'title'           => 'Test pointer title',
					'content'         => 'Test pointer content.',
					'target_id'       => 'test-target',
					'active_callback' => null,
				),
				true,
			),
			'test_hook_callback'  => array(
				array(
					'title'           => 'Test pointer title',
					'content'         => 'Test pointer content.',
					'target_id'       => 'test-target',
					'active_callback' => function ( $hook_suffix ) {
						return self::TEST_HOOK_SUFFIX === $hook_suffix;
					},
				),
				true,
			),
			'other_hook_callback' => array(
				array(
					'title'           => 'Test pointer title',
					'content'         => 'Test pointer content.',
					'target_id'       => 'test-target',
					'active_callback' => function ( $hook_suffix ) {
						return 'other-hook-suffix' === $hook_suffix;
					},
				),
				false,
			),
		);
	}
}
