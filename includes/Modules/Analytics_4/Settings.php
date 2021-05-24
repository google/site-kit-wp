<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Settings
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Interface;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Trait;

/**
 * Class for Analytics 4 settings.
 *
 * @since 1.30.0
 * @access private
 * @ignore
 */
class Settings extends Module_Settings implements Setting_With_Owned_Keys_Interface {
	use Setting_With_Owned_Keys_Trait;

	const OPTION = 'googlesitekit_analytics-4_settings';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.30.0
	 */
	public function register() {
		parent::register();

		$this->register_owned_keys();
	}

	/**
	 * Returns keys for owned settings.
	 *
	 * @since 1.30.0
	 *
	 * @return array An array of keys for owned settings.
	 */
	public function get_owned_keys() {
		return array(
			// TODO: These can be uncommented when Analytics and Analytics 4 modules are officially separated.
			/* 'accountID', */ // phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			/* 'adsConversionID', */ // phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			'propertyID',
			'webDataStreamID',
			'measurementID',
		);
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.30.0
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			'ownerID'         => 0,
			// TODO: These can be uncommented when Analytics and Analytics 4 modules are officially separated.
			/* 'accountID'       => '', */ // phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			/* 'adsConversionID' => '', */ // phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			'propertyID'      => '',
			'webDataStreamID' => '',
			'measurementID'   => '',
			'useSnippet'      => true,
		);
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.30.0
	 *
	 * @return callable|null
	 */
	protected function get_sanitize_callback() {
		return function( $option ) {
			if ( is_array( $option ) ) {
				if ( isset( $option['useSnippet'] ) ) {
					$option['useSnippet'] = (bool) $option['useSnippet'];
				}
			}
			return $option;
		};
	}
}
