<?php
/**
 * Class Google\Site_Kit\Core\Tracking\Tracking
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Screen;
use Google\Site_Kit\Core\Admin\Screens;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class managing admin tracking.
 *
 * @since 1.49.0
 * @access private
 * @ignore
 */
final class Tracking {

	use Method_Proxy_Trait;

	const TRACKING_ID = 'UA-130569087-3';

	/**
	 * Screens instance.
	 *
	 * @since 1.49.0
	 *
	 * @var Screens
	 */
	protected $screens;

	/**
	 * Tracking_Consent instance.
	 *
	 * @since 1.49.0
	 *
	 * @var Tracking_Consent
	 */
	protected $consent;

	/**
	 * REST_Tracking_Consent_Controller instance.
	 *
	 * @since 1.49.0
	 *
	 * @var REST_Tracking_Consent_Controller
	 */
	private $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.49.0
	 *
	 * @param Context      $context      Context instance.
	 * @param User_Options $user_options Optional. User_Options instance. Default is a new instance.
	 * @param Screens      $screens      Optional. Screens instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		User_Options $user_options = null,
		Screens $screens = null
	) {
		$user_options          = $user_options ?: new User_Options( $context );
		$this->screens         = $screens ?: new Screens( $context );
		$this->consent         = new Tracking_Consent( $user_options );
		$this->rest_controller = new REST_Tracking_Consent_Controller( $this->consent );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.49.0
	 */
	public function register() {
		$this->consent->register();
		$this->rest_controller->register();

		add_filter( 'googlesitekit_inline_tracking_data', $this->get_method_proxy( 'inline_js_tracking_data' ) );
	}

	/**
	 * Is tracking active for the current user?
	 *
	 * @since 1.49.0
	 *
	 * @return bool True if tracking enabled, and False if not.
	 */
	public function is_active() {
		return (bool) $this->consent->get();
	}

	/**
	 * Adds / modifies tracking relevant data to pass to JS.
	 *
	 * @since 1.78.0
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_tracking_data( $data ) {
		global $hook_suffix;
		$data['isSiteKitScreen'] = $this->screens->get_screen( $hook_suffix ) instanceof Screen;
		$data['trackingEnabled'] = $this->is_active();
		$data['trackingID']      = self::TRACKING_ID;

		return $data;
	}
}
