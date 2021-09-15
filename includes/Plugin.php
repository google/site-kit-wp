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

use Google\Site_Kit\Core\DI\DI_Aware_Interface;
use Google\Site_Kit\Core\DI\DI_Aware_Trait;
use Google\Site_Kit\Core\DI\DI_Entry_Aware_Trait;
use Google\Site_Kit\Core\Feature_Tours\Feature_Tours;
use Google\Site_Kit\Core\Storage\Options;

/**
 * Main class for the plugin.
 *
 * @since 1.0.0
 *
 * @property-read Context $context Context instance.
 * @property-read Options $options Option API instance.
 */
final class Plugin implements DI_Aware_Interface {

	use DI_Aware_Trait, DI_Entry_Aware_Trait;

	/**
	 * Registers the plugin with WordPress.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		if ( $this->context->is_network_active() ) {
			add_action(
				'network_admin_notices',
				function() {
					?>
					<div class="notice notice-warning">
						<p>
							<?php
							echo wp_kses(
								__( 'The Site Kit by Google plugin is <strong>not yet compatible</strong> for use in a WordPress multisite network, but we&#8217;re actively working on that.', 'google-site-kit' ),
								array(
									'strong' => array(),
								)
							);
							?>
						</p>
						<p>
							<?php esc_html_e( 'Meanwhile, we recommend deactivating it in the network and re-activating it for an individual site.', 'google-site-kit' ); ?>
						</p>
					</div>
					<?php
				}
			);
			return;
		}

		// REST route to set up a temporary tag to verify meta tag output works reliably.
		add_filter(
			'googlesitekit_rest_routes',
			function( $routes ) {
				$can_setup = function() {
					return current_user_can( Core\Permissions\Permissions::SETUP );
				};
				$routes[]  = new Core\REST_API\REST_Route(
					'core/site/data/setup-tag',
					array(
						array(
							'methods'             => \WP_REST_Server::EDITABLE,
							'callback'            => function( \WP_REST_Request $request ) {
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

		$display_site_kit_meta = function() {
			echo apply_filters( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				'googlesitekit_generator',
				sprintf( '<meta name="generator" content="Site Kit by Google %s" />', esc_attr( GOOGLESITEKIT_VERSION ) )
			);
		};
		add_action( 'wp_head', $display_site_kit_meta );
		add_action( 'login_head', $display_site_kit_meta );

		// Register activation flag logic outside of 'init' since it hooks into
		// plugin activation.
		$activation_flag = new Core\Util\Activation_Flag( $this->context, $this->options );
		$activation_flag->register();

		// Register uninstallation logic outside of 'init' since it hooks into
		// plugin uninstallation.
		$uninstallation = new Core\Util\Uninstallation( $this->context, $this->options );
		$uninstallation->register();

		// Initiate the plugin on 'init' for relying on current user being set.
		add_action(
			'init',
			function() use ( $activation_flag ) {
				$di = $this->get_di();

				$user_options = $di->get( 'user_options' );
				$assets       = $di->get( 'assets' );

				$authentication = $di->get( 'authentication' );
				$authentication->register();

				$permissions = new Core\Permissions\Permissions( $this->context, $authentication );
				$permissions->register();

				$modules = $di->get( 'modules' );
				$modules->register();

				// Assets must be registered after Modules instance is registered.
				$assets->register();

				$screens = new Core\Admin\Screens( $this->context, $assets, $modules );
				$screens->register();

				( new Core\Util\Reset( $this->context ) )->register();
				( new Core\Util\Reset_Persistent( $this->context ) )->register();
				( new Core\Util\Developer_Plugin_Installer( $this->context ) )->register();
				( new Core\Util\Tracking( $this->context, $user_options, $screens ) )->register();
				$di->get( 'rest_routes' )->register();
				$di->get( 'admin_bar' )->register();
				( new Core\Admin\Available_Tools() )->register();
				( new Core\Admin\Notices() )->register();
				( new Core\Admin\Dashboard( $this->context, $assets, $modules ) )->register();
				( new Core\Notifications\Notifications( $this->context, $this->options, $authentication ) )->register();
				( new Core\Util\Debug_Data( $this->context, $this->options, $user_options, $authentication, $modules ) )->register();
				( new Core\Util\Health_Checks( $authentication ) )->register();
				( new Core\Admin\Standalone( $this->context ) )->register();
				( new Core\Util\Activation_Notice( $this->context, $activation_flag, $assets ) )->register();
				( new Core\Dismissals\Dismissals( $this->context, $user_options ) )->register();
				( new Core\Feature_Tours\Feature_Tours( $this->context, $user_options ) )->register();
				( new Core\User_Surveys\REST_User_Surveys_Controller( $authentication ) )->register();
				( new Core\Util\Migration_1_3_0( $this->context, $this->options, $user_options ) )->register();
				( new Core\Util\Migration_1_8_1( $this->context, $this->options, $user_options, $authentication ) )->register();

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

}
