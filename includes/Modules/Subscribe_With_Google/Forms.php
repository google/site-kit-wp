<?php
/**
 * Class Google\Site_Kit\Modules\Subscribe_With_Google\Forms
 *
 * @package   Google\Site_Kit\Modules\Subscribe_With_Google
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Subscribe_With_Google;

/** Renders forms. */
final class Forms {

	/**
	 * Returns value of field from request, if it exists and is accompanied by a valid nonce.
	 * Returns a `false` boolean value otherwise.
	 *
	 * @param string $field_name Name of field (ex: "product").
	 * @param string $nonce_name Name indicating where nonce appears (ex: "edit_post_nonce").
	 * @param string $nonce_action Action the nonce protects (ex: "saving_post").
	 *
	 * @return bool|string Value of field, if it exists and is accompanied by a valid nonce.
	 *                     Returns a `false` boolean value otherwise.
	 */
	public static function receive_field( $field_name, $nonce_name, $nonce_action ) {
		// Require nonce to exist in request.
		if (
			! isset( $_REQUEST[ $nonce_name ] ) ||
			! isset( $_REQUEST[ $field_name ] )
			) {
				return false;
		}

		// Verify nonce.
		$nonce = sanitize_key( $_REQUEST[ $nonce_name ] );
		if ( ! wp_verify_nonce( $nonce, $nonce_action ) ) {
			return false;
		}

		return sanitize_text_field( wp_unslash( $_REQUEST[ $field_name ] ) );
	}
}
