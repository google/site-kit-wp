<?php
/**
 * Class Google\Site_Kit\Modules\Ads\Settings
 *
 * @package   Google\Site_Kit\Modules\Ads
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Ads;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Interface;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Trait;

/**
 * Class for Ads settings.
 *
 * @since 1.122.0
 * @access private
 * @ignore
 */
class Settings extends Module_Settings implements Setting_With_Owned_Keys_Interface {
	use Setting_With_Owned_Keys_Trait;

	const OPTION = 'googlesitekit_ads_settings';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.122.0
	 */
	public function register() {
		parent::register();

		$this->register_owned_keys();
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.122.0
	 * @since 1.126.0 Added new settings fields for PAX.
	 *
	 * @return array An array of default settings values.
	 */
	protected function get_default() {
		return array(
			'conversionID'    => '',
			'paxConversionID' => '',
			'extCustomerID'   => '',
		);
	}

	/**
	 * Returns keys for owned settings.
	 *
	 * @since 1.122.0
	 * @since 1.126.0 Added new settings fields for PAX.
	 *
	 * @return array An array of keys for owned settings.
	 */
	public function get_owned_keys() {
		return array(
			'conversionID',
			'paxConversionID',
			'extCustomerID',
		);
	}
}
