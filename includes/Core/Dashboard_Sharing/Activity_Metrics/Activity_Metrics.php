<?php
/**
 * Class Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics
 *
 * @package   Google\Site_Kit\Core\Dashboard_Sharing
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Dashboard_Sharing;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for handling active consumers.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Activity_Metrics {

	/**
	 * Active_Consumers instance.
	 *
	 * @since n.e.x.t
	 * @var Active_Consumers
	 */
	protected $active_consumers;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context      $context Plugin context.
	 * @param User_Options $user_options Optional. User option API. Default is a new instance.
	 */
	public function __construct( Context $context, User_Options $user_options = null ) {
		$this->active_consumers = new Active_Consumers( $user_options ?: new User_Options( $context ) );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->active_consumers->register();
	}

}
