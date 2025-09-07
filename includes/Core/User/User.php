<?php
/**
 * Class Google\Site_Kit\Core\User\User
 *
 * @package   Google\Site_Kit\Core\User
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User;

use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Feature_Flags;

/**
 * Class for handling user settings rest routes.
 *
 * @since 1.134.0
 * @access private
 * @ignore
 */
class User {

	/**
	 * Audience_Segmentation instance.
	 *
	 * @since 1.134.0
	 * @var Audience_Segmentation
	 */
	private $audience_segmentation;

	/**
	 * Conversion_Reporting instance.
	 *
	 * @since 1.144.0
	 * @var Conversion_Reporting
	 */
	private $conversion_reporting;

	/**
	 * Proactive_User_Engagement_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Proactive_User_Engagement_Settings|null
	 */
	private $proactive_user_engagement_settings;

	/**
	 * REST_Proactive_User_Engagement_Controller instance.
	 *
	 * @since n.e.x.t
	 * @var REST_Proactive_User_Engagement_Controller|null
	 */
	private $proactive_user_engagement_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.134.0
	 * @since n.e.x.t Added Proactive User Engagement settings and REST controller.
	 *
	 * @param User_Options $user_options User_Options instance.
	 */
	public function __construct( User_Options $user_options ) {
		$this->audience_segmentation = new Audience_Segmentation( $user_options );
		$this->conversion_reporting  = new Conversion_Reporting( $user_options );

		if ( Feature_Flags::enabled( 'proactiveUserEngagement' ) ) {
			$this->proactive_user_engagement_settings   = new Proactive_User_Engagement_Settings( $user_options );
			$this->proactive_user_engagement_controller = new REST_Proactive_User_Engagement_Controller( $this->proactive_user_engagement_settings );
		}
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.134.0
	 * @since n.e.x.t Added Proactive User Engagement settings and REST controller.
	 */
	public function register() {
		$this->audience_segmentation->register();
		$this->conversion_reporting->register();

		if ( $this->proactive_user_engagement_settings && $this->proactive_user_engagement_controller ) {
			$this->proactive_user_engagement_settings->register();
			$this->proactive_user_engagement_controller->register();
		}
	}
}
