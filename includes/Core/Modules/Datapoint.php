<?php
/**
 * Class Google\Site_Kit\Core\Modules\Datapoint
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Class representing a datapoint definition.
 *
 * @since 1.77.0
 * @access private
 * @ignore
 */
class Datapoint {

	/**
	 * Service identifier.
	 *
	 * @since 1.77.0
	 * @since 1.160.0 Updated to allow a function to return the service identifier.
	 * @var string|callable
	 */
	private $service = '';

	/**
	 * Required scopes.
	 *
	 * @since 1.77.0
	 * @var string[]
	 */
	private $scopes = array();

	/**
	 * Shareable status.
	 *
	 * @since 1.77.0
	 * @var bool
	 */
	private $shareable;

	/**
	 * Request scopes message.
	 *
	 * @since 1.77.0
	 * @var string
	 */
	private $request_scopes_message;

	/**
	 * Constructor.
	 *
	 * @since 1.77.0
	 *
	 * @param array $definition Definition fields.
	 */
	public function __construct( array $definition ) {
		$this->shareable = ! empty( $definition['shareable'] );

		if (
			isset( $definition['service'] ) &&
			(
				is_string( $definition['service'] ) ||
				is_callable( $definition['service'] )
			)
		) {
			$this->service = $definition['service'];
		}

		if ( isset( $definition['scopes'] ) && is_array( $definition['scopes'] ) ) {
			$this->scopes = $definition['scopes'];
		}

		if ( isset( $definition['request_scopes_message'] ) && is_string( $definition['request_scopes_message'] ) ) {
			$this->request_scopes_message = $definition['request_scopes_message'];
		}
	}

	/**
	 * Checks if the datapoint is shareable.
	 *
	 * @since 1.77.0
	 *
	 * @return bool
	 */
	public function is_shareable() {
		return $this->shareable;
	}

	/**
	 * Gets the service identifier.
	 *
	 * @since 1.77.0
	 *
	 * @return string
	 */
	protected function get_service() {
		$service = $this->service;

		if ( is_callable( $this->service ) ) {
			$service = call_user_func( $this->service );
		}

		return $service;
	}

	/**
	 * Gets the list of required scopes.
	 *
	 * @since 1.77.0
	 *
	 * @return string[]
	 */
	public function get_required_scopes() {
		return $this->scopes;
	}

	/**
	 * Gets the request scopes message.
	 *
	 * @since 1.77.0
	 *
	 * @return string
	 */
	public function get_request_scopes_message() {
		if ( $this->request_scopes_message ) {
			return $this->request_scopes_message;
		}

		return __( 'You’ll need to grant Site Kit permission to do this.', 'google-site-kit' );
	}
}
