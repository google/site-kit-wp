<?php
/**
 * Class Google\Site_Kit\Core\Util\Remote_Features
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class handling the fetching of Site Kit's currently
 * enabled features remotely via the Site Kit service.
 *
 * @since 1.118.0
 * @access private
 * @ignore
 */
final class Remote_Features extends Setting {
	/**
	 * Option key in options table to store remote features.
	 */
	const OPTION = 'googlesitekitpersistent_remote_features';

	protected function get_type() {
		return 'object';
	}

	protected function get_default() {
		return array();
	}

	protected function get_sanitize_callback() {
		return function ( $value ) {
			if ( ! is_array( $value ) ) {
				return array();
			}

			$new_value = array();

			foreach ( $value as $feature => $meta ) {
				$new_value[ $feature ] = array( 'enabled' => ! empty( $meta['enabled'] ) );
			}

			return $new_value;
		};
	}


}
