<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Settings
 *
 * @package   Google\Site_Kit\Modules\AdSense
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\AdSense;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Storage\Setting_With_Legacy_Keys_Trait;

/**
 * Class for AdSense settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Settings extends Module_Settings {
	use Setting_With_Legacy_Keys_Trait;

	const OPTION = 'googlesitekit_adsense_settings';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		parent::register();

		$this->register_legacy_keys_migration(
			array(
				'account_id'        => 'accountID',
				'adsenseTagEnabled' => 'useSnippet',
				'setup_complete'    => 'setupComplete',
			)
		);

		add_filter(
			'option_' . self::OPTION,
			function ( $option ) {
				/**
				 * Filters the AdSense account ID to use.
				 *
				 * @since 1.0.0
				 *
				 * @param string $account_id Empty by default, will fall back to the option value if not set.
				 */
				$account_id = apply_filters( 'googlesitekit_adsense_account_id', '' );

				if ( $account_id ) {
					$option['accountID'] = $account_id;
				}

				return $option;
			}
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
			'accountID'     => '',
			'accountStatus' => '',
			'clientID'      => '',
			'setupComplete' => false,
			'useSnippet'    => true,
		);
	}
}
