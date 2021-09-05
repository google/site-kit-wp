<?php
/**
 * Class Google\Site_Kit\Modules\Idea_Hub\Google_API\Ideas
 *
 * @package   Google\Site_Kit\Modules\Idea_Hub\Google_API
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Idea_Hub\Google_API;

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit_Dependencies\Google\Service\Ideahub as Google_Service_Ideahub;

/**
 * Base class for ideas API.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 *
 * @property-read Authentication $authentication Authentication class instance.
 */
abstract class Ideas extends Google_API_Base {

	/**
	 * Fetches ideas from the Idea Hub API.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $type Ideas type. Valid values "saved", "new" or an empty string which means all ideas.
	 * @return mixed List ideas request.
	 */
	protected function fetch_ideas( $type ) {
		$parent = $this->get_parent_slug();
		$params = array(
			'pageSize' => 100,
		);

		if ( 'saved' === $type ) {
			$params['filter'] = 'saved(true)';
		} elseif ( 'new' === $type ) {
			$params['filter'] = 'saved(false)';
		}

		$client  = $this->authentication->get_oauth_client()->get_client();
		$service = new Google_Service_Ideahub( $client );

		return $service->platforms_properties_ideas->listPlatformsPropertiesIdeas( $parent, $params );
	}

}
