<?php
/**
 * Class Google\Site_Kit\Modules\PageSpeed_Insights\Settings
 *
 * @package   Google\Site_Kit\Modules\PageSpeed_Insights
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\PageSpeed_Insights;

use Google\Site_Kit\Core\Modules\Module_Settings;

/**
 * Class for PageSpeed Insights settings.
 *
 * @since 1.49.0
 * @access private
 * @ignore
 */
class Settings extends Module_Settings {

	const OPTION = 'googlesitekit_pagespeed-insights_settings';

	/**
	 * Gets the default value.
	 *
	 * @since 1.49.0
	 *
	 * @return array
	 */
	protected function get_default() {
		return array( 'ownerID' => 0 );
	}
}
