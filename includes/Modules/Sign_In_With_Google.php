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
use Google\Site_Kit\Core\Assets\Stylesheet;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Assets;
use Google\Site_Kit\Core\Modules\Module_With_Assets_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Deactivation;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Module_With_Inline_Data;
use Google\Site_Kit\Core\Modules\Module_With_Inline_Data_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Modules\Module_With_Settings_Trait;
use Google\Site_Kit\Core\Modules\Module_With_Tag;
use Google\Site_Kit\Core\Modules\Module_With_Tag_Trait;
use Google\Site_Kit\Core\Modules\Tags\Module_Tag_Matchers;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Site_Health\Debug_Data;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tracking\Feature_Metrics_Trait;
use Google\Site_Kit\Core\Tracking\Provides_Feature_Metrics;
use Google\Site_Kit\Core\Util\BC_Functions;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\Sign_In_With_Google\Authenticator;
use Google\Site_Kit\Modules\Sign_In_With_Google\Authenticator_Interface;
use Google\Site_Kit\Modules\Sign_In_With_Google\Existing_Client_ID;
use Google\Site_Kit\Modules\Sign_In_With_Google\Hashed_User_ID;
use Google\Site_Kit\Modules\Sign_In_With_Google\Profile_Reader;
use Google\Site_Kit\Modules\Sign_In_With_Google\Settings;
use Google\Site_Kit\Modules\Sign_In_With_Google\Sign_In_With_Google_Block;
use Google\Site_Kit\Modules\Sign_In_With_Google\Tag_Guard;
use Google\Site_Kit\Modules\Sign_In_With_Google\Tag_Matchers;
use Google\Site_Kit\Modules\Sign_In_With_Google\Web_Tag;
use Google\Site_Kit\Modules\Sign_In_With_Google\WooCommerce_Authenticator;
use Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks\Compatibility_Checks;
use Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks\WP_Login_Accessible_Check;
use Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks\WP_COM_Check;
use Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks\Conflicting_Plugins_Check;
use Google\Site_Kit\Modules\Sign_In_With_Google\Datapoint\Compatibility_Checks as Compatibility_Checks_Datapoint;
use WP_Error;
use WP_User;

/**
 * Class representing the Sign in with Google module.
 *
 * @since 1.137.0
 * @access private
 * @ignore
 */
final class Sign_In_With_Google extends Module implements Module_With_Inline_Data, Module_With_Assets, Module_With_Settings, Module_With_Deactivation, Module_With_Debug_Fields, Module_With_Tag, Provides_Feature_Metrics {

	use Method_Proxy_Trait;
	use Module_With_Assets_Trait;
	use Module_With_Settings_Trait;
	use Module_With_Tag_Trait;
	use Module_With_Inline_Data_Trait;
	use Feature_Metrics_Trait;

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
	 * Sign in with Google Block instance.
	 *
	 * @since 1.147.0
	 * @var Sign_In_With_Google_Block
	 */
	protected $sign_in_with_google_block;

