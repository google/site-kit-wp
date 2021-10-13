<?php
/**
 * Class Google\Site_Kit\Modules\Subscribe_With_Google\Post_Access
 *
 * @package   Google\Site_Kit\Modules\Subscribe_With_Google
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Subscribe_With_Google;

use Google\Site_Kit\Core\Storage\Post_Meta_Setting;

/**
 * Class for Subscribe with Google access setting.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Post_Access extends Post_Meta_Setting {

	const META_KEY = 'googlesitekitpersistent_access';

	/**
	 * Shows this postmeta setting in REST responses.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool
	 */
	protected function get_show_in_rest() {
		return true;
	}

}
