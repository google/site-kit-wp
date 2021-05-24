<?php
/**
 * Class Google\Site_Kit\Modules\Idea_Hub\Settings
 *
 * @package   Google\Site_Kit\Modules\Idea_Hub
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Idea_Hub;

use Google\Site_Kit\Core\Modules\Module_Settings;

/**
 * Class for Idea Hub settings.
 *
 * @since 1.32.0
 * @access private
 * @ignore
 */
class Settings extends Module_Settings {

	const OPTION = 'googlesitekit_idea-hub_settings';

	/**
	 * Gets the default value.
	 *
	 * @since 1.32.0
	 *
	 * @return array
	 */
	protected function get_default() {
		return array(
			'ideaLocale' => '',
		);
	}
}
