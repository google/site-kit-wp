<?php
/**
 * WP_Entity_HelpersTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\WP_Entity_Helpers;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class WP_Entity_HelpersTest extends TestCase {

	public function test_get_user_display_name() {
		$test_user_id = $this->factory()->user->create( array( 'display_name' => 'test display name' ) );
		$this->assertEquals( 'test display name', WP_Entity_Helpers::get_user_display_name( $test_user_id ) );
	}

	public function test_parse_category_names__mixed_values() {
		$category_with_number = $this->factory()->category->create( array( 'name' => '2' ) );
		$category_with_commas = $this->factory()->category->create( array( 'name' => 'Category,with,commas' ) );
		$normal_category      = $this->factory()->category->create( array( 'name' => 'Normal Category' ) );
		$category_ids_string  = implode( ',', array( $category_with_number, $category_with_commas, 1955, $normal_category ) ); // 1955 would be a non-existent category

		$this->assertEquals(
			'["2","Category,with,commas",1955,"Normal Category"]',
			WP_Entity_Helpers::parse_category_names( $category_ids_string )
		);
	}

	public function test_parse_category_names__single_value() {
		$this->assertEquals(
			'["Uncategorized"]',
			WP_Entity_Helpers::parse_category_names( '1' )
		);
	}

}
