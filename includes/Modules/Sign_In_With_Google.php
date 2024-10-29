<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings;
use Google\Site_Kit\Modules\Sign_In_With_Google\Validate_Auth_Request;
use Google\Site_Kit_Dependencies\Google_Client;
use WP_Error;

/**
 * Class representing the Sign in With Google module.
 *
 * @since 1.137.0
 * @access private
 * @ignore
 */
final class Sign_In_With_Google extends Module implements Module_With_Assets, Module_With_Settings, Module_With_Deactivation {

	use Module_With_Assets_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'sign-in-with-google';

	/**
	 * Validate_Auth_Request instance.
	 *
	 * @since n.e.x.t
	 * @var Validate_Auth_Request
	 */
	protected $validate_auth_request;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context        $context        Plugin context.
	 * @param Options        $options        Optional. Option API instance. Default is a new instance.
	 * @param User_Options   $user_options   Optional. User Option API instance. Default is a new instance.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 * @param Assets         $assets         Optional. Assets API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null,
		Authentication $authentication = null,
		Assets $assets = null
	) {
		parent::__construct( $context, $options, $user_options, $authentication, $assets );

		$this->validate_auth_request = new Validate_Auth_Request( $context );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.137.0
	 */
	public function register() {
		add_action(
			'init',
			function () {
				add_rewrite_rule( '^auth/google/?$', 'index.php?google_auth=1', 'top' );
			}
		);

		add_filter(
			'query_vars',
			function ( $vars ) {
				$vars[] = 'google_auth';
				return $vars;
			}
		);

		add_filter( 'wp_login_errors', array( $this, 'handle_google_auth_errors' ) );

		add_action( 'template_redirect', array( $this, 'handle_google_auth' ) );
	}

	/**
	 * Intercept the page request to process token ID
	 * and complete Sign in with Google flow.
	 *
	 * @since n.e.x.t
	 */
	public function handle_google_auth() {
		global $wp_query;

		if ( ! isset( $wp_query->query_vars['google_auth'] ) ) {
			return;
		}

		$client_id = $this->get_settings()->get()['clientID'];
		if ( empty( $client_id ) ) {
			wp_safe_redirect( add_query_arg( 'error', 'no_client_id', wp_login_url() ) );
			exit;
		}

		$this->validate_auth_request->run_validations();
		$error = $this->validate_auth_request->get_error();

		if ( is_wp_error( $error ) ) {
			wp_safe_redirect( add_query_arg( 'error', $error->get_error_code(), wp_login_url() ) );
			exit;
		}

		$id_token = $this->context->input()->filter( INPUT_POST, 'credential' );
		try {
			$client  = new Google_Client( array( 'client_id' => $client_id ) );
			$payload = $client->verifyIdToken( $id_token );

			if ( empty( $payload ) ) {
				wp_safe_redirect( add_query_arg( 'error', 'google_auth_invalid_request', wp_login_url() ) );
				exit;
			}

			// @TODO implement further flow and redirect with $payload in #9339.
			wp_send_json_success();

		} catch ( \Exception $e ) {
			wp_send_json_error( $e->getMessage() );
		}
	}

	/**
	 * Adds custom errors if Google auth flow failed.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_Error $error WP_Error instance.
	 * @return WP_Error $error WP_Error instance.
	 */
	public function handle_google_auth_errors( $error ) {
		$error_code = $this->context->input()->filter( INPUT_GET, 'error' );
		if ( ! $error_code ) {
			return $error;
		}

		switch ( $error_code ) {
			case 'no_client_id':
				$error->add( 'access', __( 'No client ID supplied.', 'google-site-kit' ) );
				break;
			case 'google_auth_invalid_request':
				$error->add( 'access', __( 'Invalid request.', 'google-site-kit' ) );
				break;
			case 'google_auth_bad_request_method':
				$error->add( 'access', __( 'Bad request method.', 'google-site-kit' ) );
				break;
			case 'google_auth_invalid_g_csrf_token':
				$error->add( 'access', __( 'Invalid g_csrf token.', 'google-site-kit' ) );
				break;
			case 'missing_parameter':
				$error->add( 'access', __( 'Parameter: "credential" is missing.', 'google-site-kit' ) );
				break;
		}

		return $error;
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * @since 1.137.0
	 */
	public function on_deactivation() {
		$this->get_settings()->delete();
	}

	/**
	 * Sets up information about the module.
	 *
	 * @since 1.137.0
	 *
	 * @return array Associative array of module info.
	 */
	protected function setup_info() {
		return array(
			'slug'        => self::MODULE_SLUG,
			'name'        => _x( 'Sign in with Google', 'Service name', 'google-site-kit' ),
			'description' => __( 'Improve user engagement, trust, and data privacy, while creating a simple, secure, and personalized experience for your visitors', 'google-site-kit' ),
			'order'       => 10,
			'homepage'    => __( 'https://developers.google.com/identity/gsi/web/guides/overview', 'google-site-kit' ),
		);
	}

	/**
	 * Sets up the module's assets to register.
	 *
	 * @since 1.137.0
	 *
	 * @return Asset[] List of Asset objects.
	 */
	protected function setup_assets() {
		return array(
			new Script(
				'googlesitekit-modules-sign-in-with-google',
				array(
					'src'          => $this->context->url( 'dist/assets/js/googlesitekit-modules-sign-in-with-google.js' ),
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-user',
						'googlesitekit-components',
					),
				)
			),
		);
	}

	/**
	 * Sets up the module's settings instance.
	 *
	 * @since 1.137.0
	 *
	 * @return Settings
	 */
	protected function setup_settings() {
		return new Settings( $this->options );
	}
}
