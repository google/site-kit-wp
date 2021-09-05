<?php
/**
 * Class Google\Site_Kit\Modules\Idea_Hub\Google_API\Idea_State
 *
 * @package   Google\Site_Kit\Modules\Idea_Hub\Google_API
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Idea_Hub\Google_API;

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit_Dependencies\Google\Service\Ideahub as Google_Service_Ideahub;
use Google\Site_Kit_Dependencies\Google\Service\Ideahub\GoogleSearchIdeahubV1alphaIdeaState as Google_Service_Ideahub_GoogleSearchIdeahubV1alphaIdeaState;
use WP_Error;

/**
 * Class to manipulate idea state.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 *
 * @property-read Authentication $authentication Authentication class instance.
 */
class Idea_State extends Google_API_Base {

	/**
	 * Validates request data, returns WP_Error instance if data is invalid.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data Request data.
	 * @return WP_Error|null NULL if request data is valid, otherwise an instance of WP_Error class.
	 */
	public function validate_request_data( Data_Request $data ) {
		if ( ! isset( $data['name'] ) ) {
			return new WP_Error(
				'missing_required_param',
				/* translators: %s: Missing parameter name */
				sprintf( __( 'Request parameter is empty: %s.', 'google-site-kit' ), 'name' ),
				array( 'status' => 400 )
			);
		}

		if ( ! isset( $data['saved'] ) && ! isset( $data['dismissed'] ) ) {
			return new WP_Error(
				'missing_required_param',
				__( 'Either "saved" or "dismissed" parameter must be provided.', 'google-site-kit' ),
				array( 'status' => 400 )
			);
		}

		return null;
	}

	/**
	 * Parses request data and returns prepared arguments for the Google API call.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data Request data.
	 * @return array Arguments for the Google API call.
	 */
	public function parse_request_data( Data_Request $data ) {
		$params = array(
			'name' => $data['name'],
		);

		if ( isset( $data['saved'] ) ) {
			$params['saved'] = $data['saved'];
		}

		if ( isset( $data['dismissed'] ) ) {
			$params['dismissed'] = $data['dismissed'];
		}

		return $params;
	}

	/**
	 * Updates the idea state.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $params API request parameters.
	 * @return mixed API response.
	 */
	public function fetch( array $params = array() ) {
		$idea_name       = $params['name'];
		$idea_name_parts = explode( '/', $params['name'] );

		$parent = $this->get_parent_slug();
		$parent = sprintf(
			'%s/ideaStates/%s',
			untrailingslashit( $parent ),
			array_pop( $idea_name_parts )
		);

		$update_mask = array();

		$body = new Google_Service_Ideahub_GoogleSearchIdeahubV1alphaIdeaState();
		$body->setName( $idea_name );

		if ( isset( $params['saved'] ) ) {
			$body->setSaved( filter_var( $params['saved'], FILTER_VALIDATE_BOOLEAN ) );
			$update_mask[] = 'saved';
		}

		if ( isset( $params['dismissed'] ) ) {
			$body->setDismissed( filter_var( $params['dismissed'], FILTER_VALIDATE_BOOLEAN ) );
			$update_mask[] = 'dismissed';
		}

		$client  = $this->authentication->get_oauth_client()->get_client();
		$service = new Google_Service_Ideahub( $client );

		return $service->platforms_properties_ideaStates->patch( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$parent,
			$body,
			array(
				'updateMask' => implode( ',', $update_mask ),
			)
		);
	}

}
