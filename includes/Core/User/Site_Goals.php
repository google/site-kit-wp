<?php
/**
 * Class Google\Site_Kit\Core\User\Site_Goals
 *
 * @package   Google\Site_Kit\Core\User
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User;

use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for handling per-user Site Goals settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Site_Goals {

	/**
	 * Site_Goals_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Site_Goals_Settings
	 */
	private $site_goals_settings;

	/**
	 * REST_Site_Goals_Settings_Controller instance.
	 *
	 * @since n.e.x.t
	 * @var REST_Site_Goals_Settings_Controller
	 */
	private $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param User_Options $user_options User_Options instance.
	 */
	public function __construct( User_Options $user_options ) {
		$this->site_goals_settings = new Site_Goals_Settings( $user_options );
		$this->rest_controller     = new REST_Site_Goals_Settings_Controller( $this->site_goals_settings );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->site_goals_settings->register();
		$this->rest_controller->register();
	}
}
