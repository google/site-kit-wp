<?php
/**
 * Class Google\Site_Kit\Modules\Idea_Hub\Idea_Interaction_Count
 *
 * @package   Google\Site_Kit\Modules\Idea_Hub
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Idea_Hub;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Class for Idea Hub iteraction tracking.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Idea_Interaction_Count extends User_Setting {

	const OPTION = 'googlesitekit_idea-hub_interaction_count';

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'integer';
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return mixed The default value.
	 */
	protected function get_default() {
		return 0;
	}

}
