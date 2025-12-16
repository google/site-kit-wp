<?php
/**
 * Class Google\Site_Kit\Core\Assets\Inline_Script_Data
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Assets;

/**
 * Helper for dispatching inline data to a datastore.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Inline_Script_Data {
	/**
	 * Adds an inline script that dispatches data to a datastore action.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $handle     Script handle to attach inline data to.
	 * @param string $store_name Store name to dispatch to.
	 * @param string $action     Action to dispatch on the store.
	 * @param mixed  $data       JSON-encodable data to pass to the action.
	 */
	public static function dispatch_data( $handle, $store_name, $action, $data ) {
		if ( empty( $handle ) || empty( $store_name ) || empty( $action ) ) {
			return;
		}

		if ( empty( $data ) ) {
			return;
		}

		wp_add_inline_script(
			$handle,
			sprintf(
				'( window.googlesitekit?.data?.dispatch && window.googlesitekit.data.dispatch( %s ).%s( %s ) );',
				wp_json_encode( $store_name ),
				$action,
				wp_json_encode( $data )
			),
			'after'
		);
	}
}
