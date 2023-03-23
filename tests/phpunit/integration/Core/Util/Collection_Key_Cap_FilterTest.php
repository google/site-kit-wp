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
		$collection_with_foo    = array(
			array(
				'foo' => 'bar',
				'baz' => 'buzz',
			),
			array(
				'foo' => '123',
				'baz' => 'any',
			),
		);
		$collection_without_foo = array(
			array( 'baz' => 'buzz' ),
			array( 'baz' => 'any' ),
		);

		yield 'editor with manage_options' => array(
			'editor',
			'manage_options',
			'foo',
			$collection_with_foo,
			$collection_without_foo,
		);

		yield 'admin with manage_options' => array(
			'administrator',
			'manage_options',
			'foo',
			$collection_with_foo,
			$collection_with_foo,
		);
	}
}
