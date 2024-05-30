<?php
/**
 * Class Google\Site_Kit\Core\Consent_Mode\Regions
 *
 * @package   Google\Site_Kit\Core\Consent_Mode
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Consent_Mode;

use Google\Site_Kit\Core\Util\Feature_Flags;

/**
 * Class containing Consent Mode Regions.
 *
 * @since 1.122.0
 * @access private
 * @ignore
 */
class Regions {

	/**
	 * List of countries that Google's EU user consent policy applies to, which are the
	 * countries in the European Economic Area (EEA) plus the UK.
	 */
	const EU_USER_CONSENT_POLICY = array(
		'AT',
		'BE',
		'BG',
		'CY',
		'CZ',
		'DE',
		'DK',
		'EE',
		'ES',
		'FI',
		'FR',
		'GB',
		'GR',
		'HR',
		'HU',
		'IE',
		'IS',
		'IT',
		'LI',
		'LT',
		'LU',
		'LV',
		'MT',
		'NL',
		'NO',
		'PL',
		'PT',
		'RO',
		'SE',
		'SI',
		'SK',
	);

	/**
	 * Returns the list of regions that Google's EU user consent policy applies to.
	 *
	 * @since 1.128.0
	 *
	 * @return array<string> List of regions.
	 */
	public static function get_regions() {
		// Include Switzerland (CH) in the consent mode regions if the current date
		// is on or after 31 July 2024.
		if (
			time() >= strtotime( '2024-07-31' ) ||
			Feature_Flags::enabled( 'consentModeSwitzerland' )
		) {
			return array_merge( self::EU_USER_CONSENT_POLICY, array( 'CH' ) );
		}

		return self::EU_USER_CONSENT_POLICY;
	}
}
