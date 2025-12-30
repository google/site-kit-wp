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
 * @since 1.128.0
 * @access private
 * @ignore
 */
class Expirables {

	/**
	 * Expirable_Items instance.
	 *
	 * @since 1.128.0
	 * @var Expirable_Items
	 */
	protected $expirable_items;

	/**
	 * REST_Expirable_Items_Controller instance.
	 *
	 * @since 1.128.0
	 * @var REST_Expirable_Items_Controller
	 */
	protected $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.128.0
	 *
	 * @param Context      $context Plugin context.
	 * @param User_Options $user_options Optional. User option API. Default is a new instance.
	 */
	public function __construct( Context $context, ?User_Options $user_options = null ) {
		$this->expirable_items = new Expirable_Items( $user_options ?: new User_Options( $context ) );
		$this->rest_controller = new REST_Expirable_Items_Controller( $this->expirable_items );
	}

	/**
	 * Gets the reference to the Expirable_Items instance.
	 *
	 * @since 1.128.0
	 *
	 * @return Expirable_Items An instance of the Expirable_Items class.
	 */
	public function get_expirable_items() {
		return $this->expirable_items;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.128.0
	 */
	public function register() {
		$this->expirable_items->register();
		$this->rest_controller->register();
	}
}
