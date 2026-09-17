<?php
/**
 * Class Google\Site_Kit\Core\Intents\Pending_Intent_Check
 *
 * @package   Google\Site_Kit\Core\Intents
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Intents;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Plugin_Version;

/**
 * Class asking the Site Kit Service for an intent waiting for this site and user.
 *
 * Someone can arrive from the Google Ads console while the site runs a plugin too old to handle
 * their intent. The Service holds onto it, so the plugin collects it after the update rather than
 * sending them back to start again.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Pending_Intent_Check {

	const CHECKED_VERSION_USER_OPTION = 'googlesitekit_intent_check_version';

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Options instance.
	 *
	 * @since n.e.x.t
	 * @var Options
	 */
	private $options;

	/**
	 * User_Options instance.
	 *
	 * @since n.e.x.t
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Authentication instance.
	 *
	 * @since n.e.x.t
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context        $context        Plugin context.
	 * @param Options        $options        Options instance.
	 * @param User_Options   $user_options   User_Options instance.
	 * @param Authentication $authentication Authentication instance.
	 */
	public function __construct(
		Context $context,
		Options $options,
		User_Options $user_options,
		Authentication $authentication
	) {
		$this->context        = $context;
		$this->options        = $options;
		$this->user_options   = $user_options;
		$this->authentication = $authentication;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		// Priority 20 leaves Plugin_Version time to store the version this check compares against.
		add_action( 'admin_init', array( $this, 'check_pending_intent' ), 20 );
	}

	/**
	 * Sends the user to the intent the Service is holding for them, if there is one.
	 *
	 * @since n.e.x.t
	 */
	public function check_pending_intent() {
		// `admin_init` also runs for admin-ajax.php and for form submissions, where a redirect
		// would answer a request nobody is looking at and spend the intent the user is waiting
		// for. A method that cannot be read still goes ahead, so the check survives a host where
		// `filter_input()` comes up empty.
		$request_method = $this->context->input()->filter( INPUT_SERVER, 'REQUEST_METHOD' );

		if ( wp_doing_ajax() || ( $request_method && 'GET' !== $request_method ) ) {
			return;
		}

		if (
			! Feature_Flags::enabled( 'adsConversionTrackingIntent' )
			|| ! current_user_can( Permissions::SETUP )
			|| ! $this->authentication->is_authenticated()
			|| ! $this->authentication->credentials()->using_proxy()
		) {
			return;
		}

		$plugin_version = $this->options->get( Plugin_Version::OPTION );

		if ( $this->user_options->get( self::CHECKED_VERSION_USER_OPTION ) === $plugin_version ) {
			return;
		}

		// Recorded whether or not the user ends up somewhere else, so a check that finds nothing
		// does not repeat on every admin page they open.
		$this->user_options->set( self::CHECKED_VERSION_USER_OPTION, $plugin_version );

		// Site Kit only refreshes the access token when the user opens a dashboard, and this runs on
		// any admin page, so an hour-old token would reach the Service expired and cost this user
		// the one check they get for this version.
		$this->authentication->do_refresh_user_token();

		$response = $this->authentication->get_google_proxy()->get_pending_intent(
			$this->authentication->credentials(),
			(string) $this->authentication->get_oauth_client()->get_access_token()
		);

		if ( is_wp_error( $response ) || empty( $response['has_intent'] ) ) {
			return;
		}

		$intent = $this->read_string( $response, 'intent' );
		$code   = $this->read_string( $response, 'code' );

		if ( '' === $intent || '' === $code ) {
			return;
		}

		wp_safe_redirect(
			$this->context->admin_url(
				'dashboard',
				array(
					'intent'      => $intent,
					'intent_code' => $code,
				)
			)
		);
		exit;
	}

	/**
	 * Reads a field of the Service's response as a string.
	 *
	 * @since n.e.x.t
	 *
	 * @param array  $response Response from the Service.
	 * @param string $field    Field to read.
	 * @return string The field's value, or an empty string when it is missing or is not a value a
	 *                URL can carry.
	 */
	private function read_string( array $response, $field ) {
		if ( empty( $response[ $field ] ) || ! is_scalar( $response[ $field ] ) ) {
			return '';
		}

		return (string) $response[ $field ];
	}
}
