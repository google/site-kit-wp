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
use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\WooCommerce;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Tag;
use Google\Site_Kit\Core\Modules\Module_With_Tag_Trait;
use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Matchers;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Site_Health\Debug_Data;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Sign_In_With_Google\Authenticator;
use Google\Site_Kit\Modules\Sign_In_With_Google\Authenticator_Interface;
use Google\Site_Kit\Modules\Sign_In_With_Google\Existing_Client_ID;
use Google\Site_Kit\Modules\Sign_In_With_Google\Hashed_User_ID;
use Google\Site_Kit\Modules\Sign_In_With_Google\Profile_Reader;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings;
use Google\Site_Kit\Modules\Sign_In_With_Google\Tag_Matchers;
use Google\Site_Kit\Modules\Sign_In_With_Google\WooCommerce_Authenticator;
use WP_Error;
use WP_User;

/**
 * Class representing the Sign in with Google module.
 *
 * @since 1.137.0
 * @access private
 * @ignore
 */
final class Sign_In_With_Google extends Module implements Module_With_Assets, Module_With_Settings, Module_With_Deactivation, Module_With_Debug_Fields, Module_With_Tag {

	use Method_Proxy_Trait;
	use Module_With_Assets_Trait;
	use Module_With_Settings_Trait;
	use Module_With_Tag_Trait;

	/**
	 * Module slug name.
	 */
	const MODULE_SLUG = 'sign-in-with-google';

	/**
	 * Authentication action name.
	 */
	const ACTION_AUTH = 'googlesitekit_auth';

	/**
	 * Disconnect action name.
	 */
	const ACTION_DISCONNECT = 'googlesitekit_auth_disconnect';

	/**
	 * Existing_Client_ID instance.
	 *
	 * @since 1.142.0
	 * @var Existing_Client_ID
	 */
	protected $existing_client_id;

	/**
	 * Constructor.
	 *
	 * @since 1.142.0
	 *
	 * @param Context        $context        Plugin context.
	 * @param Options        $options        Optional. Option API instance. Default is a new instance.
	 * @param User_Options   $user_options   Optional. User Option API instance. Default is a new instance.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 * @param Assets         $assets  Optional. Assets API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null,
		Authentication $authentication = null,
		Assets $assets = null
	) {
		parent::__construct( $context, $options, $user_options, $authentication, $assets );
		$this->existing_client_id = new Existing_Client_ID( $this->options );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.137.0
	 * @since 1.141.0 Add functionality to allow users to disconnect their own account and admins to disconnect any user.
	 */
	public function register() {
		add_filter( 'wp_login_errors', array( $this, 'handle_login_errors' ) );

		add_filter( 'googlesitekit_inline_modules_data', $this->get_method_proxy( 'inline_existing_client_id' ), 10 );

		add_action(
			'login_form_' . self::ACTION_AUTH,
			function () {
				$settings       = $this->get_settings();
				$profile_reader = new Profile_Reader( $settings );

				$integration = $this->context->input()->filter( INPUT_POST, 'integration' );

				$authenticator_class = Authenticator::class;
				if ( 'woocommerce' === $integration && class_exists( 'woocommerce' ) ) {
					$authenticator_class = WooCommerce_Authenticator::class;
				}

				$this->handle_auth_callback( new $authenticator_class( $this->user_options, $profile_reader ) );
			}
		);

		add_action( 'admin_action_' . self::ACTION_DISCONNECT, array( $this, 'handle_disconnect_user' ) );

		add_action( 'show_user_profile', $this->get_method_proxy( 'render_disconnect_profile' ) ); // This action shows the disconnect section on the users own profile page.
		add_action( 'edit_user_profile', $this->get_method_proxy( 'render_disconnect_profile' ) ); // This action shows the disconnect section on other users profile page to allow admins to disconnect others.

		// (Potentially) render the Sign in with Google script tags/buttons.
		add_action( 'wp_footer', $this->get_method_proxy( 'render_signinwithgoogle' ) );
		// Output the Sign in with Google JS on the WordPress login page.
		add_action( 'login_footer', $this->get_method_proxy( 'render_signinwithgoogle' ) );

		// Delete client ID stored from previous module connection on module reconnection.
		add_action(
			'googlesitekit_save_settings_' . self::MODULE_SLUG,
			function () {
				if ( $this->is_connected() ) {
					$this->existing_client_id->delete();
				}
			}
		);

		add_action( 'woocommerce_before_customer_login_form', array( $this, 'handle_woocommerce_errors' ), 1 );
	}

