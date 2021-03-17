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
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Settings extends Module_Settings implements Setting_With_Owned_Keys_Interface {
	use Setting_With_Owned_Keys_Trait;

	const OPTION = 'googlesitekit_analytics_4_settings';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		parent::register();

		$this->register_owned_keys();
	}

	/**
	 * Returns keys for owned settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return array An array of keys for owned settings.
	 */
	public function get_owned_keys() {
		return array(
			'accountID',
			'propertyID',
			'webDatastreamID',
			'measurementID',
		);
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			'ownerID'         => 0,
			'accountID'       => '',
			'propertyID'      => '',
			'webDatastreamID' => '',
			'measurementID'   => '',
			'useSnippet'      => true,
		);
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
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
