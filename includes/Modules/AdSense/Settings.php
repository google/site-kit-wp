<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Settings
 *
 * @package   Google\Site_Kit\Modules\AdSense
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\AdSense;

use Google\Site_Kit\Core\Modules\Module_Settings;
use Google\Site_Kit\Core\Storage\Setting_With_Legacy_Keys_Trait;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Interface;
use Google\Site_Kit\Core\Storage\Setting_With_Owned_Keys_Trait;
use Google\Site_Kit\Core\Util\Feature_Flags;

/**
 * Class for AdSense settings.
 *
 * @since 1.2.0
 * @access private
 * @ignore
 */
class Settings extends Module_Settings implements Setting_With_Owned_Keys_Interface {
	use Setting_With_Legacy_Keys_Trait, Setting_With_Owned_Keys_Trait;

	const OPTION = 'googlesitekit_adsense_settings';

	/**
	 * Various ad blocking recovery setup statuses.
	 */
	const AD_BLOCKING_RECOVERY_SETUP_STATUS_TAG_PLACED      = 'tag-placed';
	const AD_BLOCKING_RECOVERY_SETUP_STATUS_SETUP_CONFIRMED = 'setup-confirmed';

	/**
	 * Legacy account statuses to be migrated on-the-fly.
	 *
	 * @since 1.9.0
	 * @var array
	 */
	protected $legacy_account_statuses = array(
		'account-connected'             => array(
			'accountStatus' => 'approved',
			'siteStatus'    => 'added',
		),
		'account-connected-nonmatching' => array(
			'accountStatus' => 'approved',
			'siteStatus'    => 'added',
		),
		'account-connected-no-data'     => array(
			'accountStatus' => 'approved',
			'siteStatus'    => 'added',
		),
		'account-pending-review'        => array(
			'accountStatus' => 'approved',
			'siteStatus'    => 'none',
		),
		'account-required-action'       => array(
			'accountStatus' => 'no-client',
		),
		'disapproved-account-afc'       => array(
			'accountStatus' => 'no-client',
		),
		'ads-display-pending'           => array(
			'accountStatus' => 'pending',
		),
		'disapproved-account'           => array(
			'accountStatus' => 'disapproved',
		),
		'no-account'                    => array(
			'accountStatus' => 'none',
		),
		'no-account-tag-found'          => array(
			'accountStatus' => 'none',
		),
	);

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.2.0
	 */
	public function register() {
		parent::register();

		$this->register_legacy_keys_migration(
			array(
				'account_id'        => 'accountID',
				'accountId'         => 'accountID',
				'account_status'    => 'accountStatus',
				'adsenseTagEnabled' => 'useSnippet',
				'client_id'         => 'clientID',
				'clientId'          => 'clientID',
				'setup_complete'    => 'setupComplete',
			)
		);

		$this->register_owned_keys();

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

				// Migrate legacy account statuses (now split into account status and site status).
				if ( ! empty( $option['accountStatus'] ) && isset( $this->legacy_account_statuses[ $option['accountStatus'] ] ) ) {
					foreach ( $this->legacy_account_statuses[ $option['accountStatus'] ] as $key => $value ) {
						$option[ $key ] = $value;
					}
				}

				// Migration of legacy setting.
				if ( ! empty( $option['setupComplete'] ) ) {
					$option['accountSetupComplete'] = $option['setupComplete'];
					$option['siteSetupComplete']    = $option['setupComplete'];
				}
				unset( $option['setupComplete'] );

				return $option;
			}
		);

		add_filter(
			'pre_update_option_' . self::OPTION,
			function ( $value, $old_value ) {
				if ( isset( $old_value['setupCompletedTimestamp'] ) ) {
					return $value;
				}

				if ( ! empty( $old_value['accountStatus'] ) && ! empty( $old_value['siteStatus'] ) && 'ready' === $old_value['accountStatus'] && 'ready' === $old_value['siteStatus'] ) {
					$value['setupCompletedTimestamp'] = strtotime( '-1 month' );
				} elseif ( ! empty( $value['accountStatus'] ) && ! empty( $value['siteStatus'] ) && 'ready' === $value['accountStatus'] && 'ready' === $value['siteStatus'] ) {
					$value['setupCompletedTimestamp'] = time();
				}

				return $value;
			},
			10,
			2
		);
	}

	/**
	 * Returns keys for owned settings.
	 *
	 * @since 1.16.0
	 *
	 * @return array An array of keys for owned settings.
	 */
	public function get_owned_keys() {
		return array(
			'accountID',
			'clientID',
		);
	}

	/**
	 * Gets the default value.
	 *
	 * @since 1.2.0
	 * @since 1.102.0 Added settings for the Ad Blocking Recovery feature.
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			'ownerID'                           => 0,
			'accountID'                         => '',
			'autoAdsDisabled'                   => array(),
			'clientID'                          => '',
			'accountStatus'                     => '',
			'siteStatus'                        => '',
			'accountSetupComplete'              => false,
			'siteSetupComplete'                 => false,
			'useSnippet'                        => true,
			'webStoriesAdUnit'                  => '',
			'setupCompletedTimestamp'           => null,
			'useAdBlockingRecoverySnippet'      => false,
			'useAdBlockingRecoveryErrorSnippet' => false,
			'adBlockingRecoverySetupStatus'     => '',
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
				if ( isset( $option['accountSetupComplete'] ) ) {
					$option['accountSetupComplete'] = (bool) $option['accountSetupComplete'];
				}
				if ( isset( $option['siteStatusComplete'] ) ) {
					$option['siteStatusComplete'] = (bool) $option['siteStatusComplete'];
				}
				if ( isset( $option['useSnippet'] ) ) {
					$option['useSnippet'] = (bool) $option['useSnippet'];
				}
				if ( isset( $option['autoAdsDisabled'] ) ) {
					$option['autoAdsDisabled'] = (array) $option['autoAdsDisabled'];
				}

				if ( isset( $option['useAdBlockingRecoverySnippet'] ) ) {
					$option['useAdBlockingRecoverySnippet'] = (bool) $option['useAdBlockingRecoverySnippet'];
				}
				if ( isset( $option['useAdBlockingRecoveryErrorSnippet'] ) ) {
					$option['useAdBlockingRecoveryErrorSnippet'] = (bool) $option['useAdBlockingRecoveryErrorSnippet'];
				}
				if (
						isset( $option['adBlockingRecoverySetupStatus'] ) &&
						! in_array(
							$option['adBlockingRecoverySetupStatus'],
							array(
								'',
								self::AD_BLOCKING_RECOVERY_SETUP_STATUS_TAG_PLACED,
								self::AD_BLOCKING_RECOVERY_SETUP_STATUS_SETUP_CONFIRMED,
							),
							true
						)
					) {
					$option['adBlockingRecoverySetupStatus'] = $this->get()['adBlockingRecoverySetupStatus'];
				}
			}
			return $option;
		};
	}
}