	/**
	 * Handles the callback request after the user signs in with Google.
	 *
	 * @since 1.140.0
	 *
	 * @param Authenticator_Interface $authenticator Authenticator instance.
	 */
	private function handle_auth_callback( Authenticator_Interface $authenticator ) {
		$input = $this->context->input();

		// Ignore the request if the request method is not POST.
		$request_method = $input->filter( INPUT_SERVER, 'REQUEST_METHOD' );
		if ( 'POST' !== $request_method ) {
			return;
		}

		$redirect_to = $authenticator->authenticate_user( $input );
		if ( ! empty( $redirect_to ) ) {
			wp_safe_redirect( $redirect_to );
			exit;
		}
	}

	/**
	 * Adds custom errors if Google auth flow failed.
	 *
	 * @since 1.140.0
	 *
	 * @param WP_Error $error WP_Error instance.
	 * @return WP_Error $error WP_Error instance.
	 */
	public function handle_login_errors( $error ) {
		$error_code = $this->context->input()->filter( INPUT_GET, 'error' );
		if ( ! $error_code ) {
			return $error;
		}

		switch ( $error_code ) {
			case Authenticator::ERROR_INVALID_REQUEST:
				/* translators: %s: Sign in with Google service name */
				$error->add( self::MODULE_SLUG, sprintf( __( 'Login with %s failed.', 'google-site-kit' ), _x( 'Sign in with Google', 'Service name', 'google-site-kit' ) ) );
				break;
			case Authenticator::ERROR_SIGNIN_FAILED:
				$error->add( self::MODULE_SLUG, __( 'The user is not registered on this site.', 'google-site-kit' ) );
				break;
			default:
				break;
		}

		return $error;
	}

	/**
	 * Adds custom errors if Google auth flow failed on WooCommerce login.
	 *
	 * @since 1.145.0
	 */
	public function handle_woocommerce_errors() {
		$err = $this->handle_login_errors( new WP_Error() );
		if ( is_wp_error( $err ) && $err->has_errors() ) {
			wc_add_notice( $err->get_error_message(), 'error' );
		}
	}

