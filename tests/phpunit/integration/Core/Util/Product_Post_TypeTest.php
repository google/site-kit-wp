<?php
/**
 * Class Google\Site_Kit\Tests\Core\Util\Product_Post_TypeTest
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Product_Post_Type;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Product_Post_TypeTest extends TestCase {

	public function tear_down() {
		// `WP_UnitTestCase` resets post types only in WordPress core's own tests, so
		// a post type registered here stays for later tests.
		foreach ( array( 'product', 'digital_product' ) as $post_type ) {
			if ( post_type_exists( $post_type ) ) {
				unregister_post_type( $post_type );
			}
		}

		parent::tear_down();
	}

	public function test_get__returns_the_product_post_type() {
		register_post_type( 'product', array( 'public' => true ) );

		$this->assertSame( 'product', Product_Post_Type::get()->name, 'The product post type should be `product` by default.' );
	}

	public function test_get__returns_null_with_no_product_post_type() {
		$this->assertNull( Product_Post_Type::get(), 'The product post type should be `null` where the site has no `product` post type.' );
	}

	public function test_get__returns_null_for_a_hidden_post_type() {
		register_post_type( 'product', array( 'public' => false ) );

		$this->assertNull( Product_Post_Type::get(), 'The product post type should be `null` where the `product` post type is not public.' );
	}

	public function test_get__returns_the_post_type_the_filter_names() {
		register_post_type( 'digital_product', array( 'public' => true ) );

		add_filter( 'googlesitekit_product_post_type', fn () => 'digital_product' );

		$this->assertSame( 'digital_product', Product_Post_Type::get()->name, 'The product post type should be the one the filter names.' );
	}

	public function test_get__returns_null_for_a_filtered_name_with_no_post_type() {
		add_filter( 'googlesitekit_product_post_type', fn () => 'invalid_post_type' );

		$this->assertNull( Product_Post_Type::get(), 'The product post type should be `null` where no post type has the name that the `googlesitekit_product_post_type` filter returns.' );
	}
}
