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

use Google\Site_Kit\Core\Assets\Asset;
use Google\Site_Kit\Core\Assets\Script;
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
use Google\Site_Kit\Modules\Sign_In_With_Google\Hashed_User_ID;
use Google\Site_Kit\Modules\Sign_In_With_Google\Profile_Reader;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings;
use Google\Site_Kit\Modules\Sign_In_With_Google\Tag_Matchers;
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
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.137.0
	 * @since 1.141.0 Add functionality to allow users to disconnect their own account and admins to disconnect any user.
	 */
	public function register() {
		add_filter( 'wp_login_errors', array( $this, 'handle_login_errors' ) );

		add_action(
			'login_form_' . self::ACTION_AUTH,
			function () {
				$settings = $this->get_settings();

				$profile_reader = new Profile_Reader( $settings );
				$authenticator  = new Authenticator( $this->user_options, $profile_reader );

				$this->handle_auth_callback( $authenticator );
			}
		);

		add_action( 'admin_action_' . self::ACTION_DISCONNECT, fn () => $this->handle_disconnect_user() );

		add_action( 'login_form', $this->get_method_proxy( 'render_signin_button' ) );

		add_action( 'show_user_profile', $this->get_method_proxy( 'render_disconnect_profile' ) ); // This action shows the disconnect section on the users own profile page.
		add_action( 'edit_user_profile', $this->get_method_proxy( 'render_disconnect_profile' ) ); // This action shows the disconnect section on other users profile page to allow admins to disconnect others.

		add_action( 'woocommerce_login_form_start', $this->get_method_proxy( 'render_signin_button' ) );
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
				$error->add( self::MODULE_SLUG, __( 'Sign in with Google failed.', 'google-site-kit' ) );
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
		global $wp;
		$is_woo_commerce_login = 'my-account' === $wp->request;

		$settings = $this->get_settings()->get();
		if ( ! $settings['clientID'] ) {
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

		// Render the Sign in with Google button and related inline styles.
		printf( "\n<!-- %s -->\n", esc_html__( 'Sign in with Google button added by Site Kit', 'google-site-kit' ) );
		BC_Functions::wp_print_script_tag( array( 'src' => 'https://accounts.google.com/gsi/client' ) );
		ob_start();
		?>
( () => {
	const parent = document.createElement( 'div' );
<?php if ( $is_woo_commerce_login ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
	document.getElementsByClassName( 'login' )[0]?.insertBefore( parent, document.getElementsByClassName( 'woocommerce-form-row' )[0] );
		<?php else : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
	document.getElementById( 'login' ).insertBefore( parent, document.getElementById( 'loginform' ) );
		<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>

	async function handleCredentialResponse( response ) {
		try {
			const res = await fetch( '<?php echo esc_js( $login_uri ); ?>', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams( response )
			});
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
	} );

	google.accounts.id.renderButton( parent, <?php echo wp_json_encode( $btn_args ); ?> );

<?php if ( $settings['oneTapEnabled'] ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
	google.accounts.id.prompt();
		<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>

<?php if ( ! empty( $redirect_to ) ) : // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
	const expires = new Date();
	expires.setTime( expires.getTime() + 1000 * 60 * 5 );
	document.cookie = "<?php echo esc_js( Authenticator::COOKIE_REDIRECT_TO ); ?>=<?php echo esc_js( $redirect_to ); ?>;expires="  + expires.toUTCString() + ";path=<?php echo esc_js( Authenticator::get_cookie_path() ); ?>";
		<?php endif; // phpcs:ignore Generic.WhiteSpace.ScopeIndent.Incorrect ?>
} )();
		<?php
		BC_Functions::wp_print_inline_script_tag( ob_get_clean() );
		printf( "\n<!-- %s -->\n", esc_html__( 'End Sign in with Google button added by Site Kit', 'google-site-kit' ) );
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
				'label' => __( 'Sign in with Google: Client ID', 'google-site-kit' ),
				'value' => $settings['clientID'],
				'debug' => Debug_Data::redact_debug_value( $settings['clientID'] ),
			),
			'sign_in_with_google_shape'                    => array(
				'label' => __( 'Sign in with Google: Shape', 'google-site-kit' ),
				'value' => $this->get_settings()->get_label( 'shape', $settings['shape'] ),
				'debug' => $settings['shape'],
			),
			'sign_in_with_google_text'                     => array(
				'label' => __( 'Sign in with Google: Text', 'google-site-kit' ),
				'value' => $this->get_settings()->get_label( 'text', $settings['text'] ),
				'debug' => $settings['text'],
			),
			'sign_in_with_google_theme'                    => array(
				'label' => __( 'Sign in with Google: Theme', 'google-site-kit' ),
				'value' => $this->get_settings()->get_label( 'theme', $settings['theme'] ),
				'debug' => $settings['theme'],
			),
			'sign_in_with_google_use_snippet'              => array(
				'label' => __( 'Sign in with Google: One-tap Enabled', 'google-site-kit' ),
				'value' => $settings['oneTapEnabled'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => $settings['oneTapEnabled'] ? 'yes' : 'no',
			),
			'sign_in_with_google_authenticated_user_count' => array(
				'label' => __( 'Sign in with Google: Number of users who have authenticated using Sign in with Google', 'google-site-kit' ),
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
			__( 'Sign in with Google button added by Site Kit', 'google-site-kit' );

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
	<h2><?php esc_html_e( 'Sign in with Google via Site Kit by Google', 'google-site-kit' ); ?></h2>
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
}
