<?php
/**
 * Term_MetaTest
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Core\Storage\Term_Meta;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Storage
 */
class Term_MetaTest extends TestCase {

	public function test_get() {
		global $wpdb;

		$term_meta  = new Term_Meta();
		$term_id    = $this->factory()->term->create();
		$meta_key   = 'test_meta';
		$meta_value = 'test_value';

		$wpdb->insert(
			$wpdb->termmeta,
			array(
				'term_id'    => $term_id,
				'meta_key'   => $meta_key,
				'meta_value' => $meta_value,
			)
		);

		$this->assertEquals(
			$meta_value,
			$term_meta->get( $term_id, $meta_key, true )
		);
	}

	public function test_add() {
		$term_meta  = new Term_Meta();
		$term_id    = $this->factory()->term->create();
		$meta_key   = 'test_meta';
		$meta_value = 'test_value';

		$meta_id = $term_meta->add( $term_id, $meta_key, $meta_value );
		$meta    = $this->queryTermMeta( $term_id, $meta_key );

		$this->assertGreaterThan( 0, $meta_id );
		$this->assertEquals( $meta_value, $meta['meta_value'] );
	}

	public function test_update() {
		global $wpdb;

		$term_meta      = new Term_Meta();
		$term_id        = $this->factory()->term->create();
		$meta_key       = 'test_meta';
		$meta_value     = 'test_value';
		$meta_old_vlaue = 'old_test_value';

		$wpdb->insert(
			$wpdb->termmeta,
			array(
				'term_id'    => $term_id,
				'meta_key'   => $meta_key,
				'meta_value' => $meta_old_vlaue,
			)
		);

		$updated = $term_meta->update( $term_id, $meta_key, $meta_value );
		$meta    = $this->queryTermMeta( $term_id, $meta_key );

		$this->assertTrue( $updated );
		$this->assertEquals( $meta_value, $meta['meta_value'] );
	}

	public function test_delete() {
		global $wpdb;

		$term_meta  = new Term_Meta();
		$term_id    = $this->factory()->term->create();
		$meta_key   = 'test_meta';
		$meta_value = 'test_value';

		$wpdb->insert(
			$wpdb->termmeta,
			array(
				'term_id'    => $term_id,
				'meta_key'   => $meta_key,
				'meta_value' => $meta_value,
			)
		);

		$deleted = $term_meta->delete( $term_id, $meta_key );

		$this->assertTrue( $deleted );
		$this->assertPostMetaNotExists( $term_id, $meta_key );
	}
}
