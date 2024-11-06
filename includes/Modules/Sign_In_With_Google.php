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
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings;
use Google\Site_Kit_Dependencies\Google_Client;
use WP_Error;
use WP_User;

/**
 * Class representing the Sign in With Google module.
 *
 * @since 1.137.0
 * @access private
 * @ignore
 */
final class Sign_In_With_Google extends Module implements Module_With_Assets, Module_With_Settings, Module_With_Deactivation {

	use Method_Proxy_Trait;
	use Module_With_Assets_Trait;
	use Module_With_Settings_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'sign-in-with-google';

	/**
	 * Option name to store user ID received from Google.
	 */
	const GOOGLE_USER_ID_OPTION = 'googlesitekitpersistent_siwg_google_user_id';

	/**
	 * Error codes.
	 */
	const INVALID_REQUEST_ERROR    = 'google_auth_invalid_request';
	const INVALID_CSRF_TOKEN_ERROR = 'google_auth_invalid_g_csrf_token';
	const SIGNIN_FAILED_ERROR      = 'google_auth_failed';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.137.0
	 */
	public function register() {
		add_filter( 'wp_login_errors', array( $this, 'handle_google_auth_errors' ) );

		add_action( 'login_form_google_auth', $this->get_method_proxy( 'handle_auth_callback' ) );
		add_action( 'login_form', $this->get_method_proxy( 'render_signin_button' ) );
	}

	/**
	 * Handles the callback request after the user signs in with Google.
	 *
	 * @since n.e.x.t
	 */
	private function handle_auth_callback() {
		// Ignore the request if the request method is not POST.
		$request_method = $this->context->input()->filter( INPUT_SERVER, 'REQUEST_METHOD' );
		if ( 'POST' !== $request_method ) {
			return;
		}

		$login_url = wp_login_url();

		// Check if the CSRF token is valid, if not redirect to the login page with an error.
		$csrf_cookie = $this->context->input()->filter( INPUT_COOKIE, 'g_csrf_token' );
		$csrf_post   = $this->context->input()->filter( INPUT_POST, 'g_csrf_token' );
		if ( ! $csrf_cookie || $csrf_cookie !== $csrf_post ) {
			wp_safe_redirect( add_query_arg( 'error', self::INVALID_CSRF_TOKEN_ERROR, $login_url ) );
			exit;
		}

		$user = null;

		try {
			$user = $this->find_or_create_user();
			if ( is_wp_error( $user ) ) {
				wp_safe_redirect( add_query_arg( 'error', $user->get_error_code(), $login_url ) );
				exit;
			}
		} catch ( \Exception $e ) {
			// Do nothign.
		}

		// Redirect to the error page if the user is not found.
		if ( ! $user instanceof WP_User ) {
			wp_safe_redirect( add_query_arg( 'error', self::INVALID_REQUEST_ERROR, $login_url ) );
			exit;
		}

		// Redirect to the error page if the user is not a member of the current blog in multisite.
		if ( is_multisite() ) {
			$blog_id = get_current_blog_id();
			if ( ! is_user_member_of_blog( $user->ID, $blog_id ) ) {
				// TODO: add the user to the current blog if registration is allowed.
				wp_safe_redirect( add_query_arg( 'error', self::INVALID_REQUEST_ERROR, $login_url ) );
				exit;
			}
		}

		// Set the user to be the current user.
		wp_set_current_user( $user->ID, $user->user_login );

		// Set the authentication cookies and trigger the wp_login action.
		wp_set_auth_cookie( $user->ID );
		/** This filter is documented in wp-login.php */
		do_action( 'wp_login', $user->user_login, $user );

		// TODO: redirect_to cannot be returned form the SiwG flow. The redirect_to login needs to be implemented using settings or session storage.
		if ( isset( $_REQUEST['redirect_to'] ) && is_string( $_REQUEST['redirect_to'] ) ) {
			$redirect_to = $_REQUEST['redirect_to'];
			// Redirect to HTTPS if user wants SSL.
			if ( get_user_option( 'use_ssl', $user->ID ) && str_contains( $redirect_to, 'wp-admin' ) ) {
				$redirect_to = preg_replace( '|^http://|', 'https://', $redirect_to );
			}
		} else {
			$redirect_to = admin_url();
		}

		/** This filter is documented in wp-login.php */
		$redirect_to = apply_filters( 'login_redirect', $redirect_to, $redirect_to, $user );

		if ( ( empty( $redirect_to ) || 'wp-admin/' === $redirect_to || admin_url() === $redirect_to ) ) {
			// If the user doesn't belong to a blog, send them to user admin. If the user can't edit posts, send them to their profile.
			if ( is_multisite() && ! get_active_blog_for_user( $user->ID ) && ! is_super_admin( $user->ID ) ) {
				$redirect_to = user_admin_url();
			} elseif ( is_multisite() && ! $user->has_cap( 'read' ) ) {
				$redirect_to = get_dashboard_url( $user->ID );
			} elseif ( ! $user->has_cap( 'edit_posts' ) ) {
				$redirect_to = $user->has_cap( 'read' ) ? admin_url( 'profile.php' ) : home_url();
			}

			wp_redirect( $redirect_to );
			exit;
		}

		wp_safe_redirect( $redirect_to );
		exit;
	}

