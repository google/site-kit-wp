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
	 * Constructor.
	 *
	 * @since 1.134.0
	 *
	 * @param User_Options $user_options User_Options instance.
	 */
	public function __construct( User_Options $user_options ) {
		$this->audience_segmentation = new Audience_Segmentation( $user_options );
		$this->conversion_reporting  = new Conversion_Reporting( $user_options );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.134.0
	 */
	public function register() {
		$this->audience_segmentation->register();
		$this->conversion_reporting->register();
	}
}
