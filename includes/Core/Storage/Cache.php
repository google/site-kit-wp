<?php
/**
 * Class Google\Site_Kit\Core\Storage\Cache
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

/**
 * Class providing a server side caching framework.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Cache {

	/**
	 * The key for saving the global post title-> post id cache.
	 *
	 * @var string $global_cache_keys_key The key.
	 */
	private static $global_cache_post_ids_key = 'googlesitekit_global_cache_post_id_s';

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
	 * ------------------------------
	 * Static functions defined below
	 * ------------------------------
	 */

	/**
	 * Delete the global url-> post id cache.
	 */
	public static function delete_cached_title_data() {
		delete_transient( self::$global_cache_post_ids_key );
	}

	/**
	 * Get the global url-> post id cache.
	 *
	 * @return array The array of cached post url-> post id mappings. Empty array if none found.
	 */
	public static function get_cached_title_data() {
		$cached_data = get_transient( self::$global_cache_post_ids_key );
		return $cached_data ? $cached_data : array();
	}

	/**
	 * Set the global url-> post id cache. Cache at most 20 values.
	 *
	 * @param array $new_data The array of new data to set.
	 */
	public static function set_cached_title_data( $new_data ) {
		$cached_data = get_transient( self::$global_cache_post_ids_key );
		if ( false === $cached_data ) {
			set_transient( self::$global_cache_post_ids_key, $new_data );
			return;
		}

		$merged_array = array_merge( $cached_data, $new_data );
		$merged_array = array_slice( $merged_array, 0, 20 );
		set_transient( self::$global_cache_post_ids_key, $merged_array );
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
			$cache = get_transient( $key );

			if ( $cache ) {
				$cache_data[ $key ] = $cache;
			} else {

				// Remove the expired key from the global cache.
				self::remove_global_cache_key( $key );
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
		unset( $this->global_cache_keys[ $key ] );
		update_option( self::$global_cache_keys_key, $this->global_cache_keys, false );
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
		$key = 'googlesitekit_' . $key;

		set_transient( $key, $data, HOUR_IN_SECONDS );
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
			if ( $result instanceof \Exception || $result instanceof \Google_Service_Exception ) {
				continue;
			}
			$key = str_replace( 'response-', '', $key );
			if ( in_array( $key, $request_keys, true ) ) {
				$this->set_cache_data( $key, $result );
			}
		}
	}

}
