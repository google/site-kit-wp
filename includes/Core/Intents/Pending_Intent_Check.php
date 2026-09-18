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
 * Class for checking whether the Site Kit Service has a pending intent for this site and user.
 *
 * A user can come from the Google Ads console while the site runs a plugin version that does not
 * support their intent yet. The Service keeps the intent, so after the update the plugin can pick it
 * up and the user does not have to start again.
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
		// Priority 20 runs after Plugin_Version has saved the current version.
		add_action( 'admin_init', array( $this, 'check_pending_intent' ), 20 );
	}

	/**
	 * Redirects the user to their pending intent, if the Service has one.
	 *
	 * @since n.e.x.t
	 */
	public function check_pending_intent() {
		// `admin_init` also runs for AJAX requests and form submissions. Redirecting those would use
		// up the intent without the user ever seeing it. If the request method cannot be read, as
		// on hosts where `filter_input()` returns nothing, the check still runs.
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

		// Save the version before calling the Service, so the check runs only once per update,
		// even when no intent is found.
		$this->user_options->set( self::CHECKED_VERSION_USER_OPTION, $plugin_version );

		// Site Kit normally refreshes the access token only on the dashboard screens. This check runs
		// on any admin page, so refresh the token here to avoid sending an expired one.
		$this->authentication->do_refresh_user_token();

		$response = $this->authentication->get_google_proxy()->get_pending_intent(
			$this->authentication->credentials(),
			(string) $this->authentication->get_oauth_client()->get_access_token()
		);

		if ( is_wp_error( $response ) || empty( $response['has_intent'] ) ) {
			return;
		}

		$intent = $this->read_string( $response, 'intent' );
		$code   = $this->read_string( $response, 'intent_code' );

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
	 * @return string The field's value, or an empty string when it is missing or not a string or
	 *                a number.
	 */
	private function read_string( array $response, $field ) {
		if ( empty( $response[ $field ] ) || ! is_scalar( $response[ $field ] ) ) {
			return '';
		}

		return (string) $response[ $field ];
	}
}
