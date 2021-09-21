<?php
/**
 * Class Google\Site_Kit\Modules\Idea_Hub\Google_API\Saved_Ideas
 *
 * @package   Google\Site_Kit\Modules\Idea_Hub\Google_API
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Idea_Hub\Google_API;

/**
 * Class to pull saved ideas.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Saved_Ideas extends Ideas {

	/**
	 * Fetches saved ideas.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $params API request parameters.
	 * @return mixed API response.
	 */
	public function fetch( array $params = array() ) {
		return $this->fetch_ideas( 'saved' );
	}

}
