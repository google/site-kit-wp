<?php
/**
 * Class Google\Site_Kit\Core\Prompts\Prompts
 *
 * @package   Google\Site_Kit\Core\Prompts
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Prompts;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for handling prompts.
 *
 * @since 1.121.0
 * @access private
 * @ignore
 */
class Prompts {

	/**
	 * Dismissed_Prompts instance.
	 *
	 * @since 1.121.0
	 * @var Dismissed_Prompts
	 */
	protected $dismissed_prompts;

	/**
	 * REST_Prompts_Controller instance.
	 *
	 * @since 1.121.0
	 * @var REST_Prompts_Controller
	 */
	protected $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.121.0
	 *
	 * @param Context      $context Plugin context.
	 * @param User_Options $user_options Optional. User option API. Default is a new instance.
	 */
	public function __construct( Context $context, User_Options $user_options = null ) {
		$this->dismissed_prompts = new Dismissed_Prompts( $user_options ?: new User_Options( $context ) );
		$this->rest_controller   = new REST_Prompts_Controller( $this->dismissed_prompts );
	}

	/**
	 * Gets the reference to the Dismissed_Prompts instance.
	 *
	 * @since 1.121.0
	 *
	 * @return Dismissed_Prompts An instance of the Dismissed_Prompts class.
	 */
	public function get_dismissed_prompts() {
		return $this->dismissed_prompts;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.121.0
	 */
	public function register() {
		$this->dismissed_prompts->register();
		$this->rest_controller->register();
	}

}