	/**
	 * Stores the active state of the WooCommerce plugin.
	 *
	 * @since 1.148.0
	 * @var bool Whether WooCommerce is active or not.
	 */
	protected $is_woocommerce_active;


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
		?Options $options = null,
		?User_Options $user_options = null,
		?Authentication $authentication = null,
		?Assets $assets = null
	) {
		parent::__construct( $context, $options, $user_options, $authentication, $assets );

		$this->existing_client_id        = new Existing_Client_ID( $this->options );
		$this->sign_in_with_google_block = new Sign_In_With_Google_Block( $this->context );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.137.0
	 * @since 1.141.0 Add functionality to allow users to disconnect their own account and admins to disconnect any user.
	 */
	public function register() {
		$this->register_inline_data();
		$this->register_feature_metrics();

		add_filter( 'wp_login_errors', array( $this, 'handle_login_errors' ) );

		add_action( 'googlesitekit_render_sign_in_with_google_button', array( $this, 'render_sign_in_with_google_button' ), 10, 1 );

		// Add support for a shortcode to render the Sign in with Google button.
		add_shortcode( 'site_kit_sign_in_with_google', array( $this, 'render_siwg_shortcode' ) );

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

		// Output the Sign in with Google <div> in the WooCommerce login form.
		add_action( 'woocommerce_login_form_start', $this->get_method_proxy( 'render_signinwithgoogle_woocommerce' ) );
		// Output the Sign in with Google <div> in any use of wp_login_form.
		add_filter( 'login_form_top', $this->get_method_proxy( 'render_button_in_wp_login_form' ) );

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

		// Sign in with Google tag placement logic.
		add_action( 'template_redirect', array( $this, 'register_tag' ) );
		// Used to add the tag registration to the login footer in
		// `/wp-login.php`, which doesn't use the `template_redirect` action
		// like most WordPress pages.
		add_action( 'login_init', array( $this, 'register_tag' ) );

		// Place Sign in with Google button next to comments form if the
		// setting is enabled.
		add_action( 'comment_form_after_fields', array( $this, 'handle_comments_form' ) );

		// Add the Sign in with Google compatibility checks datapoint to our
		// preloaded paths.
		add_filter(
			'googlesitekit_apifetch_preload_paths',
			function ( $paths ) {
				return array_merge(
					$paths,
					array(
						'/' . REST_Routes::REST_ROOT . '/modules/sign-in-with-google/data/compatibility-checks',
					)
				);
			}
		);

		// Check to see if the module is connected before registering the block.
		if ( $this->is_connected() ) {
			$this->sign_in_with_google_block->register();
		}
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
	 * Conditionally show the Sign in with Google button in a comments form.
	 *
	 * @since 1.165.0
	 */
	public function handle_comments_form() {
		$settings            = $this->get_settings()->get();
		$anyone_can_register = (bool) get_option( 'users_can_register' );

		// Only show the button if:
		// - the comments form setting is enabled
		// - open user registration is enabled
		//
		// If the comments form setting is not enabled, do nothing.
		if ( empty( $settings['showNextToCommentsEnabled'] ) || ! $anyone_can_register ) {
			return;
		}

		// Output the post ID to allow identitifying the post for this comment.
		$post_id = get_the_ID();

		// Output the Sign in with Google button in the comments form.
		do_action(
			'googlesitekit_render_sign_in_with_google_button',
			array(
				'class' => array(
					'googlesitekit-sign-in-with-google__comments-form-button',
					"googlesitekit-sign-in-with-google__comments-form-button-postid-{$post_id}",
				),
			)
		);
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
		$assets = array(
			new Script(
				'googlesitekit-modules-sign-in-with-google',
				array(
					'src'          => $this->context->url( 'dist/assets/js/googlesitekit-modules-sign-in-with-google.js' ),
					'dependencies' => array(
						'googlesitekit-vendor',
						'googlesitekit-api',
						'googlesitekit-data',
						'googlesitekit-modules',
						'googlesitekit-notifications',
						'googlesitekit-datastore-site',
						'googlesitekit-datastore-user',
						'googlesitekit-components',
					),
				)
			),
		);

		if ( Sign_In_With_Google_Block::can_register() && $this->is_connected() ) {
			$assets[] = new Script(
				'blocks-sign-in-with-google',
				array(
					'src'           => $this->context->url( 'dist/assets/blocks/sign-in-with-google/index.js' ),
					'dependencies'  => array(),
					'load_contexts' => array( Asset::CONTEXT_ADMIN_POST_EDITOR ),
				)
			);
			$assets[] = new Stylesheet(
				'blocks-sign-in-with-google-editor-styles',
				array(
					'src'           => $this->context->url( 'dist/assets/blocks/sign-in-with-google/editor-styles.css' ),
					'dependencies'  => array(),
					'load_contexts' => array( Asset::CONTEXT_ADMIN_POST_EDITOR ),
				)
			);
		}

		return $assets;
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
	 * Gets the datapoint definitions for the module.
	 *
	 * @since 1.164.0
	 *
	 * @return array List of datapoint definitions.
	 */
	protected function get_datapoint_definitions() {
		$checks = new Compatibility_Checks();
		$checks->add_check( new WP_Login_Accessible_Check() );
		$checks->add_check( new WP_COM_Check() );
		$checks->add_check( new Conflicting_Plugins_Check() );

		return array(
			'GET:compatibility-checks' => new Compatibility_Checks_Datapoint( array( 'checks' => $checks ) ),
		);
	}

	/**
	 * Renders the placeholder Sign in with Google div for the WooCommerce
	 * login form.
	 *
	 * @since 1.147.0
	 */
	private function render_signinwithgoogle_woocommerce() {
		/**
		 * Only render the button in a WooCommerce login page if:
		 *
		 * - the Sign in with Google module is connected
		 * - the user is not logged in
		 */
		if ( ! $this->is_connected() || is_user_logged_in() ) {
			return;
		}

		/**
		 * Display the Sign in with Google button.
		 *
		 * @since 1.164.0
		 *
		 * @param array $args Optional arguments to customize button attributes.
		 */
		do_action(
			'googlesitekit_render_sign_in_with_google_button',
			array(
				'class' => 'woocommerce-form-row form-row',
			)
		);
	}

	/**
	 * Checks if the Sign in with Google button can be rendered.
	 *
	 * @since 1.149.0
	 *
	 * @return bool True if the button can be rendered, false otherwise.
	 */
	private function can_render_signinwithgoogle() {
		$settings = $this->get_settings()->get();

		// If there's no client ID available, don't render the button.
		if ( ! $settings['clientID'] ) {
			return false;
		}

		if ( substr( wp_login_url(), 0, 5 ) !== 'https' ) {
			return false;
		}

		return true;
	}

	/**
	 * Appends the Sign in with Google button to content of a WordPress filter.
	 *
	 * @since 1.149.0
	 *
	 * @param string $content Existing content.
	 * @return string Possibly modified content.
	 */
	private function render_button_in_wp_login_form( $content ) {
		if ( $this->can_render_signinwithgoogle() ) {
			ob_start();
			/**
			 * Display the Sign in with Google button.
			 *
			 * @since 1.164.0
			 *
			 * @param array $args Optional arguments to customize button attributes.
			 */
			do_action( 'googlesitekit_render_sign_in_with_google_button' );
			$content .= ob_get_clean();
		}
		return $content;
	}

	/**
	 * Renders the Sign in with Google button markup.
	 *
	 * @since 1.164.0
	 *
	 * @param array $args Optional arguments to customize button attributes.
	 */
	public function render_sign_in_with_google_button( $args = array() ) {
		if ( ! is_array( $args ) ) {
			$args = array();
		}

		$default_classes   = array( 'googlesitekit-sign-in-with-google__frontend-output-button' );
		$classes_from_args = array();
		if ( ! empty( $args['class'] ) ) {
			$classes_from_args = is_array( $args['class'] ) ? $args['class'] : preg_split( '/\s+/', (string) $args['class'] );
		}

		// Merge default HTML class names and class names passed as arguments
		// to the action, then sanitize each class name.
		$merged_classes    = array_merge( $default_classes, $classes_from_args );
		$sanitized_classes = array_map( 'sanitize_html_class', $merged_classes );

		// Remove duplicates, empty values, and reindex array.
		$classes = array_values( array_unique( array_filter( $sanitized_classes ) ) );

		$attributes = array(
			// HTML class attribute should be a string.
			'class' => implode( ' ', $classes ),
		);

		$data_attributes = array( 'for-comment-form', 'post-id', 'shape', 'text', 'theme' );
		foreach ( $data_attributes as $attribute ) {
			if ( empty( $args[ $attribute ] ) || ! is_scalar( $args[ $attribute ] ) ) {
				continue;
			}

			$attributes[ 'data-googlesitekit-siwg-' . strtolower( $attribute ) ] = (string) $args[ $attribute ];
		}

		$attribute_strings = array();
		foreach ( $attributes as $key => $value ) {
			$attribute_strings[] = sprintf( '%s="%s"', $key, esc_attr( $value ) );
		}

		echo '<div ' . implode( ' ', $attribute_strings ) . '></div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Renders the Sign in with Google button for shortcode usage.
	 *
	 * This method captures the Sign in with Google button output
	 * and returns it as a string for use in shortcodes.
	 *
	 * @since 1.165.0
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string The rendered button markup.
	 */
	public function render_siwg_shortcode( $atts ) {
		$args = shortcode_atts(
			array(
				'class' => '',
				'shape' => '',
				'text'  => '',
				'theme' => '',
			),
			$atts,
			'site_kit_sign_in_with_google'
		);

		// Remove empty attributes.
		$args = array_filter( $args );

		ob_start();
		do_action( 'googlesitekit_render_sign_in_with_google_button', $args );
		$markup = ob_get_clean();

		return $markup;
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
				'label' => sprintf( __( '%s: One Tap Enabled', 'google-site-kit' ), _x( 'Sign in with Google', 'Service name', 'google-site-kit' ) ),
				'value' => $settings['oneTapEnabled'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => $settings['oneTapEnabled'] ? 'yes' : 'no',
			),
			'sign_in_with_google_comments'                 => array(
				/* translators: %s: Sign in with Google service name */
				'label' => sprintf( __( '%s: Show next to comments', 'google-site-kit' ), _x( 'Sign in with Google', 'Service name', 'google-site-kit' ) ),
				'value' => (bool) get_option( 'users_can_register' ) && $settings['showNextToCommentsEnabled'] ? __( 'Yes', 'google-site-kit' ) : __( 'No', 'google-site-kit' ),
				'debug' => (bool) get_option( 'users_can_register' ) && $settings['showNextToCommentsEnabled'] ? 'yes' : 'no',
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
	 * Registers the Sign in with Google tag.
	 *
	 * @since 1.159.0
	 */
	public function register_tag() {
		$settings  = $this->get_settings()->get();
		$client_id = $settings['clientID'];

		$tag = new Web_Tag( $client_id, self::MODULE_SLUG );

		if ( $tag->is_tag_blocked() ) {
			return;
		}

		$tag->use_guard( new Tag_Guard( $this->get_settings() ) );

		if ( ! $tag->can_register() ) {
			return;
		}

		$tag->set_settings( $this->get_settings()->get() );
		$tag->set_is_wp_login( false !== stripos( wp_login_url(), $_SERVER['SCRIPT_NAME'] ?? '' ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$tag->set_redirect_to( $this->context->input()->filter( INPUT_GET, 'redirect_to' ) );
		$tag->register();
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
	 * @return string|array
	 */
	public function get_content_url() {
		$wp_login_url = wp_login_url();

		if ( $this->is_woocommerce_active() ) {
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
		<a class="button button-secondary" href="<?php echo esc_url( self::disconnect_url( $user->ID ) ); ?>">
			<?php esc_html_e( 'Disconnect Google Account', 'google-site-kit' ); ?>
		</a>
	</p>
</div>
		<?php
	}

	/**
	 * Gets required inline data for the module.
	 *
	 * @since 1.142.0
	 * @since 1.146.0 Added isWooCommerceActive and isWooCommerceRegistrationEnabled to the inline data.
	 * @since 1.158.0 Renamed method to `get_inline_data()`, and modified it to return a new array rather than populating a passed filter value.
	 *
	 * @param array $modules_data Inline modules data.
	 * @return array An array of the module's inline data.
	 */
	public function get_inline_data( $modules_data ) {
		$inline_data = array();

		$existing_client_id = $this->existing_client_id->get();

		if ( $existing_client_id ) {
			$inline_data['existingClientID'] = $existing_client_id;
		}

		$is_woocommerce_active            = $this->is_woocommerce_active();
		$woocommerce_registration_enabled = $is_woocommerce_active ? get_option( 'woocommerce_enable_myaccount_registration' ) : null;

		$inline_data['isWooCommerceActive']              = $is_woocommerce_active;
		$inline_data['isWooCommerceRegistrationEnabled'] = $is_woocommerce_active && 'yes' === $woocommerce_registration_enabled;

		$modules_data[ self::MODULE_SLUG ] = $inline_data;

		return $modules_data;
	}

	/**
	 * Helper method to determine if the WooCommerce plugin is active.
	 *
	 * @since 1.148.0
	 *
	 * @return bool True if active, false if not.
	 */
	protected function is_woocommerce_active() {
		return class_exists( 'WooCommerce' );
	}

	/**
	 * Gets an array of internal feature metrics.
	 *
	 * @since 1.165.0
	 *
	 * @return array
	 */
	public function get_feature_metrics() {
		return array(
			'siwg_onetap' => $this->get_settings()->get()['oneTapEnabled'] ? 1 : 0,
		);
	}
}