	/**
	 * Cleans up when the module is deactivated.
	 *
	 * Persist the clientID on module disconnection, so it can be
	 * reused if the module were to be reconnected.
	 *
	 * @since 1.137.0
	 */
	public function on_deactivation() {
		$pre_deactivation_settings = $this->get_settings()->get();

		if ( ! empty( $pre_deactivation_settings['clientID'] ) ) {
			$this->existing_client_id->set( $pre_deactivation_settings['clientID'] );
		}

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
			'description' => __( 'Improve user engagement, trust and data privacy, while creating a simple, secure and personalized experience for your visitors', 'google-site-kit' ),
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
	 * Renders the Sign in with Google JS script tags, One-tap code, and
	 * buttons.
	 *
	 * @since 1.139.0
	 * @since 1.144.0 Renamed to `render_signinwithgoogle` and conditionally
	 *                rendered the code to replace buttons.
	 */
	private function render_signinwithgoogle() {
		$is_wp_login          = is_login();
		$is_woocommerce       = class_exists( 'woocommerce' );
		$is_woocommerce_login = did_action( 'woocommerce_login_form_start' );

		$settings = $this->get_settings()->get();

		// If there's no client ID available, don't render the button.
		if ( ! $settings['clientID'] ) {
			return;
		}

		// If this is not the WordPress or WooCommerce login page, check to
		// see if "One-tap enabled on all pages" is set first. If it isnt:
		// don't render the Sign in with Google JS.
		if ( ! $is_wp_login && ! $is_woocommerce_login && ! $settings['oneTapOnAllPages'] ) {
			return;
		}

		$login_uri = add_query_arg( 'action', self::ACTION_AUTH, wp_login_url() );
		if ( substr( $login_uri, 0, 5 ) !== 'https' ) {
			return;
		}

		$redirect_to = $this->context->input()->filter( INPUT_GET, 'redirect_to' );
		if ( ! empty( $redirect_to ) ) {
			$redirect_to = trim( $redirect_to );
		}

		$btn_args = array(
			'theme' => $settings['theme'],
			'text'  => $settings['text'],
			'shape' => $settings['shape'],
		);

		// Whether buttons will be rendered/transformed on this page.
		$render_buttons = $is_wp_login || $is_woocommerce_login;

		// Render the Sign in with Google script.
		ob_start();

		?>
( () => {
	async function handleCredentialResponse( response ) {
		<?php if ( $is_woocommerce && ! $is_wp_login ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
		response.integration = 'woocommerce';
		<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
		try {
			const res = await fetch( '<?php echo esc_js( $login_uri ); ?>', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams( response )
			} );
			if ( res.ok && res.redirected ) {
				location.assign( res.url );
			}
		} catch( error ) {
			console.error( error );
		}
	}

	google.accounts.id.initialize( {
		client_id: '<?php echo esc_js( $settings['clientID'] ); ?>',
		callback: handleCredentialResponse,
		library_name: 'Site-Kit'
	} );

	<?php if ( $render_buttons ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
		const parent = document.createElement( 'div' );

		<?php if ( $is_wp_login ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
			document.getElementById( 'login' ).insertBefore( parent, document.getElementById( 'loginform' ) );
		<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>

		<?php if ( $is_woocommerce_login ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
			for ( const login of document.getElementsByClassName( 'login' ) ) {
				login.insertBefore( parent, login.firstChild );
			}
		<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>

		google.accounts.id.renderButton( parent, <?php echo wp_json_encode( $btn_args ); ?> );

		<?php if ( ! empty( $redirect_to ) ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
			const expires = new Date();
			expires.setTime( expires.getTime() + 300000 );<?php // 5 minutes ?>
			document.cookie = "<?php echo esc_js( Authenticator::COOKIE_REDIRECT_TO ); ?>=<?php echo esc_js( $redirect_to ); ?>;expires="  + expires.toUTCString() + ";path=<?php echo esc_js( Authenticator::get_cookie_path() ); ?>";
		<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
	<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>

	<?php if ( ! empty( $settings['oneTapEnabled'] ) && ( $is_wp_login || ! is_user_logged_in() ) ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
		google.accounts.id.prompt();
	<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
} )();
		<?php

		// Strip all whitespace and unnecessary spaces.
		$inline_script = preg_replace( '/\s+/', ' ', ob_get_clean() );
		$inline_script = preg_replace( '/\s*([{};\(\)\+:,=])\s*/', '$1', $inline_script );

		// Output the Sign in with Google script.
		print( "\n<!-- Sign in with Google button added by Site Kit -->\n" );
		BC_Functions::wp_print_script_tag( array( 'src' => 'https://accounts.google.com/gsi/client' ) );
		BC_Functions::wp_print_inline_script_tag( $inline_script );
		print( "\n<!-- End Sign in with Google button added by Site Kit -->\n" );
	}

	/**
	 * Gets the absolute number of users who have authenticated using Sign in with Google.
	 *
	 * @since 1.140.0
	 *
	 * @return int
	 */
	public function get_authenticated_users_count() {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		return (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT( user_id ) FROM $wpdb->usermeta WHERE meta_key = %s",
				$this->user_options->get_meta_key( Hashed_User_ID::OPTION )
			)
		);
	}

	/**
	 * Gets an array of debug field definitions.
	 *
	 * @since 1.140.0
	 *
	 * @return array
	 */
	public function get_debug_fields() {
		$settings = $this->get_settings()->get();

		$authenticated_user_count = $this->get_authenticated_users_count();

		$debug_fields = array(
			'sign_in_with_google_client_id'                => array(
				/* translators: %s: Sign in with Google service name */
				'label' => sprintf( __( '%s: Client ID', 'google-site-kit' ), _x( 'Sign in with Google', 'Service name', 'google-site-kit' ) ),
				'value' => $settings['clientID'],
				'debug' => Debug_Data::redact_debug_value( $settings['clientID'] ),
			),
			'sign_in_with_google_shape'                    => array(
				/* translators: %s: Sign in with Google service name */
				'label' => sprintf( __( '%s: Shape', 'google-site-kit' ), _x( 'Sign in with Google', 'Service name', 'google-site-kit' ) ),
				'value' => $this->get_settings()->get_label( 'shape', $settings['shape'] ),
				'debug' => $settings['shape'],
			),
			'sign_in_with_google_text'                     => array(
				/* translators: %s: Sign in with Google service name */
				'label' => sprintf( __( '%s: Text', 'google-site-kit' ), _x( 'Sign in with Google', 'Service name', 'google-site-kit' ) ),
				'value' => $this->get_settings()->get_label( 'text', $settings['text'] ),
				'debug' => $settings['text'],
			),
			'sign_in_with_google_theme'                    => array(
				/* translators: %s: Sign in with Google service name */
				'label' => sprintf( __( '%s: Theme', 'google-site-kit' ), _x( 'Sign in with Google', 'Service name', 'google-site-kit' ) ),
				'value' => $this->get_settings()->get_label( 'theme', $settings['theme'] ),
				'debug' => $settings['theme'],
			),
			'sign_in_with_google_use_snippet'              => array(
				/* translators: %s: Sign in with Google service name */
				'label' => sprintf( __( '%s: One-tap Enabled', 'google-site-kit' ), _x( 'Sign in with Google', 'Service name', 'google-site-kit' ) ),
				'value' => $settings['oneTapEnabled'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => $settings['oneTapEnabled'] ? 'yes' : 'no',
			),
			'sign_in_with_google_authenticated_user_count' => array(
				/* translators: %1$s: Sign in with Google service name */
				'label' => sprintf( __( '%1$s: Number of users who have authenticated using %1$s', 'google-site-kit' ), _x( 'Sign in with Google', 'Service name', 'google-site-kit' ) ),
				'value' => $authenticated_user_count,
				'debug' => $authenticated_user_count,
			),
		);

		return $debug_fields;
	}

	/**
	 * Implements mandatory interface method.
	 *
	 * This module doesn't use the usual tag registration within Site kit
	 * to place its snippet. However, it does leverage the Tag_Placement functionality
	 * to check if a tag is successfully placed or not within WordPress's Site Health.
	 */
	public function register_tag() {
	}

	/**
	 * Returns the Module_Tag_Matchers instance.
	 *
	 * @since 1.140.0
	 *
	 * @return Module_Tag_Matchers Module_Tag_Matchers instance.
	 */
	public function get_tag_matchers() {
		return new Tag_Matchers();
	}

	/**
	 * Gets the URL of the page(s) where a tag for the module would be placed.
	 *
	 * For all modules like Analytics, Tag Manager, AdSense, Ads, etc. except for
	 * Sign in with Google, tags can be detected on the home page. SiwG places its
	 * snippet on the login page and thus, overrides this method.
	 *
	 * @since 1.140.0
	 *
	 * @return string TRUE if tag is found, FALSE if not.
	 */
	public function get_content_url() {
		$wp_login_url = wp_login_url();

		$woo_commerce = new WooCommerce( $this->context );
		if ( $woo_commerce->is_active() ) {
			$wc_login_page_id = wc_get_page_id( 'myaccount' );
			$wc_login_url     = get_permalink( $wc_login_page_id );
			return array(
				'WordPress Login Page'   => $wp_login_url,
				'WooCommerce Login Page' => $wc_login_url,
			);
		}
		return $wp_login_url;
	}

	/**
	 * Checks if the Sign in with Google button, specifically inserted by Site Kit,
	 * is found in the provided content.
	 *
	 * This method overrides the `Module_With_Tag_Trait` implementation since the HTML
	 * comment inserted for SiwG's button is different to the standard comment inserted
	 * for other modules' script snippets. This should be improved as speicified in the
	 * TODO within the trait method.
	 *
	 * @since 1.140.0
	 *
	 * @param string $content Content to search for the button.
	 * @return bool TRUE if tag is found, FALSE if not.
	 */
	public function has_placed_tag_in_content( $content ) {
		$search_string              = 'Sign in with Google button added by Site Kit';
		$search_translatable_string =
			/* translators: %s: Sign in with Google service name */
			sprintf( __( '%s button added by Site Kit', 'google-site-kit' ), _x( 'Sign in with Google', 'Service name', 'google-site-kit' ) );

		if ( strpos( $content, $search_string ) !== false || strpos( $content, $search_translatable_string ) !== false ) {
			return Module_Tag_Matchers::TAG_EXISTS_WITH_COMMENTS;
		}

		return Module_Tag_Matchers::NO_TAG_FOUND;
	}

	/**
	 * Returns the disconnect URL for the specified user.
	 *
	 * @since 1.141.0
	 *
	 * @param int $user_id WordPress User ID.
	 */
	public static function disconnect_url( $user_id ) {
		return add_query_arg(
			array(
				'action'  => self::ACTION_DISCONNECT,
				'nonce'   => wp_create_nonce( self::ACTION_DISCONNECT . '-' . $user_id ),
				'user_id' => $user_id,
			),
			admin_url( 'index.php' )
		);
	}

	/**
	 * Handles the disconnect action.
	 *
	 * @since 1.141.0
	 */
	public function handle_disconnect_user() {
		$input   = $this->context->input();
		$nonce   = $input->filter( INPUT_GET, 'nonce' );
		$user_id = (int) $input->filter( INPUT_GET, 'user_id' );
		$action  = self::ACTION_DISCONNECT . '-' . $user_id;

		if ( ! wp_verify_nonce( $nonce, $action ) ) {
			$this->authentication->invalid_nonce_error( $action );
		}

		// Only allow this action for admins or users own setting.
		if ( current_user_can( 'edit_user', $user_id ) ) {
			$hashed_user_id = new Hashed_User_ID( new User_Options( $this->context, $user_id ) );
			$hashed_user_id->delete();
			wp_safe_redirect( add_query_arg( 'updated', true, get_edit_user_link( $user_id ) ) );
			exit;
		}

		wp_safe_redirect( get_edit_user_link( $user_id ) );
		exit;
	}

	/**
	 * Displays a disconnect button on user profile pages.
	 *
	 * @since 1.141.0
	 *
	 * @param WP_User $user WordPress user object.
	 */
	private function render_disconnect_profile( WP_User $user ) {
		if ( ! current_user_can( 'edit_user', $user->ID ) ) {
			return;
		}

		$hashed_user_id         = new Hashed_User_ID( new User_Options( $this->context, $user->ID ) );
		$current_user_google_id = $hashed_user_id->get();

		// Don't show if the user does not have a Google ID saved in user meta.
		if ( empty( $current_user_google_id ) ) {
			return;
		}

		?>
<div id="googlesitekit-sign-in-with-google-disconnect">
	<h2>
		<?php
		/* translators: %1$s: Sign in with Google service name, %2$s: Plugin name */
		echo esc_html( sprintf( __( '%1$s (via %2$s)', 'google-site-kit' ), _x( 'Sign in with Google', 'Service name', 'google-site-kit' ), __( 'Site Kit by Google', 'google-site-kit' ) ) );
		?>
	</h2>
	<p>
		<?php
		if ( get_current_user_id() === $user->ID ) {
			esc_html_e(
				'You can sign in with your Google account.',
				'google-site-kit'
			);
		} else {
			esc_html_e(
				'This user can sign in with their Google account.',
				'google-site-kit'
			);
		}
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

	/**
	 * Exposes an existing client ID from a previous connection
	 * to JS via _googlesitekitModulesData.
	 *
	 * @since 1.142.0
	 *
	 * @param array $modules_data Inline modules data.
	 * @return array Inline modules data.
	 */
	protected function inline_existing_client_id( $modules_data ) {
		$existing_client_id = $this->existing_client_id->get();

		if ( $existing_client_id ) {
			// Add the data under the `sign-in-with-google` key to make it clear it's scoped to this module.
			$modules_data['sign-in-with-google'] = array(
				'existingClientID' => $existing_client_id,
			);
		}

		return $modules_data;
	}
}
