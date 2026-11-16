<?php
/**
 * Trait Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Publication_Params_Trait
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;

/**
 * Trait for datapoints that act on the publication named by the request.
 *
 * Classes using this trait must have a `$settings` property holding the
 * Reader Revenue Manager settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Publication_Params_Trait {

	/**
	 * Gets the publication identifiers from the request.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return array Organization ID and publication ID, keyed by parameter name.
	 * @throws Missing_Required_Param_Exception Thrown if either parameter is missing or empty.
	 */
	protected function get_publication_params( Data_Request $data_request ) {
		if ( empty( $data_request['organizationID'] ) || ! is_string( $data_request['organizationID'] ) ) {
			throw new Missing_Required_Param_Exception( 'organizationID' );
		}

		if ( empty( $data_request['publicationID'] ) || ! is_string( $data_request['publicationID'] ) ) {
			throw new Missing_Required_Param_Exception( 'publicationID' );
		}

		return array(
			'organizationID' => $data_request['organizationID'],
			'publicationID'  => $data_request['publicationID'],
		);
	}

	/**
	 * Gets the resource name of the publication named by the request.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return string Publication resource name.
	 * @throws Missing_Required_Param_Exception Thrown if either parameter is missing or empty.
	 */
	protected function get_publication_name( Data_Request $data_request ) {
		$params = $this->get_publication_params( $data_request );

		return sprintf(
			'organizations/%s/publications/%s',
			$params['organizationID'],
			$params['publicationID']
		);
	}

	/**
	 * Checks whether the request names the publication saved in the settings.
	 *
	 * Only a response for the saved publication may update the settings.
	 * Settings saved before express setup have no organization ID, so the
	 * organization is only compared when one is saved.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return bool True if the request is for the saved publication, false otherwise.
	 */
	protected function is_saved_publication( Data_Request $data_request ) {
		$settings = $this->settings->get();

		if ( empty( $settings['publicationID'] ) || $data_request['publicationID'] !== $settings['publicationID'] ) {
			return false;
		}

		return empty( $settings['organizationID'] ) || $data_request['organizationID'] === $settings['organizationID'];
	}
}
