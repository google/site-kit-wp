<?php
/**
 * Class Google\Site_Kit\Plugin
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit;

use Google\Site_Kit\Core\Remote_Features\Remote_Features_Provider;
use Google\Site_Kit\Core\Util\Feature_Flags;

/**
 * Main class for the plugin.
 *
 * @since 1.0.0
 */
final class Plugin {

	/**
	 * The plugin context object.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Main instance of the plugin.
	 *
	 * @since 1.0.0
	 * @var Plugin|null
	 */
	private static $instance = null;

	/**
	 * Sets the plugin main file.
	 *
	 * @since 1.0.0
	 *
	 * @param string $main_file Absolute path to the plugin main file.
	 */
	public function __construct( $main_file ) {
		$this->context = new Context( $main_file );
	}

	/**
	 * Retrieves the plugin context object.
	 *
	 * @since 1.0.0
	 *
	 * @return Context Plugin context.
	 */
	public function context() {
		return $this->context;
	}

	/**
	 * Registers the plugin with WordPress.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		if ( $this->context->is_network_mode() ) {
			add_action(
				'network_admin_notices',
				function () {
					?>
					<div class="notice notice-warning">
						<p>
							<?php
							echo wp_kses(
								__( 'The Site Kit by Google plugin does <strong>not yet offer</strong> a network mode, but we&#8217;re actively working on that.', 'google-site-kit' ),
								array(
									'strong' => array(),
								)
							);
							?>
						</p>
					</div>
					<?php
				}
			);
			return;
		}

		$options = new Core\Storage\Options( $this->context );

		// Set up remote features before anything else.
		( new Remote_Features_Provider( $this->context, $options ) )->register();

		// REST route to set up a temporary tag to verify meta tag output works reliably.
		add_filter(
			'googlesitekit_rest_routes',
			function ( $routes ) {
				$can_setup = function () {
					return current_user_can( Core\Permissions\Permissions::SETUP );
				};
				$routes[]  = new Core\REST_API\REST_Route(
					'core/site/data/setup-tag',
					array(
						array(
							'methods'             => \WP_REST_Server::EDITABLE,
							'callback'            => function () {
								$token = wp_generate_uuid4();
								set_transient( 'googlesitekit_setup_token', $token, 5 * MINUTE_IN_SECONDS );

								return new \WP_REST_Response( array( 'token' => $token ) );
							},
							'permission_callback' => $can_setup,
						),
					)
				);
				return $routes;
			}
		);

		// Output temporary tag if set.
		add_action(
			'wp_head',
			function () {
				$token = get_transient( 'googlesitekit_setup_token' );

				if ( $token ) {
					printf( '<meta name="googlesitekit-setup" content="%s" />', esc_attr( $token ) );
				}
			}
		);

		$display_site_kit_meta = function () {
			echo apply_filters( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				'googlesitekit_generator',
				sprintf( '<meta name="generator" content="Site Kit by Google %s" />', esc_attr( GOOGLESITEKIT_VERSION ) )
			);
		};
		add_action( 'wp_head', $display_site_kit_meta );
		add_action( 'login_head', $display_site_kit_meta );

		// Register activation flag logic outside of 'init' since it hooks into
		// plugin activation.
		$activation_flag = new Core\Util\Activation_Flag( $this->context, $options );
		$activation_flag->register();

		// Register uninstallation logic outside of 'init' since it hooks into
		// plugin uninstallation.
		$uninstallation = new Core\Util\Uninstallation( $this->context, $options );
		$uninstallation->register();

		// Initiate the plugin on 'init' for relying on current user being set.
		add_action(
			'init',
			function () use ( $options, $activation_flag ) {
				$transients   = new Core\Storage\Transients( $this->context );
				$user_options = new Core\Storage\User_Options( $this->context, get_current_user_id() );
				$assets       = new Core\Assets\Assets( $this->context );

				$survey_queue = new Core\User_Surveys\Survey_Queue( $user_options );
				$survey_queue->register();

				$user_input = new Core\User_Input\User_Input( $this->context, $options, $user_options, $survey_queue );

				$authentication = new Core\Authentication\Authentication( $this->context, $options, $user_options, $transients, $user_input );
				$authentication->register();

				$user_input->register();

				$user = new Core\User\User( $user_options );
				$user->register();

				$modules = new Core\Modules\Modules( $this->context, $options, $user_options, $authentication, $assets );
				$modules->register();

				$dismissals = new Core\Dismissals\Dismissals( $this->context, $user_options );
				$dismissals->register();

				$dismissed_items = $dismissals->get_dismissed_items();

				$expirables = new Core\Expirables\Expirables( $this->context, $user_options );
				$expirables->register();

				$permissions = new Core\Permissions\Permissions( $this->context, $authentication, $modules, $user_options, $dismissed_items );
				$permissions->register();

				$nonces = new Core\Nonces\Nonces( $this->context );
				$nonces->register();

				// Assets must be registered after Modules instance is registered.
				$assets->register();

				$screens = new Core\Admin\Screens( $this->context, $assets, $modules, $authentication );
				$screens->register();

				$user_surveys = new Core\User_Surveys\User_Surveys( $authentication, $user_options, $survey_queue );
				$user_surveys->register();

				( new Core\Authentication\Setup( $this->context, $user_options, $authentication ) )->register();

				( new Core\Util\Reset( $this->context ) )->register();
				( new Core\Util\Reset_Persistent( $this->context ) )->register();
				( new Core\Util\Developer_Plugin_Installer( $this->context ) )->register();
				( new Core\Tracking\Tracking( $this->context, $user_options, $screens ) )->register();
				( new Core\REST_API\REST_Routes( $this->context ) )->register();
				( new Core\Util\REST_Entity_Search_Controller( $this->context ) )->register();
				( new Core\Admin_Bar\Admin_Bar( $this->context, $assets, $modules ) )->register();
				( new Core\Admin\Available_Tools() )->register();
				( new Core\Admin\Notices() )->register();
				( new Core\Admin\Pointers() )->register();
				( new Core\Admin\Dashboard( $this->context, $assets, $modules ) )->register();
				( new Core\Admin\Authorize_Application( $this->context, $assets ) )->register();
				( new Core\Notifications\Notifications( $this->context, $options, $authentication ) )->register();
				( new Core\Site_Health\Site_Health( $this->context, $options, $user_options, $authentication, $modules, $permissions ) )->register();
				( new Core\Util\Health_Checks( $authentication ) )->register();
				( new Core\Admin\Standalone( $this->context ) )->register();
				( new Core\Util\Activation_Notice( $this->context, $activation_flag, $assets ) )->register();
				( new Core\Feature_Tours\Feature_Tours( $this->context, $user_options ) )->register();
				( new Core\Util\Migration_1_3_0( $this->context, $options, $user_options ) )->register();
				( new Core\Util\Migration_1_8_1( $this->context, $options, $user_options, $authentication ) )->register();
				( new Core\Util\Migration_1_123_0( $this->context, $options ) )->register();
				( new Core\Util\Migration_1_129_0( $this->context, $options ) )->register();
				( new Core\Util\Migration_1_150_0( $this->context, $options ) )->register();
				( new Core\Dashboard_Sharing\Dashboard_Sharing() )->register();
				( new Core\Key_Metrics\Key_Metrics( $this->context, $user_options, $options ) )->register();
				( new Core\Prompts\Prompts( $this->context, $user_options ) )->register();
				( new Core\Consent_Mode\Consent_Mode( $this->context, $modules, $options ) )->register();
				( new Core\Tags\GTag( $options ) )->register();
				( new Core\Conversion_Tracking\Conversion_Tracking( $this->context, $options ) )->register();
				if ( Feature_Flags::enabled( 'googleTagGateway' ) ) {
					( new Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway( $this->context, $options ) )->register();
				}

				// If a login is happening (runs after 'init'), update current user in dependency chain.
				add_action(
					'wp_login',
					function ( $username, $user ) use ( $user_options ) {
						$user_options->switch_user( $user->ID );
					},
					-999,
					2
				);

				/**
				 * Fires when Site Kit has fully initialized.
				 *
				 * @since 1.0.0
				 */
				do_action( 'googlesitekit_init' );
			},
			-999
		);

		// Register _gl parameter to be removed from the URL.
		add_filter(
			'removable_query_args',
			function ( $args ) {
				$args[] = '_gl';
				return $args;
			}
		);

		// WP CLI Commands.
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			( new Core\CLI\CLI_Commands( $this->context ) )->register();
		}

		// Add Plugin Row Meta.
		( new Core\Admin\Plugin_Row_Meta() )->register();

		// Add Plugin Action Links.
		( new Core\Admin\Plugin_Action_Links( $this->context ) )->register();
	}

	/**
	 * Retrieves the main instance of the plugin.
	 *
	 * @since 1.0.0
	 *
	 * @return Plugin Plugin main instance.
	 */
	public static function instance() {
		return self::$instance;
	}

	/**
	 * Loads the plugin main instance and initializes it.
	 *
	 * @since 1.0.0
	 *
	 * @param string $main_file Absolute path to the plugin main file.
	 * @return bool True if the plugin main instance could be loaded, false otherwise.
	 */
	public static function load( $main_file ) {
		if ( null !== self::$instance ) {
			return false;
		}

		if ( file_exists( GOOGLESITEKIT_PLUGIN_DIR_PATH . 'dist/config.php' ) ) {
			$config = include GOOGLESITEKIT_PLUGIN_DIR_PATH . 'dist/config.php';
			Feature_Flags::set_features( (array) $config['features'] );
		}

		self::$instance = new self( $main_file );
		self::$instance->register();

		return true;
	}
}
