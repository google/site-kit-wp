<?php
/**
 * Class Google\Site_Kit\Core\Expirables\Expirables
 *
 * @package   Google\Site_Kit\Core\Expirables
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Expirables;

use Google\Site_Kit\Core\Expirables\Expirable_Items;
use Google\Site_Kit\Core\Expirables\REST_Expirable_Items_Controller;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for handling expirables.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Expirables {

	/**
	 * Expirable_Items instance.
	 *
	 * @since n.e.x.t
	 * @var Expirable_Items
	 */
	protected $expirable_items;

	/**
	 * REST_Expirable_Items_Controller instance.
	 *
	 * @since n.e.x.t
	 * @var REST_Expirable_Items_Controller
	 */
	protected $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context      $context Plugin context.
	 * @param User_Options $user_options Optional. User option API. Default is a new instance.
	 */
	public function __construct( Context $context, User_Options $user_options = null ) {
		$this->expirable_items = new Expirable_Items( $user_options ?: new User_Options( $context ) );
		$this->rest_controller = new REST_Expirable_Items_Controller( $this->expirable_items );
	}

	/**
	 * Gets the reference to the Expirable_Items instance.
	 *
	 * @since n.e.x.t
	 *
	 * @return Expirable_Items An instance of the Expirable_Items class.
	 */
	public function get_expirable_items() {
		return $this->expirable_items;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->expirable_items->register();
		$this->rest_controller->register();
	}
}
