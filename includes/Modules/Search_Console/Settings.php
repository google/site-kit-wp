<?php
/**
 * Class Google\Site_Kit\Modules\Search_Console\Settings
 *
 * @package   Google\Site_Kit\Modules\Search_Console
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Search_Console;

use Google\Site_Kit\Core\Modules\Module_Settings;

/**
 * Class for Search Console settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Settings extends Module_Settings {

	const OPTION = 'googlesitekit_search-console_settings';

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			// Backwards compatibility with previous dedicated option.
			'propertyID' => $this->options->get( 'googlesitekit_search_console_property' ) ?: '',
		);
	}
}
