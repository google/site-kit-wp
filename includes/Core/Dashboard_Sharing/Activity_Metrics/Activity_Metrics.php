<?php
/**
 * Class Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics\Activity_Metrics
 *
 * @package   Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for handling active consumers.
 *
 * @since 1.82.0
 * @access private
 * @ignore
 */
class Activity_Metrics {

	/**
	 * Active_Consumers instance.
	 *
	 * @since 1.82.0
	 * @var Active_Consumers
	 */
	protected $active_consumers;

	/**
	 * Constructor.
	 *
	 * @since 1.82.0
	 *
	 * @param Context      $context Plugin context.
	 * @param User_Options $user_options Optional. User option API. Default is a new instance.
	 */
	public function __construct( Context $context, User_Options $user_options = null ) {
		$this->active_consumers = new Active_Consumers( $user_options ?: new User_Options( $context ) );
	}

	/**
	 * Registers functionality.
	 *
	 * @since 1.82.0
	 */
	public function register() {
		$this->active_consumers->register();
	}

	/**
	 * Get active consumers for refresh token.
	 *
	 * @since 1.87.0
	 *
	 * @return array Array of active consumers formatted for refresh token.
	 */
	public function get_for_refresh_token() {
		$active_consumers = $this->active_consumers->get();

		if ( empty( $active_consumers ) ) {
			return array();
		}

		$formatted_consumers = array();

		foreach ( $active_consumers as $id => $roles ) {
			$formatted_consumers[] = $id . ':' . implode( ',', $roles );
		}

		return array(
			'active_consumers' => implode( ' ', $formatted_consumers ),
		);
	}
}
