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
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings;
use Google\Site_Kit\Modules\Sign_In_With_Google\User_Connection_Setting;
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
	 * Google client instance.
	 *
	 * @since n.e.x.t
	 * @var Google_Client
	 */
	protected $google_client;

	/**
	 * User_Connection_Setting instance.
	 *
	 * @since n.e.x.t
	 * @var User_Connection_Setting
	 */
	protected $user_connection_setting;

	/**
	 * Disconnect action name.
	 */
	const DISCONNECT_ACTION = 'googlesitekit_sign_in_with_google_disconnect_user';

	/**
	 * Get Sign in with Google client.
	 *
	 * @since n.e.x.t
	 */
	public function get_sign_in_with_google_client() {
		$settings = $this->get_settings()->get();
		if ( ! empty( $settings['clientID'] ) ) {
			$this->google_client = new Google_Client( array( 'client_id' => $settings['clientID'] ) );
		}
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.137.0
	 * @since n.e.x.t Add functionality to allow users to disconnect their own account and admins to disconnect any user.
	 */
	public function register() {
		add_filter( 'wp_login_errors', array( $this, 'handle_google_auth_errors' ) );

		add_action( 'login_form_google_auth', array( $this, 'handle_google_auth' ) );
		add_action( 'login_form', $this->get_method_proxy( 'render_signin_button' ) );

		add_action( 'show_user_profile', $this->get_method_proxy( 'render_disconnect_profile' ) ); // This action shows the disconnect section on the users own profile page.
		add_action( 'edit_user_profile', $this->get_method_proxy( 'render_disconnect_profile' ) ); // This action shows the disconnect section on other users profile page to allow admins to disconnect others.
		add_action(
			'admin_action_' . self::DISCONNECT_ACTION,
			function () {
				$this->handle_disconnect_user(
					$this->context->input()->filter( INPUT_GET, 'nonce' )
				);
			}
		);
	}

	/**
	 * Login user.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_User $user WordPress user object.
	 */
	protected function login_user_and_exit( WP_User $user ) {
		wp_set_current_user( $user->ID, $user->user_login );
		wp_set_auth_cookie( $user->ID );
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

		$requested_redirect_to = isset( $_REQUEST['redirect_to'] ) && is_string( $_REQUEST['redirect_to'] ) ? $_REQUEST['redirect_to'] : '';
		$redirect_to           = apply_filters( 'login_redirect', $redirect_to, $requested_redirect_to, $user );

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
	 * Generate unique username.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $username Username.
	 * @param int    $i        Current iteration of username generation.
	 * @return string A username that is unique on the site.
	 */
	private function generate_unique_username( $username, $i = 1 ) {
		$username = sanitize_title( $username );

		if ( ! username_exists( $username ) ) {
			return $username;
		}
		$new_username = sprintf( '%s-%s', $username, $i );
		if ( ! username_exists( $new_username ) ) {
			return $new_username;
		} else {
			return $this->generate_unique_username( $username, $i + 1 );
		}
	}

	/**
	 * Intercept the page request to process token ID
	 * and complete Sign in with Google flow.
	 *
	 * @since n.e.x.t
	 */
	public function handle_google_auth() {
		$request_method = $this->context->input()->filter( INPUT_SERVER, 'REQUEST_METHOD' );

		if ( 'POST' !== $request_method ) {
			return;
		}

		$csrf_cookie = $this->context->input()->filter( INPUT_COOKIE, 'g_csrf_token' );
		$csrf_post   = $this->context->input()->filter( INPUT_POST, 'g_csrf_token' );

		if (
			! $csrf_cookie ||
			! $csrf_post ||
			$csrf_cookie !== $csrf_post
		) {
			wp_safe_redirect( add_query_arg( 'error', 'google_auth_invalid_g_csrf_token', wp_login_url() ) );
			exit;
		}

		if ( is_null( $this->google_client ) ) {
			$this->get_sign_in_with_google_client();
		}

		$id_token = $this->context->input()->filter( INPUT_POST, 'credential' );
		try {
			$payload = $this->google_client->verifyIdToken( $id_token );
		} catch ( \Exception $e ) {
			wp_safe_redirect( add_query_arg( 'error', 'google_auth_invalid_request', wp_login_url() ) );
			exit;
		}

		if ( empty( $payload['sub'] ) || empty( $payload['email'] ) ) {
			wp_safe_redirect( add_query_arg( 'error', 'google_auth_invalid_request', wp_login_url() ) );
			exit;
		}

		$google_user_id         = $payload['sub'];
		$google_user_email      = $payload['email'];
		$google_user_name       = $payload['name'];
		$google_user_first_name = $payload['given_name'];
		$google_user_last_name  = $payload['family_name'];

		// Check if there are any existing WordPress users connected to this Google account.
		// The user ID is used as the unique identifier because users can change the email on their Google account.
		$existing_users = get_users(
			array(
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_key'   => $this->user_options->get_meta_key( User_Connection_Setting::OPTION ),
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'meta_value' => hash( 'sha256', $google_user_id ),
				'number'     => 1,
			)
		);

		if ( ! empty( $existing_users ) ) {
			return $this->login_user_and_exit( $existing_users[0] );
		}

		// Find an existing user that matches the email and link to their Google account by store their user ID in user meta.
		$existing_user = get_user_by( 'email', $google_user_email );
		if ( $existing_user ) {
			add_user_meta( $existing_user->ID, $this->user_options->get_meta_key( User_Connection_Setting::OPTION ), hash( 'sha256', $google_user_id ), true );
			return $this->login_user_and_exit( $existing_user );
		}

		// Create a new user if "Anyone can register" setting is enabled.
		$registration_open = get_option( 'users_can_register' );
		if ( ! $registration_open ) {
			wp_safe_redirect( add_query_arg( 'error', 'google_auth_failed', wp_login_url() ) );
			exit;
		}
		$new_user_id = wp_create_user( $this->generate_unique_username( strtolower( preg_replace( '/\s+/', '', $google_user_name ) ) ), wp_generate_password(), $google_user_email );
		$new_user    = get_user_by( 'id', $new_user_id );

		$default_role = get_option( 'default_role' );
		if ( empty( $default_role ) ) {
			$default_role = 'subscriber';
		}

		if ( is_multisite() ) {
			add_user_to_blog( get_current_blog_id(), $new_user_id, $default_role );
		}

		$new_user->set_role( $default_role );

		wp_update_user(
			array(
				'ID'         => $new_user_id,
				'nickname'   => $google_user_first_name,
				'first_name' => $google_user_first_name,
				'last_name'  => $google_user_last_name,
			)
		);

		add_user_meta( $new_user_id, $this->user_options->get_meta_key( User_Connection_Setting::OPTION ), hash( 'sha256', $google_user_id ), true );

		wp_send_new_user_notifications( $new_user_id );

		return $this->login_user_and_exit( get_user_by( 'id', $new_user_id ) );
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
			case 'google_auth_invalid_request':
			case 'google_auth_invalid_g_csrf_token':
				$error->add( 'google_auth', __( 'Sign in with Google failed.', 'google-site-kit' ) );
				break;
			case 'google_auth_failed':
				$error->add( 'google_auth_failed', __( 'The user is not registered on this site.', 'google-site-kit' ) );
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
<!-- <?php echo esc_html__( 'Sign in with Google button added by Site Kit', 'google-site-kit' ); ?> -->
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
<!-- <?php echo esc_html__( 'End Sign in with Google button added by Site Kit', 'google-site-kit' ); ?> -->
		<?php
	}

	/**
	 * Returns the disconnect URL for the specified user.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $user_id WordPress User ID.
	 */
	public static function disconnect_url( $user_id = null ) {
		return add_query_arg(
			array(
				'action'  => self::DISCONNECT_ACTION,
				'nonce'   => wp_create_nonce( self::DISCONNECT_ACTION ),
				'user_id' => $user_id,
			),
			admin_url( 'index.php' )
		);
	}

	/**
	 * Handles the disconnect action.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $nonce Nonce.
	 */
	public function handle_disconnect_user( $nonce ) {
		if ( ! wp_verify_nonce( $nonce, self::DISCONNECT_ACTION ) ) {
			$authentication = new Authentication( $this->context );
			$authentication->invalid_nonce_error( self::DISCONNECT_ACTION );
		}

		if ( ! isset( $_REQUEST['user_id'] ) ) {
			return;
		}
		$user_id = (int) $_REQUEST['user_id'];

		// Only allow this action for admins or users own setting.
		if ( current_user_can( Permissions::SETUP ) || get_current_user_id() === $user_id ) {
			delete_user_meta( $user_id, $this->user_options->get_meta_key( User_Connection_Setting::OPTION ) );
		}
		wp_safe_redirect( get_edit_user_link( $user_id ) );
		exit;
	}

	/**
	 * Displays a disconnect button on user profile pages.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_User $user WordPress user object.
	 */
	private function render_disconnect_profile( WP_User $user ) {
		$current_user_google_id = get_user_meta( $user->ID, $this->user_options->get_meta_key( User_Connection_Setting::OPTION ), true );

		// Don't show if the user does not have a Google ID save in user meta.
		if ( empty( $current_user_google_id ) ) {
			return;
		}

		// Only show to admins or users own settings.
		if ( ! ( current_user_can( Permissions::SETUP ) || get_current_user_id() === $user->ID ) ) {
			return;
		}
		?>
<div id="googlesitekit-sign-in-with-google-disconnect">
	<h2><?php esc_html_e( 'Sign in with Google', 'google-site-kit' ); ?></h2>
	<p>
		<?php
		esc_html_e(
			'This user can sign in with their Google account.',
			'google-site-kit'
		);
		?>
	</p>
	<p>
		<a
			class="button button-secondary"
			href="<?php echo esc_url( self::disconnect_url( $user->ID ) ); ?>"
		>
			<?php esc_html_e( 'Disconnect Google Account', 'google-site-kit' ); ?>
		</a>
	</p>
</div>
		<?php
	}
}
