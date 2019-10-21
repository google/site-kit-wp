<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Authentication
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Admin\Notice;

/**
 * Authentication Class.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Authentication {

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Options object.
	 *
	 * @since 1.0.0
	 *
	 * @var Options
	 */
	private $options = null;

	/**
	 * User_Options object.
	 *
	 * @since 1.0.0
	 *
	 * @var User_Options
	 */
	private $user_options = null;

	/**
	 * Transients object.
	 *
	 * @since 1.0.0
	 *
	 * @var Transients
	 */
	private $transients = null;

	/**
	 * OAuth client object.
	 *
	 * @since 1.0.0
	 *
	 * @var Clients\OAuth_Client
	 */
	private $auth_client = null;

	/**
	 * OAuth credentials instance.
	 *
	 * @since 1.0.0
	 * @var Credentials
	 */
	protected $credentials;

	/**
	 * Verification instance.
	 *
	 * @since 1.0.0
	 * @var Verification
	 */
	protected $verification;

	/**
	 * Verification tag instance.
	 *
	 * @since 1.0.0
	 * @var Verification_Tag
	 */
	protected $verification_tag;

	/**
	 * Profile instance.
	 *
	 * @since 1.0.0
	 * @var Profile
	 */
	protected $profile;

	/**
	 * First_Admin instance.
	 *
	 * @since 1.0.0
	 * @var First_Admin
	 */
	protected $first_admin;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context      $context      Plugin context.
	 * @param Options      $options      Optional. Option API instance. Default is a new instance.
	 * @param User_Options $user_options Optional. User Option API instance. Default is a new instance.
	 * @param Transients   $transients   Optional. Transient API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null,
		Transients $transients = null
	) {
		$this->context = $context;

		if ( ! $options ) {
			$options = new Options( $this->context );
		}
		$this->options = $options;

		if ( ! $user_options ) {
			$user_options = new User_Options( $this->context );
		}
		$this->user_options = $user_options;

		if ( ! $transients ) {
			$transients = new Transients( $this->context );
		}
		$this->transients = $transients;

		$this->credentials      = new Credentials( $this->options );
		$this->verification     = new Verification( $this->user_options );
		$this->verification_tag = new Verification_Tag( $this->user_options, $this->transients );
		$this->profile          = new Profile( $user_options, $this->get_oauth_client() );
		$this->first_admin      = new First_Admin( $this->options );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		add_action(
			'init',
			function() {
				$this->handle_oauth();
			}
		);

		add_action(
			'admin_init',
			function() {
				$this->handle_verification_token();
			}
		);

		add_action(
			'wp_login',
			function() {
				$this->refresh_auth_token_on_login();
			}
		);

		add_filter(
			'googlesitekit_admin_data',
			function ( $data ) {
				return $this->inline_js_admin_data( $data );
			}
		);

		add_filter(
			'googlesitekit_setup_data',
			function ( $data ) {
				return $this->inline_js_setup_data( $data );
			}
		);

		add_filter(
			'allowed_redirect_hosts',
			function ( $hosts ) {
				return $this->allowed_redirect_hosts( $hosts );
			}
		);

		add_filter(
			'googlesitekit_admin_notices',
			function ( $notices ) {
				return $this->authentication_admin_notices( $notices );
			}
		);

		$print_site_verification_meta = function() {
			$this->print_site_verification_meta();
		};

		add_action( 'wp_head', $print_site_verification_meta );
		add_action( 'login_head', $print_site_verification_meta );

		add_action(
			'admin_head',
			function() {
				global $hook_suffix;

				// Highjack current admin page with OAuth sensitive scopes warning.
				if ( filter_input( INPUT_GET, Sensitive_Scopes_Warning::QUERY_PARAMETER ) ) {
					remove_all_actions( "{$hook_suffix}" );

					$redirect_url = '';
					if ( ! empty( $_GET['redirect'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
						$redirect_url = esc_url_raw( wp_unslash( $_GET['redirect'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
					}

					$connect_url = $this->get_connect_url();
					if ( ! empty( $redirect_url ) ) {
						$connect_url = add_query_arg( 'redirect', rawurlencode( $redirect_url ), $connect_url );
					}

					$warning = new Sensitive_Scopes_Warning( $this->context, $connect_url );
					add_action( "{$hook_suffix}", array( $warning, 'render' ), 1 );
				}
			}
		);
	}

	/**
	 * Gets the OAuth credentials object.
	 *
	 * @since 1.0.0
	 *
	 * @return Credentials Credentials instance.
	 */
	public function credentials() {
		return $this->credentials;
	}

	/**
	 * Gets the verification instance.
	 *
	 * @since 1.0.0
	 *
	 * @return Verification Verification instance.
	 */
	public function verification() {
		return $this->verification;
	}

	/**
	 * Gets the verification tag instance.
	 *
	 * @since 1.0.0
	 *
	 * @return Verification_Tag Verification tag instance.
	 */
	public function verification_tag() {
		return $this->verification_tag;
	}

	/**
	 * Gets the Profile instance.
	 *
	 * @since 1.0.0
	 *
	 * @return Profile Profile instance.
	 */
	public function profile() {
		return $this->profile;
	}

	/**
	 * Gets the OAuth client instance.
	 *
	 * @since 1.0.0
	 *
	 * @return Clients\OAuth_Client OAuth client instance.
	 */
	public function get_oauth_client() {
		if ( ! $this->auth_client instanceof Clients\OAuth_Client ) {
			$this->auth_client = new Clients\OAuth_Client( $this->context, $this->options, $this->user_options, $this->credentials );
		}
		return $this->auth_client;
	}

	/**
	 * Revokes authentication along with user options settings.
	 *
	 * @since 1.0.0
	 */
	public function disconnect() {
		$auth_client = $this->get_oauth_client();

		$auth_client->revoke_token();

		$this->user_options->delete( Clients\OAuth_Client::OPTION_ACCESS_TOKEN );
		$this->user_options->delete( Clients\OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN );
		$this->user_options->delete( Clients\OAuth_Client::OPTION_ACCESS_TOKEN_CREATED );
		$this->user_options->delete( Clients\OAuth_Client::OPTION_REFRESH_TOKEN );
		$this->user_options->delete( Clients\OAuth_Client::OPTION_REDIRECT_URL );
		$this->user_options->delete( Clients\OAuth_Client::OPTION_AUTH_SCOPES );
		$this->user_options->delete( Clients\OAuth_Client::OPTION_ERROR_CODE );
		$this->user_options->delete( Clients\OAuth_Client::OPTION_PROXY_ACCESS_CODE );
		$this->user_options->delete( Verification::OPTION );
		$this->user_options->delete( Verification_Tag::OPTION );
		$this->user_options->delete( Profile::OPTION );
	}

	/**
	 * Gets the URL for connecting to Site Kit.
	 *
	 * @since 1.0.0
	 *
	 * @return string Connect URL.
	 */
	public function get_connect_url() {
		return $this->context->admin_url(
			'splash',
			array(
				'googlesitekit_connect' => 1,
				'nonce'                 => wp_create_nonce( 'connect' ),
			)
		);
	}

	/**
	 * Gets the URL for disconnecting from Site Kit.
	 *
	 * @since 1.0.0
	 *
	 * @return string Disconnect URL.
	 */
	public function get_disconnect_url() {
		return $this->context->admin_url(
			'splash',
			array(
				'googlesitekit_disconnect' => 1,
				'nonce'                    => wp_create_nonce( 'disconnect' ),
			)
		);
	}

	/**
	 * Check if the current user is authenticated.
	 *
	 * @since 1.0.0
	 *
	 * @return boolean True if the user is authenticated, false otherwise.
	 */
	public function is_authenticated() {
		$auth_client = $this->get_oauth_client();

		$access_token = $auth_client->get_access_token();

		return ! empty( $access_token );
	}

	/**
	 * Handles receiving a temporary OAuth code.
	 *
	 * @since 1.0.0
	 */
	private function handle_oauth() {
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			return;
		}

		$auth_client = $this->get_oauth_client();

		// Handles Direct OAuth client request.
		if ( filter_input( INPUT_GET, 'oauth2callback' ) ) {
			$auth_client->authorize_user();
			exit;
		}

		if ( ! is_admin() ) {
			return;
		}

		if ( filter_input( INPUT_GET, 'googlesitekit_disconnect' ) ) {
			$nonce = filter_input( INPUT_GET, 'nonce' );
			if ( empty( $nonce ) || ! wp_verify_nonce( $nonce, 'disconnect' ) ) {
				wp_die( esc_html__( 'Invalid nonce.', 'google-site-kit' ), 400 );
			}

			if ( ! current_user_can( Permissions::AUTHENTICATE ) ) {
				wp_die( esc_html__( 'You don\'t have permissions to perform this action.', 'google-site-kit' ), 403 );
			}

			$this->disconnect();

			$redirect_url = $this->context->admin_url(
				'splash',
				array(
					'googlesitekit_reset_session' => 1,
				)
			);

			header( 'Location: ' . filter_var( $redirect_url, FILTER_SANITIZE_URL ) );
			exit();
		}

		if ( filter_input( INPUT_GET, 'googlesitekit_connect' ) ) {
			$nonce = filter_input( INPUT_GET, 'nonce' );
			if ( empty( $nonce ) || ! wp_verify_nonce( $nonce, 'connect' ) ) {
				wp_die( esc_html__( 'Invalid nonce.', 'google-site-kit' ), 400 );
			}

			if ( ! current_user_can( Permissions::AUTHENTICATE ) ) {
				wp_die( esc_html__( 'You don\'t have permissions to perform this action.', 'google-site-kit' ), 403 );
			}

			$redirect_url = '';
			if ( ! empty( $_GET['redirect'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
				$redirect_url = esc_url_raw( wp_unslash( $_GET['redirect'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
			}

			$required_scopes = $this->get_oauth_client()->get_required_scopes();

			$warning = new Sensitive_Scopes_Warning( $this->context, $this->get_connect_url() );
			if ( $warning->should_display( $required_scopes ) ) {
				$warning_url = $warning->get_url();
				if ( ! empty( $redirect_url ) ) {
					$warning_url = add_query_arg( 'redirect', $redirect_url, $warning_url );
				}
				wp_safe_redirect( $warning_url );
				exit;
			}

			// User is trying to authenticate, but access token hasn't been set.
			header( 'Location: ' . filter_var( $auth_client->get_authentication_url( $redirect_url ), FILTER_SANITIZE_URL ) );
			exit();
		}
	}

	/**
	 * Handles receiving a verification token for a user by the authentication proxy.
	 *
	 * @since 1.0.0
	 */
	private function handle_verification_token() {
		$auth_client = $this->get_oauth_client();
		if ( ! $auth_client->using_proxy() ) {
			return;
		}

		$verification_token = filter_input( INPUT_GET, 'googlesitekit_verification_token' );
		if ( empty( $verification_token ) ) {
			return;
		}

		$verification_nonce = filter_input( INPUT_GET, 'googlesitekit_verification_nonce' );
		if ( empty( $verification_nonce ) || ! wp_verify_nonce( $verification_nonce, 'googlesitekit_verification' ) ) {
			wp_die( esc_html__( 'Invalid nonce.', 'google-site-kit' ) );
		}

		$this->verification_tag->set( $verification_token );

		$code = (string) filter_input( INPUT_GET, 'googlesitekit_code' );

		wp_safe_redirect( add_query_arg( 'verify', 'true', $auth_client->get_proxy_setup_url( $code ) ) );
		exit;
	}

	/**
	 * Refresh authentication token when user login.
	 *
	 * @since 1.0.0
	 */
	private function refresh_auth_token_on_login() {
		// Bail if the user is not authenticated at all yet.
		if ( ! $this->is_authenticated() ) {
			return;
		}

		$auth_client = $this->get_oauth_client();

		// Initiates Google Client object.
		$auth_client->get_client();

		// Refresh auth token.
		$auth_client->refresh_token();

		// If 'invalid_grant' error, disconnect the account.
		if ( 'invalid_grant' === $this->user_options->get( Clients\OAuth_Client::OPTION_ERROR_CODE ) ) {
			$this->disconnect();
		}
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
		if ( ! isset( $data['userData'] ) ) {
			$data['userData'] = array();
		}
		$profile_data = $this->profile->get();
		if ( $profile_data ) {
			$data['userData']['email']   = $profile_data['email'];
			$data['userData']['picture'] = $profile_data['photo'];
		}

		$auth_client = $this->get_oauth_client();
		if ( $auth_client->using_proxy() ) {
			$access_code                 = (string) $this->user_options->get( Clients\OAuth_Client::OPTION_PROXY_ACCESS_CODE );
			$data['proxySetupURL']       = esc_url_raw( $auth_client->get_proxy_setup_url( $access_code ) );
			$data['proxyPermissionsURL'] = esc_url_raw( $auth_client->get_proxy_permissions_url() );
		}

		$data['connectUrl']    = esc_url_raw( $this->get_connect_url() );
		$data['disconnectUrl'] = esc_url_raw( $this->get_disconnect_url() );

		return $data;
	}

	/**
	 * Modifies the setup data to pass to JS.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_setup_data( $data ) {
		$auth_client = $this->get_oauth_client();

		$access_token = $auth_client->get_client()->getAccessToken();

		// Site Kit is connected if it has credentials or if it is not using the proxy (only possible via filter).
		$data['isSiteKitConnected'] = $this->credentials->has() || ! $auth_client->using_proxy();

		$data['isAuthenticated']    = ! empty( $access_token );
		$data['requiredScopes']     = $auth_client->get_required_scopes();
		$data['grantedScopes']      = ! empty( $access_token ) ? $auth_client->get_granted_scopes() : array();
		$data['needReauthenticate'] = $data['isAuthenticated'] && $this->need_reauthenticate();

		// All admins need to go through site verification process.
		if ( current_user_can( Permissions::MANAGE_OPTIONS ) ) {
			$data['isVerified'] = $this->verification->has();
		} else {
			$data['isVerified'] = false;
		}

		// Flag the first admin user.
		$first_admin_id  = (int) $this->first_admin->get();
		$current_user_id = get_current_user_id();
		if ( ! $first_admin_id && current_user_can( Permissions::MANAGE_OPTIONS ) ) {
			$first_admin_id = $current_user_id;
			$this->first_admin->set( $first_admin_id );
		}
		$data['isFirstAdmin'] = ( $current_user_id === $first_admin_id );

		// The actual data for this is passed in from the Search Console module.
		if ( ! isset( $data['hasSearchConsoleProperty'] ) ) {
			$data['hasSearchConsoleProperty'] = false;
		}

		$reauth                        = isset( $_GET['reAuth'] ) ? ( 'true' === $_GET['reAuth'] ) : false; // phpcs:ignore WordPress.CSRF.NoNonceVerification.
		$data['showModuleSetupWizard'] = $reauth;

		$module_to_setup       = isset( $_GET['slug'] ) ? sanitize_key( $_GET['slug'] ) : ''; // phpcs:ignore WordPress.CSRF.NoNonceVerification.
		$data['moduleToSetup'] = $module_to_setup;

		return $data;
	}

	/**
	 * Prints site verification meta in wp_head().
	 *
	 * @since 1.0.0
	 *
	 * @global wpdb $wpdb WordPress database abstraction object.
	 */
	private function print_site_verification_meta() {
		global $wpdb;

		// Get verification meta tags for all users.
		$verification_tags = $this->verification_tag->get_all();

		if ( empty( $verification_tags ) ) {
			return;
		}

		$allowed_html = array(
			'meta' => array(
				'name'    => array(),
				'content' => array(),
			),
		);

		foreach ( $verification_tags as $verification_tag ) {
			echo wp_kses( html_entity_decode( $verification_tag ), $allowed_html );
		}
	}

	/**
	 * Add allowed redirect host to safe wp_safe_redirect
	 *
	 * @since 1.0.0
	 *
	 * @param array $hosts Array of safe hosts to redirect to.
	 *
	 * @return array
	 */
	private function allowed_redirect_hosts( $hosts ) {
		$hosts[] = 'accounts.google.com';
		$hosts[] = 'sitekit.withgoogle.com';

		return $hosts;
	}

	/**
	 * Shows admin notification for authentication related issues.
	 *
	 * @since 1.0.0
	 *
	 * @param array $notices Array of admin notices.
	 *
	 * @return array Array of admin notices.
	 */
	private function authentication_admin_notices( $notices ) {

		// Only include notices if in the correct admin panel.
		if ( $this->context->is_network_mode() !== is_network_admin() ) {
			return $notices;
		}

		$notices[] = $this->get_reauthentication_needed_notice();
		$notices[] = $this->get_authentication_oauth_error_notice();
		$notices[] = $this->get_disconnected_user_notice();

		return $notices;
	}

	/**
	 * Gets disconnected user notice.
	 *
	 * @since 1.0.0
	 *
	 * @return Notice Notice object.
	 */
	private function get_disconnected_user_notice() {
		return new Notice(
			'googlesitekit_user_disconnected',
			array(
				'content'         => function() {
					ob_start();
					?>
					<p>
						<?php esc_html_e( 'Successfully disconnected from Site Kit by Google.', 'google-site-kit' ); ?>
					</p>
					<?php
					return ob_get_clean();
				},
				'type'            => Notice::TYPE_SUCCESS,
				'active_callback' => function() {
					if ( isset( $_GET['notification'] ) && 'googlesitekit_user_disconnected' === $_GET['notification'] ) { // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
						return true;
					}
					return false;
				},
			)
		);
	}

	/**
	 * Gets re-authentication notice.
	 *
	 * @since 1.0.0
	 *
	 * @return Notice Notice object.
	 */
	private function get_reauthentication_needed_notice() {
		return new Notice(
			'needs_reauthentication',
			array(
				'content'         => function() {
					ob_start();
					?>
					<p>
						<?php esc_html_e( 'You need to reauthenticate your Google account.', 'google-site-kit' ); ?>
						<a
							href="#"
							onclick="clearSiteKitAppStorage()"
						><?php esc_html_e( 'Click here', 'google-site-kit' ); ?></a>
					</p>
					<script>
						function clearSiteKitAppStorage() {
							if ( localStorage ) {
								localStorage.clear();
							}
							if ( sessionStorage ) {
								sessionStorage.clear();
							}
							document.location = '<?php echo esc_url_raw( $this->get_connect_url() ); ?>';
						}
					</script>
					<?php
					return ob_get_clean();
				},
				'type'            => Notice::TYPE_SUCCESS,
				'active_callback' => function() {
					return $this->need_reauthenticate();
				},
			)
		);
	}

	/**
	 * Gets OAuth error notice.
	 *
	 * @since 1.0.0
	 *
	 * @return Notice Notice object.
	 */
	private function get_authentication_oauth_error_notice() {

		return new Notice(
			'oauth_error',
			array(
				'content'         => function() {
					$message     = '';
					$auth_client = $this->get_oauth_client();
					if ( isset( $_GET['notification'] ) && 'authentication_success' === $_GET['notification'] && ! empty( $_GET['error'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
						$message = $auth_client->get_error_message( sanitize_key( $_GET['error'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
					}

					// If message is empty, check if we have the stored error message.
					if ( empty( $message ) ) {
						$message     = $this->user_options->get( Clients\OAuth_Client::OPTION_ERROR_CODE );
						if ( $message ) {
							$message = $auth_client->get_error_message( $message );
							// Delete it from database to prevent future notice.
							$this->user_options->delete( Clients\OAuth_Client::OPTION_ERROR_CODE );
						}
					}

					if ( empty( $message ) ) {
						return '';
					}

					$message = wp_kses(
						$message,
						array(
							'a'      => array(
								'href' => array(),
							),
							'strong' => array(),
							'em'     => array(),
						)
					);

					return '<p>' . $message . '</p>';
				},
				'type'            => Notice::TYPE_ERROR,
				'active_callback' => function() {
					if ( isset( $_GET['notification'] ) && 'authentication_success' === $_GET['notification'] && ! empty( $_GET['error'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.NoNonceVerification
						return true;
					}

					return (bool) $this->user_options->get( Clients\OAuth_Client::OPTION_ERROR_CODE );
				},
			)
		);
	}

	/**
	 * Checks if the current user needs to reauthenticate (e.g. because of new requested scopes).
	 *
	 * @since 1.0.0
	 *
	 * @return bool TRUE if need reauthenticate and FALSE otherwise.
	 */
	private function need_reauthenticate() {
		$auth_client = $this->get_oauth_client();

		$access_token = $auth_client->get_access_token();
		if ( empty( $access_token ) ) {
			return false;
		}

		$granted_scopes  = $auth_client->get_granted_scopes();
		$required_scopes = $auth_client->get_required_scopes();

		$required_and_granted_scopes = array_intersect( $granted_scopes, $required_scopes );

		return count( $required_and_granted_scopes ) < count( $required_scopes );
	}
}
