<?php
/**
 * Class Google\Site_Kit\Core\User\Proactive_User_Engagement
 *
 * @package   Google\Site_Kit\Core\User
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User;

use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for handling proactive user engagement settings rest routes.
 *
 * @since 1.162.0
 * @access private
 * @ignore
 */
class Proactive_User_Engagement {

	/**
	 * Proactive_User_Engagement_Settings instance.
	 *
	 * @since 1.162.0
	 * @var Proactive_User_Engagement_Settings
	 */
	private $proactive_user_engagement_settings;

	/**
	 * REST_Proactive_User_Engagement_Controller instance.
	 *
	 * @since 1.162.0
	 * @var REST_Proactive_User_Engagement_Controller
	 */
	private $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.162.0
	 *
	 * @param User_Options $user_options User_Options instance.
	 */
	public function __construct( User_Options $user_options ) {
		$this->proactive_user_engagement_settings = new Proactive_User_Engagement_Settings( $user_options );
		$this->rest_controller                    = new REST_Proactive_User_Engagement_Controller( $this->proactive_user_engagement_settings );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.162.0
	 */
	public function register() {
		$this->proactive_user_engagement_settings->register();
		$this->rest_controller->register();
	}
}
