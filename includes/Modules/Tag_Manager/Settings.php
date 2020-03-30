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

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Storage\Setting_With_Legacy_Keys_Trait;

/**
 * Class for Tag Manager settings.
 *
 * @since 1.2.0
 * @access private
 * @ignore
 */
class Settings extends Module_Settings {
	use Setting_With_Legacy_Keys_Trait;

	const OPTION = 'googlesitekit_tagmanager_settings';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.2.0
	 */
	public function register() {
		parent::register();

		$this->register_legacy_keys_migration(
			array(
				'account_id'   => 'accountID',
				'accountId'    => 'accountID',
				'container_id' => 'containerID',
				'containerId'  => 'containerID',
			)
		);
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.2.0
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			'accountID'      => '',
			'ampContainerID' => '',
			'containerID'    => '',
			'useSnippet'     => true,
		);
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since 1.6.0
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
