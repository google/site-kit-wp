<?php
/**
 * Class Google\Site_Kit\Core\User_Surveys\User_Surveys
 *
 * @package   Google\Site_Kit\Core\User_Surveys
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Surveys;

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for handling user surveys.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class User_Surveys {

	/**
	 * Survey_Timeouts instance.
	 *
	 * @since n.e.x.t
	 * @var Survey_Timeouts
	 */
	protected $survey_timeouts;

	/**
	 * REST_User_Surveys_Controller instance.
	 *
	 * @since n.e.x.t
	 * @var REST_User_Surveys_Controller
	 */
	protected $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Authentication $authentication Authentication instance.
	 * @param User_Options   $user_options   User option API.
	 */
	public function __construct( Authentication $authentication, User_Options $user_options ) {
		$this->survey_timeouts = new Survey_Timeouts( $user_options );
		$this->rest_controller = new REST_User_Surveys_Controller( $authentication, $this->survey_timeouts );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->survey_timeouts->register();
		$this->rest_controller->register();
	}

}
