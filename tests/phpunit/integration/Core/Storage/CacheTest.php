<?php
/**
 * CacheTest
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Core\Storage\Cache;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Storage
 */
class CacheTest extends TestCase {

	public function test_get_current_cache_data() {
		$this->assertFalse( get_transient( 'googlesitekit_test-key-a' ) );
		$this->assertFalse( get_transient( 'googlesitekit_test-key-b' ) );
		$this->assertFalse( get_transient( 'googlesitekit_test-key-c' ) );
		delete_option( 'googlesitekit_global_cache_keys' );

		$cache = new Cache();
		// Add a few cache entries
		$cache->set_cache_data( 'test-key-a', 'test-value-a' );
		$cache->set_cache_data( 'test-key-b', 'test-value-b' );
		$cache->set_cache_data( 'test-key-c', 'test-value-c' );

		// Returns an associative array of transient name => transient value
		$this->assertEqualSetsWithIndex(
			array(
				'test-key-a' => 'test-value-a',
				'test-key-b' => 'test-value-b',
				'test-key-c' => 'test-value-c',
			),
			$cache->get_current_cache_data()
		);
		$this->assertEqualSets(
			array(
				'test-key-a',
				'test-key-b',
				'test-key-c',
			),
			get_option( 'googlesitekit_global_cache_keys' )
		);

		// Test that expired/deleted transients are removed from global cache keys.
		delete_transient( 'googlesitekit_test-key-b' );
		$this->assertEqualSetsWithIndex(
			array(
				'test-key-a' => 'test-value-a',
				'test-key-c' => 'test-value-c',
			),
			$cache->get_current_cache_data()
		);
		$this->assertEqualSets(
			array(
				'test-key-a',
				'test-key-c',
			),
			get_option( 'googlesitekit_global_cache_keys' )
		);
	}

	public function test_set_cache_data() {
		$this->assertFalse( get_transient( 'googlesitekit_test-key-a' ) );
		$this->assertFalse( get_transient( 'googlesitekit_test-key-b' ) );
		$this->assertFalse( get_transient( 'googlesitekit_test-key-c' ) );
		delete_option( 'googlesitekit_global_cache_keys' );

		$cache = new Cache();
		$cache->set_cache_data( 'test-key-a', 'test-value-a' );
		$cache->set_cache_data( 'test-key-b', 'test-value-b' );
		$cache->set_cache_data( 'test-key-c', 'test-value-c' );

		$this->assertEquals( 'test-value-a', get_transient( 'googlesitekit_test-key-a' ) );
		$this->assertEquals( 'test-value-b', get_transient( 'googlesitekit_test-key-b' ) );
		$this->assertEquals( 'test-value-c', get_transient( 'googlesitekit_test-key-c' ) );

		$this->assertEqualSets(
			array(
				'test-key-a',
				'test-key-b',
				'test-key-c',
			),
			get_option( 'googlesitekit_global_cache_keys' )
		);

		// Subsequent cache setting does not append new keys to global cache keys.
		$cache->set_cache_data( 'test-key-a', 'test-value-b' );
		$cache->set_cache_data( 'test-key-a', 'test-value-c' );

		$this->assertEqualSets(
			array(
				'test-key-a',
				'test-key-b',
				'test-key-c',
			),
			get_option( 'googlesitekit_global_cache_keys' )
		);
	}

	public function test_cache_batch_results() {
		$this->assertFalse( get_transient( 'googlesitekit_test-key-a' ) );
		$this->assertFalse( get_transient( 'googlesitekit_test-key-b' ) );
		$this->assertFalse( get_transient( 'googlesitekit_test-key-c' ) );
		delete_option( 'googlesitekit_global_cache_keys' );

		$cache = new Cache();

		$cache->cache_batch_results(
			array(
				array( 'key' => 'test-key-b' ),
				array( 'key' => 'test-key-c' ),
				array( 'key' => 'test-key-a' ),
			),
			array(
				'response-test-key-a' => 'test-value-a',
				'response-test-key-b' => new \Exception,
				'response-test-key-c' => 'test-value-c',
			)
		);

		$this->assertEquals( 'test-value-a', get_transient( 'googlesitekit_test-key-a' ) );
		$this->assertEquals( 'test-value-c', get_transient( 'googlesitekit_test-key-c' ) );
		// Ensure exception responses are not cached.
		$this->assertFalse( get_transient( 'googlesitekit_test-key-b' ) );

		$this->assertEqualSets(
			array(
				'test-key-a',
				'test-key-c',
			),
			get_option( 'googlesitekit_global_cache_keys' )
		);
	}
}
