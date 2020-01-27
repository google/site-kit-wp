<?php
/**
 * Class Google\Site_Kit\Core\Util\Tracking
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class managing admin tracking.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Tracking {

	/**
	 * Tracking Optin Key
	 *
	 * @var string tracking optin key for options table.
	 */
	const TRACKING_OPTIN_KEY = 'googlesitekit_tracking_optin';

	const TRACKING_ID = 'UA-130569087-3';

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Authentication instance.
	 *
	 * @since 1.0.0
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * User_Options instance.
	 *
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 * @since n.e.x.t Added User_Options.
	 *
	 * @param Context        $context        Plugin context.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 * @param User_Options   $user_options   Optional. User_Options instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Authentication $authentication = null,
		User_Options $user_options = null
	) {
		$this->context        = $context;
		$this->authentication = $authentication ?: new Authentication( $this->context );
		$this->user_options   = $user_options ?: new User_Options( $this->context );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		add_filter(
			'googlesitekit_inline_base_data',
			function ( $data ) {
				return $this->inline_js_admin_data( $data );
			}
		);
		add_filter(
			'googlesitekit_admin_data',
			function ( $data ) {
				return $this->inline_js_admin_data( $data );
			}
		);

		add_action(
			'init',
			function () {
				$this->register_settings();
			}
		);
	}

	/**
	 * Is tracking active for the current user?
	 *
	 * @since 1.0.0
	 * @since n.e.x.t Tracking is now user-specific.
	 *
	 * @return bool True if tracking enabled, and False if not.
	 */
	public function is_active() {
		return (bool) $this->user_options->get( self::TRACKING_OPTIN_KEY );
	}

	/**
	 * Modifies the admin data to pass to JS.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_admin_data( $data ) {
		$data['trackingID'] = self::TRACKING_ID;

		return $data;
	}

	/**
	 * Register tracking settings and allow access from Rest API.
	 *
	 * @since 1.0.0
	 * @since n.e.x.t Registers a meta field instead of setting.
	 */
	private function register_settings() {
		global $wpdb;
		$args = array(
			'type'         => 'boolean',
			'description'  => __( 'Allowing tracking of anonymous usage stats.', 'google-site-kit' ),
			'default'      => false,
			'single'       => true,
			'show_in_rest' => current_user_can( Permissions::SETUP ),
		);
		// Need to conditionally include the blog prefix as this is a user option.
		$prefix = ! $this->context->is_network_mode() ? $wpdb->get_blog_prefix() : '';
		register_meta( 'user', $prefix . self::TRACKING_OPTIN_KEY, $args );
	}
}
