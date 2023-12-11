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

use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Network_Mode_Notice;
use Google\Site_Kit\Core\Util\REST_Setup_Tag_Controller;
use Google\Site_Kit\Core\Util\Tag_Meta_Generator;
use Google\Site_Kit\Core\Util\Tag_Meta_Setup;

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
	 * @var Options
	 */
	private $options;

	/**
	 * Sets the plugin main file.
	 *
	 * @since 1.0.0
	 *
	 * @param string $main_file Absolute path to the plugin main file.
	 */
	public function __construct( $main_file ) {
		$this->context = new Context( $main_file );
		$this->options = new Core\Storage\Options( $this->context );
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
			register( new Network_Mode_Notice() );
			return;
		}

		register(
			new REST_Setup_Tag_Controller(),
			new Tag_Meta_Setup(),
			new Tag_Meta_Generator(),
			new Core\Util\Activation_Flag( $this->context, $this->options ),
			new Core\Util\Uninstallation( $this->context, $this->options ),
			new Core\Admin\Plugin_Row_Meta(),
			new Core\Admin\Plugin_Action_Links( $this->context ),
			new Core\CLI\CLI_Commands( $this->context ),
		);

		// Initiate the plugin on 'init' for relying on current user being set.
		add_action( 'init', [ $this, 'init' ], -999 );

		// Register _gl parameter to be removed from the URL.
//		add_filter(
//			'removable_query_args',
//			function ( $args ) {
//				$args[] = '_gl';
//				return $args;
//			}
//		);
	}

	public function init() {
		$transients      = new Core\Storage\Transients( $this->context );
		$user_options    = new Core\Storage\User_Options( $this->context, get_current_user_id() );
		$assets          = new Core\Assets\Assets( $this->context );
		$survey_queue    = new Core\User_Surveys\Survey_Queue( $user_options );
		$user_input      = new Core\User_Input\User_Input( $this->context, $this->options, $user_options, $survey_queue );
		$authentication  = new Core\Authentication\Authentication( $this->context, $this->options, $user_options, $transients, $user_input );
		$dismissals      = new Core\Dismissals\Dismissals( $this->context, $user_options );
		$dismissed_items = ( $dismissals )->get_dismissed_items();
		$modules = new Core\Modules\Modules( $this->context, $this->options, $user_options, $authentication, $assets );
		$screens = new Core\Admin\Screens( $this->context, $assets, $modules, $authentication );
		$permissions = new Core\Permissions\Permissions( $this->context, $authentication, $modules, $user_options, $dismissed_items );

		register(
			$authentication, // !!!
			$modules,
			$assets, // Must be registered after Modules instance.
			$survey_queue,
			Feature_Flags::enabled( 'keyMetrics' ) ? $user_input : new No_Op_Register(),
			$dismissals,
			$permissions,
			new Core\Nonces\Nonces( $this->context ),
			$screens,
			new Core\User_Surveys\User_Surveys( $authentication, $user_options, $survey_queue ),
			new Core\Authentication\Setup( $this->context, $user_options, $authentication ),
			new Core\Util\Reset( $this->context ),
			new Core\Util\Reset_Persistent( $this->context ),
			new Core\Util\Developer_Plugin_Installer( $this->context ),
			new Core\Tracking\Tracking( $this->context, $user_options, $screens ),
			new Core\REST_API\REST_Routes( $this->context ),
			new Core\Util\REST_Entity_Search_Controller( $this->context ),
			new Core\Admin_Bar\Admin_Bar( $this->context, $assets, $modules ),
			new Core\Admin\Available_Tools(),
			new Core\Admin\Notices(),
			new Core\Admin\Pointers(),
			new Core\Admin\Dashboard( $this->context, $assets, $modules ),
			new Core\Notifications\Notifications( $this->context, $this->options, $authentication ),
			new Core\Util\Debug_Data( $this->context, $this->options, $user_options, $authentication, $modules, $permissions ),
			new Core\Util\Health_Checks( $authentication ),
			new Core\Admin\Standalone( $this->context ),
			new Core\Util\Activation_Notice( $this->context, new Core\Util\Activation_Flag( $this->context, $this->options ), $assets ),
			new Core\Feature_Tours\Feature_Tours( $this->context, $user_options ),
			new Core\Util\Migration_1_3_0( $this->context, $this->options, $user_options ),
			new Core\Util\Migration_1_8_1( $this->context, $this->options, $user_options, $authentication ),
			new Core\Dashboard_Sharing\Dashboard_Sharing( $this->context, $user_options ),
			Feature_Flags::enabled( 'keyMetrics' ) ? new Core\Key_Metrics\Key_Metrics( $this->context, $user_options, $this->options ) : new No_Op_Register(),
		);


		// If a login is happening (runs after 'init'), update current user in dependency chain.
		add_action(
			'wp_login',
			function( $username, $user ) use ( $user_options ) {
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
	}

	/**
	 * Retrieves the main instance of the plugin.
	 *
	 * @since 1.0.0
	 *
	 * @return Plugin Plugin main instance.
	 */
	public static function instance() {
		return static::$instance;
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
		if ( null !== static::$instance ) {
			return false;
		}

		if ( file_exists( GOOGLESITEKIT_PLUGIN_DIR_PATH . 'dist/config.php' ) ) {
			$config = include GOOGLESITEKIT_PLUGIN_DIR_PATH . 'dist/config.php';
			Feature_Flags::set_features( (array) $config['features'] );
		}

		static::$instance = new static( $main_file );
		static::$instance->register();

		return true;
	}

}
