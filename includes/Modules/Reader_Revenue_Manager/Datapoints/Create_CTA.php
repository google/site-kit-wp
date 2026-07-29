<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\Create_CTA
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints;

use Google\Site_Kit\Core\Modules\Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Cta;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\NewsletterConfig;

/**
 * Class for the CTA creation datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Create_CTA extends Datapoint implements Executable_Datapoint {

	/**
	 * Newsletter sign-up CTA type. This is the only type the API currently supports.
	 */
	const TYPE_NEWSLETTER_SIGNUP = 'NEWSLETTER_SIGNUP';

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object.
	 * @throws Missing_Required_Param_Exception Thrown if a required parameter is missing.
	 */
	public function create_request( Data_Request $data_request ) {
		foreach ( array( 'organizationID', 'publicationID', 'newsletterConfig' ) as $required_param ) {
			if ( empty( $data_request[ $required_param ] ) ) {
				throw new Missing_Required_Param_Exception( $required_param );
			}
		}

		$parent = sprintf(
			'organizations/%s/publications/%s',
			$data_request['organizationID'],
			$data_request['publicationID']
		);

		$cta = new Cta();
		$cta->setType( self::TYPE_NEWSLETTER_SIGNUP );
		$cta->setNewsletterConfig( new NewsletterConfig( $data_request['newsletterConfig'] ) );

		if ( ! empty( $data_request['displayName'] ) ) {
			$cta->setDisplayName( $data_request['displayName'] );
		}

		return $this->get_service()->organizations_publications_ctas->create( $parent, $cta );
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response Created CTA resource.
	 * @param Data_Request $data     Data request object.
	 * @return mixed The created CTA resource.
	 */
	public function parse_response( $response, Data_Request $data ) {
		return $response;
	}
}
