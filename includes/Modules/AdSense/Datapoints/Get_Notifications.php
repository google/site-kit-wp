<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Datapoints\Get_Notifications
 *
 * @package   Google\Site_Kit\Modules\AdSense\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Modules\AdSense\Datapoints;

use GoogleSite_KitModulesAdSenseDatapointsAdSense_Datapoint;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit_Dependencies\Google\Service\Adsense\Alert as Google_Service_Adsense_Alert;

/**
 * Class for the notifications datapoint.
 *
 * @since 1.190.0
 * @access private
 * @ignore
 */
class Get_Notifications extends AdSense_Datapoint implements Executable_Datapoint {
	/**
	 * Account URL callable.
	 *
	 * @since 1.190.0
	 * @var callable
	 */
	private $account_url;

	/**
	 * Constructor.
	 *
	 * @since 1.190.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		if ( isset( $definition['account_url'] ) ) {
			$this->account_url = $definition['account_url'];
		}
	}
	/**
	 * Creates a request object.
	 *
	 * @since 1.190.0
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return callable A callable that returns notifications by filtering SEVERE alerts.
	 */
	public function create_request( Data_Request $data_request ) {
		$module      = $this->get_module();
		$account_url = $this->account_url;

		return function () use ( $module, $account_url ) {
			$settings = $module->get_settings()->get();

			if ( empty( $settings['accountID'] ) ) {
				return array();
			}

			$alerts = $module->get_data( 'alerts', array( 'accountID' => $settings['accountID'] ) );

			if ( is_wp_error( $alerts ) || empty( $alerts ) ) {
				return array();
			}

			$alerts = array_filter(
				$alerts,
				function ( Google_Service_Adsense_Alert $alert ) {
					return 'SEVERE' === $alert->getSeverity();
				}
			);

			// There is no SEVERE alert, return empty.
			if ( empty( $alerts ) ) {
				return array();
			}

			$notifications = array_map(
				function ( Google_Service_Adsense_Alert $alert ) use ( $account_url ) {
					$url = $account_url;
					if ( is_callable( $url ) ) {
						$url = $url();
					}

					return array(
						'id'            => 'adsense::' . $alert->getName(),
						'description'   => $alert->getMessage(),
						'isDismissible' => true,
						'severity'      => 'win-info',
						'ctaURL'        => $url,
						'ctaLabel'      => __( 'Go to AdSense', 'google-site-kit' ),
						'ctaTarget'     => '_blank',
					);
				},
				$alerts
			);

			return array_values( $notifications );
		};
	}

	/**
	 * Parses a response.
	 *
	 * @since 1.190.0
	 *
	 * @param mixed        $response Callable that returns notifications array.
	 * @param Data_Request $data     Data request object.
	 * @return mixed Parsed response.
	 */
	public function parse_response( $response, Data_Request $data ) {
		// Response is a callable for this datapoint.
		if ( is_callable( $response ) ) {
			return $response();
		}
		return $response;
	}
}
