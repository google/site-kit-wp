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

use Google\Site_Kit\Core\Storage\Setting;
use Google\Site_Kit\Core\Util\Migrate_Legacy_Keys;

/**
 * Class for AdSense settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Settings extends Setting {
	use Migrate_Legacy_Keys;

	const OPTION = 'googlesitekit_adsense_settings';

	/**
	 * Mapping of legacy keys to current key.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	protected $legacy_key_map = array(
		'account_id'        => 'accountID',
		'adsenseTagEnabled' => 'useSnippet',
		'setup_complete'    => 'setupComplete',
	);

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		register_setting(
			self::OPTION,
			self::OPTION,
			array(
				'type'              => 'object',
				'sanitize_callback' => $this->get_sanitize_callback(),
				'default'           => $this->get_default(),
			)
		);

		add_filter(
			'option_' . self::OPTION,
			function ( $option ) {
				if ( ! is_array( $option ) ) {
					$option = $this->get_default();
				} else {
					$option = $this->migrate_legacy_keys( $option );
				}

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

				// Fill in any missing keys with defaults.
				return $option + $this->get_default();
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
	public function get_default() {
		return array(
			'accountID'     => '',
			'accountStatus' => '',
			'clientID'      => '',
			'setupComplete' => false,
			'useSnippet'    => true,
		);
	}
}
