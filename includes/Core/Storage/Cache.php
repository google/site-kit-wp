<?php
/**
 * Class Google\Site_Kit\Core\Storage\Cache
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

use Google\Site_Kit_Dependencies\Google\Service\Exception as Google_Service_Exception;

/**
 * Class providing a server side caching framework.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Cache {

	/**
	 * The key for saving the global cache keys.
	 *
	 * @var string $global_cache_keys_key The key.
	 */
	private static $global_cache_keys_key = 'googlesitekit_global_cache_keys';

	/**
	 * The global record of cache keys used on the site.
	 *
	 * @var array
	 */
	private $global_cache_keys;

	/**
	 * Construct the Cache class.
	 */
	public function __construct() {
		$this->global_cache_keys = get_option( self::$global_cache_keys_key ) ?: array();
	}

	/**
	 * Helper function to get the cache data.
	 */
	public function get_current_cache_data() {

		$cache_data = array();

		// Add the global cache data.
		$keys = $this->get_global_cache_keys();
		foreach ( $keys as $key ) {

			// This only retrieves fresh data because transients expire.
			$cache = get_transient( 'googlesitekit_' . $key );

			if ( $cache ) {
				$cache_data[ $key ] = $cache;
			} else {

				// Remove the expired key from the global cache.
				$this->remove_global_cache_key( $key );
			}
		}
		return $cache_data;
	}

	/**
	 * Remove a cache key to the global record of cache keys.
	 *
	 * @param string $key The key to add.
	 */
	private function remove_global_cache_key( $key ) {
		$key_index = array_search( $key, $this->global_cache_keys, true );

		if ( $key_index ) {
			unset( $this->global_cache_keys[ $key_index ] );
			update_option( self::$global_cache_keys_key, $this->global_cache_keys, false );
		}
	}

	/**
	 * Add a cache key to the global record of cache keys.
	 *
	 * @param string $key The key to add.
	 */
	private function add_global_cache_key( $key ) {
		// Only add the key if it isn't already present.
		if ( ! in_array( $key, $this->global_cache_keys, true ) ) {
			$this->global_cache_keys[] = $key;
			update_option( self::$global_cache_keys_key, $this->global_cache_keys, false );
		}
	}

	/**
	 * Retrieve the global record of cache keys.
	 *
	 * @return array The array of cache keys used on the site.
	 */
	private function get_global_cache_keys() {
		return $this->global_cache_keys;
	}

	/**
	 * Cache some data.
	 *
	 * @param Object $key The original data key.
	 * @param Object $data    The data to cache.
	 */
	public function set_cache_data( $key, $data ) {
		set_transient( 'googlesitekit_' . $key, $data, HOUR_IN_SECONDS );
		$this->add_global_cache_key( $key );
	}

	/**
	 * Cache the results of a batch operation.
	 *
	 * @param array $batch_requests The original requests.
	 * @param array $results        The results to cache.
	 */
	public function cache_batch_results( $batch_requests, $results ) {
		$request_keys = wp_list_pluck( $batch_requests, 'key' );

		foreach ( $results as $key => $result ) {
			if ( $result instanceof \Exception || $result instanceof Google_Service_Exception ) {
				continue;
			}
			$key = str_replace( 'response-', '', $key );
			if ( in_array( $key, $request_keys, true ) ) {
				$this->set_cache_data( $key, $result );
			}
		}
	}

}
