<?php
/**
 * Class Google\Site_Kit\Modules\Idea_Hub\Google_API\Activities
 *
 * @package   Google\Site_Kit\Modules\Idea_Hub\Google_API
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Idea_Hub\Google_API;

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit_Dependencies\Google\Service\Ideahub as Google_Service_Ideahub;
use Google\Site_Kit_Dependencies\Google\Service\Ideahub\GoogleSearchIdeahubV1alphaIdeaActivity as Google_Service_Ideahub_GoogleSearchIdeahubV1alphaIdeaActivity;

/**
 * Class to track idea activities.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 *
 * @property-read Authentication $authentication Authentication class instance.
 */
class Activities extends Google_API_Base {

	/**
	 * Fetches new ideas.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $params API request parameters.
	 * @return mixed API response.
	 */
	public function fetch( array $params = array() ) {
		$parent   = $this->get_parent_slug();
		$activity = new Google_Service_Ideahub_GoogleSearchIdeahubV1alphaIdeaActivity();

		$activity->setIdeas( array( $params['name'] ) );
		$activity->setTopics( array() );
		$activity->setType( $params['type'] );
		if ( ! empty( $params['uri'] ) ) {
			$activity->setUri( $params['uri'] );
		}

		try {
			$client  = $this->authentication->get_oauth_client()->get_client();
			$service = new Google_Service_Ideahub( $client );

			$service->platforms_properties_ideaActivities->create( $parent, $activity ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		} catch ( Exception $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Do nothing.
		}
	}

}
