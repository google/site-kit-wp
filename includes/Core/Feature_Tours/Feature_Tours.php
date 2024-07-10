<?php
/**
 * Class Google\Site_Kit\Core\Feature_Tours\Feature_Tours
 *
 * @package   Google\Site_Kit\Core\Feature_Tours
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Feature_Tours;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for handling feature tours.
 *
 * @since 1.27.0
 * @access private
 * @ignore
 */
class Feature_Tours {

	/**
	 * Dismissed_Tours instance.
	 *
	 * @since 1.27.0
	 * @var Dismissed_Tours
	 */
	protected $dismissed_tours;

	/**
	 * REST_Feature_Tours_Controller instance.
	 *
	 * @since 1.27.0
	 * @var REST_Feature_Tours_Controller
	 */
	protected $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.27.0
	 *
	 * @param Context      $context Plugin context.
	 * @param User_Options $user_options Optional. User option API. Default is a new instance.
	 */
	public function __construct( Context $context, User_Options $user_options = null ) {
		$this->dismissed_tours = new Dismissed_Tours( $user_options ?: new User_Options( $context ) );
		$this->rest_controller = new REST_Feature_Tours_Controller( $this->dismissed_tours );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.27.0
	 */
	public function register() {
		$this->dismissed_tours->register();
		$this->rest_controller->register();
	}
}