	/**
	 * Tries to find a user using user ID or email recieved from Google. If the user is not found,
	 * attempts to create a new one.
	 *
	 * @since n.e.x.t
	 *
	 * @return WP_User|WP_Error User object if found or created, WP_Error otherwise.
	 */
	private function find_or_create_user() {
		$settings = $this->get_settings()->get();
		$id_token = $this->context->input()->filter( INPUT_POST, 'credential' );

		$google_client = new Google_Client( array( 'client_id' => $settings['clientID'] ) );
		$payload       = $google_client->verifyIdToken( $id_token );
		if ( empty( $payload['sub'] ) || empty( $payload['email'] ) ) {
			return new WP_Error( self::INVALID_REQUEST_ERROR );
		}

		// Check if there are any existing WordPress users connected to this Google account.
		// The user ID is used as the unique identifier because users can change the email on their Google account.
		$g_user_id = md5( $payload['sub'] );
		$users     = get_users(
			array(
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_key'   => $this->user_options->get_meta_key( self::GOOGLE_USER_ID_OPTION ),
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'meta_value' => $g_user_id,
				'number'     => 1,
			)
		);

		if ( ! empty( $users ) ) {
			return $users[0];
		}

		// Find an existing user that matches the email and link to their Google account by store their user ID in user meta.
		$user = get_user_by( 'email', $payload['email'] );
		if ( $user ) {
			$this->user_options->switch_user( $user->ID );
			$this->user_options->set( self::GOOGLE_USER_ID_OPTION, $g_user_id );

			return $user;
		}

		// We haven't found the user using their google user id and email. Thus we need to create
		// a new user. But if the registration is closed, we need to return an error to identify
		// that the sign in process failed.
		if ( ! get_option( 'users_can_register' ) ) {
			return new WP_Error( self::SIGNIN_FAILED_ERROR );
		}

		// Get the default role for new users.
		$default_role = get_option( 'default_role' );
		if ( empty( $default_role ) ) {
			$default_role = 'subscriber';
		}

		// Create a new user.
		$user_id = wp_insert_user(
			array(
				'user_pass'    => wp_generate_password(),
				'user_login'   => $payload['email'],
				'user_email'   => $payload['email'],
				'display_name' => sprintf( '%s %s', $payload['given_name'], $payload['family_name'] ),
				'first_name'   => $payload['given_name'],
				'last_name'    => $payload['family_name'],
				'role'         => $default_role,
				'meta_input'   => array(
					$this->user_options->get_meta_key( self::GOOGLE_USER_ID_OPTION ) => $g_user_id,
				),
			)
		);

		if ( is_wp_error( $user_id ) ) {
			return new WP_Error( self::SIGNIN_FAILED_ERROR );
		}

		// Add the user to the current site if it is a multisite.
		if ( is_multisite() ) {
			add_user_to_blog( get_current_blog_id(), $user_id, $default_role );
		}

		// Send the new user notification.
		wp_send_new_user_notifications( $user_id );

		return get_user_by( 'id', $user_id );
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
			case self::INVALID_REQUEST_ERROR:
			case self::INVALID_CSRF_TOKEN_ERROR:
				$error->add( self::MODULE_SLUG, __( 'Sign in with Google failed.', 'google-site-kit' ) );
				break;
			case self::SIGNIN_FAILED_ERROR:
				$error->add( self::MODULE_SLUG, __( 'The user is not registered on this site.', 'google-site-kit' ) );
				break;
			default:
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

	/**
	 * Checks whether the module is connected.
	 *
	 * A module being connected means that all steps required as part of its activation are completed.
	 *
	 * @since 1.139.0
	 *
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_connected() {
		$options = $this->get_settings()->get();
		if ( empty( $options['clientID'] ) ) {
			return false;
		}

		return parent::is_connected();
	}

	/**
	 * Renders the sign in button.
	 *
	 * @since 1.139.0
	 */
	private function render_signin_button() {
		$settings = $this->get_settings()->get();
		if ( ! $settings['clientID'] ) {
			return;
		}

		$redirect_url = add_query_arg( 'action', 'google_auth', wp_login_url() );
		if ( substr( $redirect_url, 0, 5 ) !== 'https' ) {
			return;
		}

		// if ( ! empty( $_GET['redirect_to'] ) ) {
			// TODO: we must find a way to store the redirect_to so that it can be retrieved after the SiwG flow.
			// login_uri below does not accept additional query arguments.
		// }

		// Render the Sign in with Google button and related inline styles.
		?>
<!-- Sign in with Google button added by Site Kit -->
<?php /* phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript */ ?>
<script src="https://accounts.google.com/gsi/client"></script>
<script>
( () => {
	google.accounts.id.initialize({
		client_id: '<?php echo esc_js( $settings['clientID'] ); ?>',
		login_uri: '<?php echo esc_js( $redirect_url ); ?>',
		ux_mode: 'redirect',
	});
	const parent = document.createElement( 'div' );
	document.getElementById( 'login').insertBefore( parent, document.getElementById( 'loginform' ) );
	google.accounts.id.renderButton(parent, {
		theme: '<?php echo esc_js( $settings['theme'] ); ?>',
		text: '<?php echo esc_js( $settings['text'] ); ?>',
		shape: '<?php echo esc_js( $settings['shape'] ); ?>'
	});
} )();
</script>
<!-- End Sign in with Google button added by Site Kit -->
		<?php
	}
}
