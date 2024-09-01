<?php
/**
 * Class Google\Site_Kit\Core\Gemini\Gemini_Settings
 *
 * @package   Google\Site_Kit\Core\Gemini
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Gemini;

use Google\Site_Kit\Core\Storage\Setting;
use Google\Site_Kit\Core\Storage\Data_Encryption;

/**
 * Class to store user Consent Mode settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Gemini_Settings extends Setting {

	/**
	 * The user option name for this setting.
	 */
	const OPTION = 'googlesitekit_gemini';

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'object';
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The default value.
	 */
	protected function get_default() {
		return array(
			'APIKey'                     => '',
			'generatingQuotes'           => false,
			'memorableQuotesEnabled'     => false,
			'memorableQuotesPosts'       => array(),
			'memorableQuotes'            => array(),
			'memorableQuotesAutoPublish' => false,
			'siteKitAssistantEnabled'    => false,
		);
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable Sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return function ( $value ) {
			$new_value = $this->get();

			$encryption = new Data_Encryption();

			$new_value['APIKey'] = $value['APIKey'];
			// The library will encrypt an empty string so if the key is empty, set it to an empty string explicitly.
			if ( '' === $value['APIKey'] ) {
				$new_value['APIKey'] = '';
			}
			// get_sanitize_callback is called twice some times on save which causes the token to be encrypted twice.
			// As the encrypted token is much longer, I use strlen to fix this for now.
			if ( '' !== $value['APIKey'] && strlen( $value['APIKey'] ) < 100 ) {
				$new_value['APIKey'] = $encryption->encrypt( $value['APIKey'] );
			}

			if ( isset( $value['memorableQuotesEnabled'] ) ) {
				$new_value['memorableQuotesEnabled'] = $value['memorableQuotesEnabled'];
			}

			// Disable features if the API key is removed.
			if ( '' === $value['APIKey'] ) {
				$new_value['memorableQuotesEnabled']     = false;
				$new_value['memorableQuotesAutoPublish'] = false;
				$new_value['siteKitAssistantEnabled']    = false;
			}

			if ( is_array( $value['memorableQuotesPosts'] ) ) {
				$new_value['memorableQuotesPosts'] = array_filter( $value['memorableQuotesPosts'] );
			}

			if ( is_array( $value['memorableQuotes'] ) ) {
				$new_value['memorableQuotes'] = array_filter( $value['memorableQuotes'] );
			}

			if ( isset( $value['memorableQuotesAutoPublish'] ) ) {
				$new_value['memorableQuotesAutoPublish'] = $value['memorableQuotesAutoPublish'];
			}

			if ( isset( $value['siteKitAssistantEnabled'] ) ) {
				$new_value['siteKitAssistantEnabled'] = $value['siteKitAssistantEnabled'];
			}

			return $new_value;
		};
	}
}
