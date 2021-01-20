<?php
/**
 * Class Google\Site_Kit\Core\Util\Tracking
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Screen;
use Google\Site_Kit\Core\Admin\Screens;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class managing admin tracking.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Tracking {

	const TRACKING_ID = 'UA-130569087-3';

	/**
	 * Screens instance.
	 *
	 * @since 1.11.0
	 *
	 * @var Screens
	 */
	protected $screens;

	/**
	 * Tracking_Consent instance.
	 *
	 * @var Tracking_Consent
	 */
	protected $consent;

	/**
	 * Constructor.
	 *
	 * @since 1.4.0
	 * @since 1.11.0 Added `Screens` instance.
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
		$user_options  = $user_options ?: new User_Options( $context );
		$this->screens = $screens ?: new Screens( $context );
		$this->consent = new Tracking_Consent( $user_options );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		$this->consent->register();

		add_filter(
			'googlesitekit_inline_base_data',
			function ( $data ) {
				return $this->inline_js_base_data( $data );
			}
		);
	}

	/**
	 * Is tracking active for the current user?
	 *
	 * @since 1.0.0
	 * @since 1.3.0 Tracking is now user-specific.
	 *
	 * @return bool True if tracking enabled, and False if not.
	 */
	public function is_active() {
		return (bool) $this->consent->get();
	}

	/**
	 * Modifies the base data to pass to JS.
	 *
	 * @since 1.3.0
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_base_data( $data ) {
		global $hook_suffix;
		$data['trackingAllowed'] = $this->screens->get_screen( $hook_suffix ) instanceof Screen;
		$data['trackingEnabled'] = $this->is_active();
		$data['trackingID']      = self::TRACKING_ID;

		return $data;
	}
}
