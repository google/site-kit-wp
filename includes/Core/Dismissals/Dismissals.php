<?php
/**
 * Class Google\Site_Kit\Core\Dismissals\Dismissals
 *
 * @package   Google\Site_Kit\Core\Dismissals
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Dismissals;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for handling dismissals.
 *
 * @since 1.37.0
 * @access private
 * @ignore
 */
class Dismissals {

	/**
	 * Dismissed_Items instance.
	 *
	 * @since 1.37.0
	 * @var Dismissed_Items
	 */
	protected $dismissed_items;

	/**
	 * REST_Dismissals_Controller instance.
	 *
	 * @since 1.37.0
	 * @var REST_Dismissals_Controller
	 */
	protected $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.37.0
	 *
	 * @param Context      $context Plugin context.
	 * @param User_Options $user_options Optional. User option API. Default is a new instance.
	 */
	public function __construct( Context $context, User_Options $user_options = null ) {
		$this->dismissed_items = new Dismissed_Items( $user_options ?: new User_Options( $context ) );
		$this->rest_controller = new REST_Dismissals_Controller( $this->dismissed_items );
	}

	/**
	 * Gets the reference to the Dismissed_Items instance.
	 *
	 * @since 1.69.0
	 *
	 * @return Dismissed_Items An instance of the Dismissed_Items class.
	 */
	public function get_dismissed_items() {
		return $this->dismissed_items;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.37.0
	 */
	public function register() {
		$this->dismissed_items->register();
		$this->rest_controller->register();
	}
}
