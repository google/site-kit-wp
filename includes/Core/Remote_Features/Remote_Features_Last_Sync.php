<?php
/**
 * Class Google\Site_Kit\Core\Remote_Features\Remote_Features_Last_Sync
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Remote_Features;

use Closure;
use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class handling the storage of remote features.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Remote_Features_Last_Sync extends Setting {
	/**
	 * Option key in options table to store remote features last sync timestamp.
	 */
	const OPTION = 'googlesitekitpersistent_remote_features_last_sync';

	/**
	 * Gets the expected value type.
	 *
	 * @return integer
	 */
	protected function get_type() {
		return 'integer';
	}

	/**
	 * Gets the default value.
	 *
	 * @return array
	 */
	protected function get_default() {
		return 0;
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @return Closure
	 */
	protected function get_sanitize_callback() {
		return function ( $value ) {
			if ( ! is_int( $value ) ) {
				$value = 0;
			}

			return $value;
		};
	}
}
