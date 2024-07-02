<?php
/**
 * Class Google\Site_Kit\Core\User_Surveys\User_Surveys
 *
 * @package   Google\Site_Kit\Core\User_Surveys
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Surveys;

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for handling user surveys.
 *
 * @since 1.73.0
 * @access private
 * @ignore
 */
class User_Surveys {

	/**
	 * Survey_Timeouts instance.
	 *
	 * @since 1.73.0
	 * @var Survey_Timeouts
	 */
	protected $survey_timeouts;

	/**
	 * REST_User_Surveys_Controller instance.
	 *
	 * @since 1.73.0
	 * @var REST_User_Surveys_Controller
	 */
	protected $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.73.0
	 *
	 * @param Authentication $authentication Authentication instance.
	 * @param User_Options   $user_options   User option API.
	 * @param Survey_Queue   $survey_queue   Optional. Survey_Queue instance. Default a new instance.
	 */
	public function __construct(
		Authentication $authentication,
		User_Options $user_options,
		Survey_Queue $survey_queue
	) {
		$this->survey_timeouts = new Survey_Timeouts( $user_options );
		$this->rest_controller = new REST_User_Surveys_Controller(
			$authentication,
			$this->survey_timeouts,
			$survey_queue ?: new Survey_Queue( $user_options )
		);
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.73.0
	 */
	public function register() {
		$this->survey_timeouts->register();
		$this->rest_controller->register();
	}
}
