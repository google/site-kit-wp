<?php

namespace phpunit\integration\Core\Util;

use Google\Site_Kit\Core\Util\Collection_Key_Cap_Filter;
use Google\Site_Kit\Tests\TestCase;

class Collection_Key_Cap_FilterTest extends TestCase {

	/**
	 * @dataProvider data_filter_key_by_cap
	 */
	public function test_filter_key_by_cap( $role, $cap, $key, $input, $expected ) {
		$user_id = $this->factory()->user->create( array( 'role' => $role ) );
		wp_set_current_user( $user_id );

		$filter = new Collection_Key_Cap_Filter( $key, $cap );
		$output = $filter->filter_key_by_cap( $input );

		$this->assertEquals( $expected, $output );
	}

	public function data_filter_key_by_cap() {
		yield 'editor with delete_users' => array(
			'editor',
			'delete_users',
			'foo',
			array(
				array(
					'foo' => 'bar',
					'baz' => 'buzz',
				),
				array(
					'foo' => '123',
					'baz' => 'any',
				),
			),
			array(
				array( 'baz' => 'buzz' ),
				array( 'baz' => 'any' ),
			),
		);

		yield 'admin with delete_users' => array(
			'administrator',
			'delete_users',
			'foo',
			array(
				array(
					'foo' => 'bar',
					'baz' => 'buzz',
				),
				array(
					'foo' => '123',
					'baz' => 'any',
				),
			),
			array(
				array(
					'foo' => 'bar',
					'baz' => 'buzz',
				),
				array(
					'foo' => '123',
					'baz' => 'any',
				),
			),
		);
	}
}
