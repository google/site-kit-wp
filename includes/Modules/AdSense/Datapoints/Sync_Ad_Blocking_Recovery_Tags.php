<?php
/**
 * Class Google\Site_Kit\Modules\AdSense\Datapoints\Sync_Ad_Blocking_Recovery_Tags
 *
 * @package   Google\Site_Kit\Modules\AdSense\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * phpcs:disable PHPCS.Commenting.RequireDocTagDescription -- Pre-existing violations; tracked for follow-up cleanup.
 */

namespace Google\Site_Kit\Modules\AdSense\Datapoints;

use Google\Site_Kit\Modules\AdSense\Datapoints\AdSense_Datapoint;
use Google\Site_Kit\Modules\AdSense\Ad_Blocking_Recovery_Tag;
use Google\Site_Kit\Core\Modules\Executable_Datapoint;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\AdSense;
use WP_Error;
use WP_REST_Response;

/**
 * Class for the sync ad blocking recovery tags datapoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Sync_Ad_Blocking_Recovery_Tags extends AdSense_Datapoint implements Executable_Datapoint {

	/**
	 * Ad Blocking Recovery Tag instance.
	 *
	 * @since n.e.x.t
	 * @var Ad_Blocking_Recovery_Tag
	 */
	private $ad_blocking_recovery_tag;

	/**
	 * Callable to normalize account ID.
	 *
	 * @since n.e.x.t
	 * @var callable
	 */
	private $normalize_account_id;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		parent::__construct( $definition );
		if ( isset( $definition['ad_blocking_recovery_tag'] ) ) {
			$this->ad_blocking_recovery_tag = $definition['ad_blocking_recovery_tag'];
		}
		if ( isset( $definition['normalize_account_id'] ) ) {
			$this->normalize_account_id = $definition['normalize_account_id'];
		}
	}

	/**
	 * Creates a request object.
	 *
	 * @since n.e.x.t
	 *
	 * @param Data_Request $data_request Data request object.
	 * @return mixed Request object on success, or WP_Error on failure.
	 */
	public function create_request( Data_Request $data_request ) {
		$settings = $this->get_module()->get_settings()->get();
		if ( empty( $settings['accountID'] ) ) {
			return new WP_Error( 'module_not_connected', __( 'Module is not connected.', 'google-site-kit' ), array( 'status' => 500 ) );
		}

		$service = $this->get_service();
		return $service->accounts->getAdBlockingRecoveryTag( call_user_func( $this->normalize_account_id, $settings['accountID'] ) );
	}

	/**
	 * Parses a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed        $response API response.
	 * @param Data_Request $data     Data request object.
	 * @return mixed Parsed response.
	 */
	public function parse_response( $response, Data_Request $data ) {
		$this->ad_blocking_recovery_tag->set(
			array(
				'tag'                   => $response->getTag(),
				'error_protection_code' => $response->getErrorProtectionCode(),
			)
		);

		return new WP_REST_Response(
			array(
				'success' => true,
			)
		);
	}
}
