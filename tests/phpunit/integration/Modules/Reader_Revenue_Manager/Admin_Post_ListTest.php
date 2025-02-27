<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Admin_Post_ListTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Post_Meta;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Admin_Post_List;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Post_Product_ID;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit\Tests\TestCase;

class Admin_Post_ListTest extends TestCase {

	/**
	 * @var Admin_Post_List
	 */
	private $admin_post_list;

	/**
	 * @var Settings
	 */
	private $settings;

	/**
	 * @var Post_Product_ID
	 */
	private $post_product_id;

	public function set_up(): void {
		parent::set_up();

		$options               = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->settings        = new Settings( $options );
		$post_meta             = new Post_Meta();
		$this->post_product_id = new Post_Product_ID( $post_meta, $this->settings );
		$this->admin_post_list = new Admin_Post_List( $this->settings, $this->post_product_id );

		$this->settings->register();
		$this->settings->merge(
			array(
				'publicationID' => 'test_publication_id',
				'productIDs'    => array(
					'ABCD:basic',
					'ABCD:premium',
					'ABCD:ultimate',
				),
				'snippetMode'   => 'post_types',
			)
		);

		$this->admin_post_list->register();
	}

	public function test_filters_added() {
		// Simulate visiting the admin post list screen.
		$this->go_to( admin_url( 'edit.php' ) );

		$hooked_functions = array(
			array(
				'hook'     => 'manage_post_posts_columns',
				'function' => 'add_column',
			),
			array(
				'hook'     => 'manage_page_posts_columns',
				'function' => 'add_column',
			),
			array(
				'hook'     => 'manage_post_posts_custom_column',
				'function' => 'fill_column',
			),
			array(
				'hook'     => 'manage_page_posts_custom_column',
				'function' => 'fill_column',
			),
			array(
				'hook'     => 'bulk_edit_custom_box',
				'function' => 'bulk_edit_field',
			),
			array(
				'hook'     => 'save_post',
				'function' => 'save_field',
			),
		);

		foreach ( $hooked_functions as $hooked_function ) {
			$this->assertTrue(
				has_action( $hooked_function['hook'], array( $this->admin_post_list, $hooked_function['function'] ) ) !== false,
				sprintf(
					'Failed asserting that %s is hooked to %s.',
					$hooked_function['function'],
					$hooked_function['hook']
				)
			);
		}
	}

	public function test_add_column() {
		$columns  = array(
			'title' => 'Title',
			'date'  => 'Date',
		);
		$expected = array_merge( $columns, array( 'rrm_product_id' => 'Show Reader Revenue CTAs' ) );
		$filtered = $this->admin_post_list->add_column( $columns );
		$this->assertEquals( $expected, $filtered );
	}

	public function test_fill_column_none() {
		$post_id = $this->factory()->post->create();
		$this->post_product_id->set( $post_id, 'none' );

		ob_start();
		$this->admin_post_list->fill_column( 'rrm_product_id', $post_id );
		$output = ob_get_clean();

		$this->assertStringContainsString( 'None', $output );
	}

	public function test_fill_column_product_id() {
		$post_id = $this->factory()->post->create();
		$this->post_product_id->set( $post_id, 'ABCD:premium' );

		ob_start();
		$this->admin_post_list->fill_column( 'rrm_product_id', $post_id );
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Use "premium"', html_entity_decode( $output ) );
	}

	public function test_fill_column_openaccess() {
		$post_id = $this->factory()->post->create();
		$this->post_product_id->set( $post_id, 'openaccess' );

		ob_start();
		$this->admin_post_list->fill_column( 'rrm_product_id', $post_id );
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Open access', $output );
	}

	public function test_save_field_invalid_nonce() {
		$post_id                    = $this->factory()->post->create();
		$_REQUEST['_wpnonce']       = 'invalid_nonce';
		$_REQUEST['rrm_product_id'] = 'ABCD:basic';

		$this->admin_post_list->save_field( $post_id );
		$this->assertNotEquals( 'ABCD:basic', $this->post_product_id->get( $post_id ) );
	}

	/**
	 * @group 10up
	 */
	public function test_save_field() {
		$post_id = $this->factory()->post->create();
		$user_id = $this->factory()->user->create_and_get(
			array(
				'role' => 'editor',
			)
		);
		wp_set_current_user( $user_id );
		$_REQUEST['_wpnonce']       = wp_create_nonce( 'bulk-posts' );
		$_REQUEST['rrm_product_id'] = 'ABCD:basic';

		$this->admin_post_list->save_field( $post_id );
		$this->assertEquals( 'ABCD:basic', $this->post_product_id->get( $post_id ) );
	}
}
