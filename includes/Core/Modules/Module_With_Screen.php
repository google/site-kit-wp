<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Module_With_Screen
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Core\Admin\Screen;

/**
 * Interface for a module that includes a screen.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
interface Module_With_Screen {

	/**
	 * Gets the screen instance to add for the module.
	 *
	 * @since 1.0.0
	 *
	 * @return Screen Screen instance.
	 */
	public function get_screen();
}
