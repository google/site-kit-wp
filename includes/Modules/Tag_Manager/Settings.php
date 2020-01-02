<?php
/**
 * Class Google\Site_Kit\Modules\Tag_Manager\Settings
 *
 * @package   Google\Site_Kit\Modules\Tag_Manager
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Tag_Manager;

use Google\Site_Kit\Core\Storage\Setting;
use Google\Site_Kit\Core\Storage\Setting_With_Legacy_Keys_Trait;

/**
 * Class for Tag Manager settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Settings extends Setting {
	use Setting_With_Legacy_Keys_Trait;

	const OPTION = 'googlesitekit_tagmanager_settings';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		parent::register();

		$this->add_legacy_key_migration_filters();

		add_filter(
			'option_' . self::OPTION,
			function ( $option ) {
				if ( ! is_array( $option ) ) {
					$option = $this->get_default();
				}

				// Fill in any missing keys with defaults.
				return $option + $this->get_default();
			}
		);
	}

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
	 * @return array
	 */
	public function get_default() {
		return array(
			'accountID'      => '',
			'ampContainerID' => '',
			'containerID'    => '',
		);
	}

	/**
	 * Mapping of legacy keys to current key.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	protected function get_legacy_key_map() {
		return array(
			'account_id'   => 'accountID',
			'accountId'    => 'accountID',
			'container_id' => 'containerID',
			'containerId'  => 'containerID',
		);
	}
}
