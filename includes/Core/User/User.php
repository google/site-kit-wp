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
	 * Proactive_User_Engagement instance.
	 *
	 * @since 1.162.0
	 * @var Proactive_User_Engagement
	 */
	private $proactive_user_engagement;

	/**
	 * Initial_Setup instance.
	 *
	 * @since 1.164.0
	 * @var Initial_Setup
	 */
	private $initial_setup;

	/**
	 * Constructor.
	 *
	 * @since 1.134.0
	 * @since 1.162.0 Added Proactive User Engagement.
	 * @since 1.164.0 Added Initial Setup.
	 *
	 * @param User_Options $user_options User_Options instance.
	 */
	public function __construct( User_Options $user_options ) {
		$this->audience_segmentation = new Audience_Segmentation( $user_options );
		$this->conversion_reporting  = new Conversion_Reporting( $user_options );

		if ( Feature_Flags::enabled( 'proactiveUserEngagement' ) ) {
			$this->proactive_user_engagement = new Proactive_User_Engagement( $user_options );
		}

		if ( Feature_Flags::enabled( 'setupFlowRefresh' ) ) {
			$this->initial_setup = new Initial_Setup( $user_options );
		}
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.134.0
	 * @since 1.162.0 Added Proactive User Engagement.
	 * @since 1.164.0 Added Initial Setup.
	 */
	public function register() {
		$this->audience_segmentation->register();
		$this->conversion_reporting->register();

		if ( Feature_Flags::enabled( 'proactiveUserEngagement' ) && $this->proactive_user_engagement ) {
			$this->proactive_user_engagement->register();
		}

		if ( Feature_Flags::enabled( 'setupFlowRefresh' ) ) {
			$this->initial_setup->register();
		}
	}
}
