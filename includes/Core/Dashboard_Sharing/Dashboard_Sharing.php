<?php
/**
 * Class Google\Site_Kit\Core\Dashboard_Sharing\Dashboard_Sharing
 *
 * @package   Google\Site_Kit\Core\Dashboard_Sharing
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Dashboard_Sharing;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Dashboard_Sharing\Activity_Metrics\Activity_Metrics;

/**
 * Class for handling Dashboard Sharing.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Dashboard_Sharing {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * User_Options object.
	 *
	 * @since n.e.x.t
	 *
	 * @var User_Options
	 */
	private $user_options = null;

	/**
	 * Activity_Metrics instance.
	 *
	 * @since n.e.x.t
	 * @var Activity_Metrics
	 */
	protected $activity_metrics;

	/**
	 * View_Only_Pointer instance.
	 *
	 * @since n.e.x.t
	 * @var View_Only_Pointer
	 */
	protected $view_only_pointer;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context      $context      Plugin context.
	 * @param User_Options $user_options Optional. User Option API instance. Default is a new instance.
	 */
	public function __construct( Context $context, User_Options $user_options = null ) {
		$this->context           = $context;
		$this->user_options      = $user_options ?: new User_Options( $this->context );
		$this->activity_metrics  = new Activity_Metrics( $this->context, $this->user_options );
		$this->view_only_pointer = new View_Only_Pointer();
	}

	/**
	 * Registers functionality.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->activity_metrics->register();
		$this->view_only_pointer->register();
	}

}
