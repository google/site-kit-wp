<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Tag_GuardTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Post_Meta;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Post_Product_ID;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Tag_Guard;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 */
class Tag_GuardTest extends TestCase {

	/**
	 * Settings object.
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * Post_Product_ID instance.
	 *
	 * @var Post_Product_ID
	 */
	private $post_product_id;

	public function set_up() {
		parent::set_up();

		$this->settings = new Settings( new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) ) );

		$this->settings->register();
		$this->settings->merge(
			array(
				'publicationID' => '12345',
			)
		);

		$post_meta             = new Post_Meta();
		$this->post_product_id = new Post_Product_ID( $post_meta, $this->settings );
	}

	public function data_configurations__singular() {
		return array(
			'no publication id'         => array(
				array(
					'publicationID' => '',
				),
				'',
				false,
			),
			'with post-product-id none' => array(
				array(
					'publicationID' => '12345',
				),
				'none',
				false,
			),
			'with post-product-id'      => array(
				array(
					'publicationID' => '12345',
				),
				'12345',
				true,
			),
			'with empty post-product-id and snippet mode of per post' => array(
				array(
					'publicationID' => '12345',
					'snippetMode'   => 'per_post',
				),
				'',
				false,
			),
			'with empty post-product-id and snippet mode of post types' => array(
				array(
					'publicationID' => '12345',
					'snippetMode'   => 'post_types',
					// The `post` type is in the `postTypes` setting by default.
				),
				'',
				true,
			),
			'with empty post-product-id, snippet mode of post types, and the `post` type in the `postTypes` setting' => array(
				array(
					'publicationID' => '12345',
					'snippetMode'   => 'post_types',
					'postTypes'     => array( 'page', 'products', 'post' ),
				),
				'',
				true,
			),
			'with empty post-product-id, snippet mode of post types, and the `post` type not in the `postTypes` setting' => array(
				array(
					'publicationID' => '12345',
					'snippetMode'   => 'post_types',
					'postTypes'     => array( 'page', 'products' ),
				),
				'',
				false,
			),
			'with empty post-product-id and snippet mode of site wide' => array(
				array(
					'publicationID' => '12345',
					'snippetMode'   => 'sitewide',
					'postTypes'     => array( 'page', 'products' ),
				),
				'',
				true,
			),
		);
	}

	/**
	 * @dataProvider data_configurations__singular
	 */
	public function test_can_activate__singular(
		$settings,
		$post_product_id,
		$expected
	) {
		$this->settings->merge( $settings );

		// Navigate to a singular post.
		$post_ID = $this->factory()->post->create();
		$this->go_to( get_permalink( $post_ID ) );

		// Set the post product ID.
		$this->post_product_id->set( $post_ID, $post_product_id );

		$guard = new Tag_Guard( $this->settings, $this->post_product_id );

		$this->assertEquals( $expected, $guard->can_activate() );
	}

	public function data_configurations__non_singular() {
		return array(
			'no publication id'               => array(
				array(
					'publicationID' => '',
				),
				false,
			),
			'with snippet mode of post types' => array(
				array(
					'publicationID' => '12345',
					'snippetMode'   => 'post_types',
				),
				false,
			),
			'with snippet mode of per post'   => array(
				array(
					'publicationID' => '12345',
					'snippetMode'   => 'per_post',
				),
				false,
			),
			'with snippet mode of site wide'  => array(
				array(
					'publicationID' => '12345',
					'snippetMode'   => 'sitewide',
				),
				true,
			),
		);
	}

	/**
	 * @dataProvider data_configurations__non_singular
	 */
	public function test_can_activate__non_singular(
		$settings,
		$expected
	) {
		$this->settings->merge( $settings );

		$guard = new Tag_Guard( $this->settings, $this->post_product_id );

		$this->assertEquals( $expected, $guard->can_activate() );
	}
}
