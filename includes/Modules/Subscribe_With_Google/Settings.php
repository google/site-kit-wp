<?php
/**
 * Class Google\Site_Kit\Modules\Subscribe_With_Google\Settings
 *
 * @package   Google\Site_Kit\Modules\Subscribe_With_Google
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Subscribe_With_Google;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Interface;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Trait;

/**
 * Class for Tag Manager settings.
 *
 * @since 1.41.0
 * @access private
 * @ignore
 */
class Settings extends Module_Settings implements Setting_With_Owned_Keys_Interface {
	use Setting_With_Owned_Keys_Trait;

	const OPTION = 'googlesitekit_subscribe-with-google_settings';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.41.0
	 */
	public function register() {
		parent::register();

		$this->register_owned_keys();
	}

	/**
	 * Returns keys for owned settings.
	 *
	 * @since 1.41.0
	 *
	 * @return array An array of keys for owned settings.
	 */
	public function get_owned_keys() {
		return array(
			'products',
			'publicationID',
			'revenueModel',
		);
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.41.0
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			'ownerID'       => '',
			'products'      => array(),
			'publicationID' => '',
			'revenueModel'  => '',
		);
	}
}
