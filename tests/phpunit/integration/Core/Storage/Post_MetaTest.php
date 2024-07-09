<?php
/**
 * Post_MetaTest
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Core\Storage\Post_Meta;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Storage
 */
class Post_MetaTest extends TestCase {

	public function test_get() {
		global $wpdb;

		$post_meta  = new Post_Meta();
		$post_id    = $this->factory()->post->create();
		$meta_key   = 'test_meta';
		$meta_value = 'test_value';

		$wpdb->insert(
			$wpdb->postmeta,
			array(
				'post_id'    => $post_id,
				'meta_key'   => $meta_key,
				'meta_value' => $meta_value,
			)
		);

		$this->assertEquals(
			$meta_value,
			$post_meta->get( $post_id, $meta_key, true )
		);
	}

	public function test_add() {
		$post_meta  = new Post_Meta();
		$post_id    = $this->factory()->post->create();
		$meta_key   = 'test_meta';
		$meta_value = 'test_value';

		$meta_id = $post_meta->add( $post_id, $meta_key, $meta_value );
		$meta    = $this->queryPostMeta( $post_id, $meta_key );

		$this->assertGreaterThan( 0, $meta_id );
		$this->assertEquals( $meta_value, $meta['meta_value'] );
	}

	public function test_update() {
		global $wpdb;

		$post_meta      = new Post_Meta();
		$post_id        = $this->factory()->post->create();
		$meta_key       = 'test_meta';
		$meta_value     = 'test_value';
		$meta_old_vlaue = 'old_test_value';

		$wpdb->insert(
			$wpdb->postmeta,
			array(
				'post_id'    => $post_id,
				'meta_key'   => $meta_key,
				'meta_value' => $meta_old_vlaue,
			)
		);

		$updated = $post_meta->update( $post_id, $meta_key, $meta_value );
		$meta    = $this->queryPostMeta( $post_id, $meta_key );

		$this->assertTrue( $updated );
		$this->assertEquals( $meta_value, $meta['meta_value'] );
	}

	public function test_delete() {
		global $wpdb;

		$post_meta  = new Post_Meta();
		$post_id    = $this->factory()->post->create();
		$meta_key   = 'test_meta';
		$meta_value = 'test_value';

		$wpdb->insert(
			$wpdb->postmeta,
			array(
				'post_id'    => $post_id,
				'meta_key'   => $meta_key,
				'meta_value' => $meta_value,
			)
		);

		$deleted = $post_meta->delete( $post_id, $meta_key );

		$this->assertTrue( $deleted );
		$this->assertPostMetaNotExists( $post_id, $meta_key );
	}
}
