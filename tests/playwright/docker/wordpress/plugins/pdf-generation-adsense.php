<?php
/**
 * Plugin Name: E2E Tests PDF Generation AdSense Plugin
 * Description: Connects AdSense so the PDF generation export includes the Monetization section. Activates the AdSense module and stores placeholder connection settings; the admin's OAuth token is provided by proxy-auth.php, so the AdSense overview widget's reports resolve against the fixtures container.
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Modules\AdSense\Settings as AdSense_Settings;

add_action(
	'init',
	function () {
		// Activate the AdSense module, preserving any other active modules.
		$active_modules = get_option( Modules::OPTION_ACTIVE_MODULES );
		$active_modules = is_array( $active_modules ) ? $active_modules : array();

		if ( ! in_array( 'adsense', $active_modules, true ) ) {
			$active_modules[] = 'adsense';
			update_option( Modules::OPTION_ACTIVE_MODULES, $active_modules );
		}

		// Store placeholder connection settings so AdSense reads as connected
		// and the Monetization section renders in the export panel. Only write
		// once, mirroring the active-modules guard above.
		$settings   = get_option( AdSense_Settings::OPTION );
		$account_id = is_array( $settings ) && isset( $settings['accountID'] )
			? $settings['accountID']
			: '';

		if ( 'pub-123456789' !== $account_id ) {
			update_option(
				AdSense_Settings::OPTION,
				array(
					'ownerID'              => 1,
					'accountID'            => 'pub-123456789',
					'clientID'             => 'ca-pub-123456789',
					'accountStatus'        => 'approved',
					'siteStatus'           => 'added',
					'accountSetupComplete' => true,
					'siteSetupComplete'    => true,
					'useSnippet'           => true,
				)
			);
		}
	}
);
