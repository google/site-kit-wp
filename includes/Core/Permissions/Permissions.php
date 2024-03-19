<?php
/**
 * Class Google\Site_Kit\Core\Permissions\Permissions
 *
 * @package   Google\Site_Kit\Core\Permissions
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Permissions;

use Exception;
use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\User_Options;
use WP_REST_Response;
use WP_REST_Server;
use WP_User;

/**
 * Class managing plugin permissions.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Permissions {
	/*
	 * Custom base capabilities.
	 */
	const AUTHENTICATE             = 'googlesitekit_authenticate';
	const SETUP                    = 'googlesitekit_setup';
	const VIEW_POSTS_INSIGHTS      = 'googlesitekit_view_posts_insights';
	const VIEW_DASHBOARD           = 'googlesitekit_view_dashboard';
	const VIEW_WP_DASHBOARD_WIDGET = 'googlesitekit_view_wp_dashboard_widget';
	const VIEW_ADMIN_BAR_MENU      = 'googlesitekit_view_admin_bar_menu';
	const MANAGE_OPTIONS           = 'googlesitekit_manage_options';
	const UPDATE_PLUGINS           = 'googlesitekit_update_plugins';


	/*
	 * Custom meta capabilities.
	 */
	const VIEW_SPLASH                        = 'googlesitekit_view_splash';
	const VIEW_SHARED_DASHBOARD              = 'googlesitekit_view_shared_dashboard';
	const VIEW_AUTHENTICATED_DASHBOARD       = 'googlesitekit_view_authenticated_dashboard';
	const VIEW_POST_INSIGHTS                 = 'googlesitekit_view_post_insights';
	const READ_SHARED_MODULE_DATA            = 'googlesitekit_read_shared_module_data';
	const MANAGE_MODULE_SHARING_OPTIONS      = 'googlesitekit_manage_module_sharing_options';
	const DELEGATE_MODULE_SHARING_MANAGEMENT = 'googlesitekit_delegate_module_sharing_management';

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Authentication instance.
	 *
	 * @since 1.0.0
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * Modules instance.
	 *
	 * @since 1.69.0
	 * @var Modules
	 */
	private $modules;

	/**
	 * User_Options instance.
	 *
	 * @since 1.69.0
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Dismissed_Items instance.
	 *
	 * @since 1.69.0
	 * @var Dismissed_Items
	 */
	private $dismissed_items;

	/**
	 * Mappings for custom base capabilities to WordPress core built-in ones.
	 *
	 * @since 1.30.0
	 * @var array
	 */
	private $base_to_core = array();

	/**
	 * Mappings for custom meta capabilities to WordPress core built-in ones.
	 *
	 * @since 1.0.0
	 * @var array
	 */
	private $meta_to_core = array();

	/**
	 * Mappings for custom meta capabilities to custom base capabilities.
	 *
	 * @since 1.30.0
	 * @var array
	 */
	private $meta_to_base = array();

	/**
	 * List of custom base capabilities that should require network access if the plugin is in network mode.
	 *
	 * @since 1.30.0
	 * @var array
	 */
	private $network_base = array();

	/**
	 * Constructor.
	 *
	 * Sets up the capability mappings.
	 *
	 * @since 1.0.0
	 *
	 * @param Context         $context         Plugin context.
	 * @param Authentication  $authentication  Authentication instance.
	 * @param Modules         $modules         Modules instance.
	 * @param User_Options    $user_options    User_Options instance.
	 * @param Dismissed_Items $dismissed_items Dismissed_Items instance.
	 */
	public function __construct( Context $context, Authentication $authentication, Modules $modules, User_Options $user_options, Dismissed_Items $dismissed_items ) {
		$this->context         = $context;
		$this->authentication  = $authentication;
		$this->modules         = $modules;
		$this->user_options    = $user_options;
		$this->dismissed_items = $dismissed_items;

		$this->base_to_core = array(
			// By default, only allow administrators to authenticate.
			self::AUTHENTICATE             => 'manage_options',

			// Allow contributors and up to view their own post's insights.
			self::VIEW_POSTS_INSIGHTS      => 'edit_posts',

			// Allow editors and up to view the dashboard and module details.
			self::VIEW_DASHBOARD           => 'edit_posts',
			self::VIEW_WP_DASHBOARD_WIDGET => 'edit_posts',
			self::VIEW_ADMIN_BAR_MENU      => 'edit_posts',

			// Allow administrators and up to manage options and set up the plugin.
			self::MANAGE_OPTIONS           => 'manage_options',
			self::SETUP                    => 'manage_options',
			self::UPDATE_PLUGINS           => 'update_plugins',
		);

		$this->meta_to_core = array(
			// Allow users that can edit a post to view that post's insights.
			self::VIEW_POST_INSIGHTS => 'edit_post',
		);

		$this->meta_to_base = array(
			self::VIEW_SPLASH                        => self::VIEW_DASHBOARD,
			self::VIEW_AUTHENTICATED_DASHBOARD       => array( self::VIEW_DASHBOARD, self::AUTHENTICATE ),
			// Allow users that can generally view posts insights to view a specific post's insights.
			self::VIEW_POST_INSIGHTS                 => self::VIEW_POSTS_INSIGHTS,
			// Allow users that can generally view dashboard to read shared module data.
			self::READ_SHARED_MODULE_DATA            => self::VIEW_DASHBOARD,
			// Admins who can manage options for SK can generally manage module sharing options.
			self::MANAGE_MODULE_SHARING_OPTIONS      => self::MANAGE_OPTIONS,
			self::DELEGATE_MODULE_SHARING_MANAGEMENT => self::MANAGE_OPTIONS,
			self::VIEW_SHARED_DASHBOARD              => self::VIEW_DASHBOARD,
		);

		$this->network_base = array(
			// Require network admin access to view the dashboard and module details in network mode.
			self::VIEW_DASHBOARD           => 'manage_network',
			self::VIEW_WP_DASHBOARD_WIDGET => 'manage_network',
			self::VIEW_ADMIN_BAR_MENU      => 'manage_network',

			// Require network admin access to manage options and set up the plugin in network mode.
			self::MANAGE_OPTIONS           => 'manage_network_options',
			self::SETUP                    => 'manage_network_options',
		);
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		add_filter(
			'map_meta_cap',
			function( array $caps, $cap, $user_id, $args ) {
				return $this->map_meta_capabilities( $caps, $cap, $user_id, $args );
			},
			10,
			4
		);

		add_filter(
			'googlesitekit_rest_routes',
			function( $routes ) {
				return array_merge( $routes, $this->get_rest_routes() );
			}
		);

		add_filter(
			'googlesitekit_apifetch_preload_paths',
			function ( $paths ) {
				return array_merge(
					$paths,
					array(
						'/' . REST_Routes::REST_ROOT . '/core/user/data/permissions',
					)
				);
			}
		);

		// This constant can be set if an alternative mechanism to grant these capabilities is in place.
		if ( defined( 'GOOGLESITEKIT_DISABLE_DYNAMIC_CAPABILITIES' ) && GOOGLESITEKIT_DISABLE_DYNAMIC_CAPABILITIES ) {
			return;
		}

		add_filter(
			'user_has_cap',
			function( array $allcaps ) {
				return $this->grant_additional_caps( $allcaps );
			}
		);
	}

	/**
	 * Get dashboard sharing meta permissions for current user.
	 *
	 * @since 1.70.0
	 *
	 * @return array List meta capabilities as keys and current user permission as value.
	 */
	public function get_dashboard_sharing_meta_permissions() {
		$dashboard_sharing_meta_capabilities = self::get_dashboard_sharing_meta_capabilities();

		$shareable_modules = array_keys( $this->modules->get_shareable_modules() );

		$dashboard_sharing_meta_permissions = array();
		foreach ( $dashboard_sharing_meta_capabilities as $cap ) {
			foreach ( $shareable_modules as $module ) {
				$dashboard_sharing_meta_permissions[ "{$cap}::" . wp_json_encode( array( $module ) ) ] = current_user_can( $cap, $module );
			}
		}

		return $dashboard_sharing_meta_permissions;
	}

	/**
	 * Check permissions for current user.
	 *
	 * @since 1.21.0
	 *
	 * @return array List of base capabilities and meta capabilities as keys and current user permission as value.
	 */
	public function check_all_for_current_user() {
		$permissions = self::get_capabilities();

		return array_merge(
			array_combine(
				$permissions,
				array_map( 'current_user_can', $permissions )
			),
			self::get_dashboard_sharing_meta_permissions()
		);
	}

	/**
	 * Resolves meta capabilities to their base capabilities.
	 *
	 * This method first maps plugin meta capabilities to their base capabilities. In addition, if the meta
	 * capability should also map to a core meta capability, that mapping is taken care of as well.
	 *
	 * If in network mode and the custom base capability requires network access, it is checked that the user
	 * has that access, and if not, the method bails early causing in a result of false.
	 *
	 * It also prevents access to Site Kit's custom capabilities based on additional rules. These additional
	 * checks ideally could be done within the `user_has_cap` filter. However, the `user_has_cap` filter is
	 * applied after a check for multi-site admins which could potentially grant the capability without
	 * executing these additional checks.
	 *
	 * @see WP_User::has_cap()  To see the order of execution mentioned above.
	 *
	 * @since 1.0.0
	 *
	 * @param array  $caps    List of resolved capabilities.
	 * @param string $cap     Capability checked.
	 * @param int    $user_id Current user ID.
	 * @param array  $args    Additional arguments passed to the capability check.
	 * @return array Filtered value of $caps.
	 */
	private function map_meta_capabilities( array $caps, $cap, $user_id, $args ) {
		// Bail early under these circumstances as we already know for sure the check will result in false.
		if ( isset( $this->network_base[ $cap ] ) && $this->context->is_network_mode() && ! is_super_admin( $user_id ) ) {
			return array( 'do_not_allow' );
		}

		if ( isset( $this->meta_to_base[ $cap ] ) ) {
			$caps = (array) $this->meta_to_base[ $cap ];
		}

		if ( isset( $this->meta_to_core[ $cap ] ) ) {
			$required_core_caps = call_user_func_array(
				'map_meta_cap',
				array_merge(
					array( $this->meta_to_core[ $cap ], $user_id ),
					$args
				)
			);

			$caps = array_merge( $caps, $required_core_caps );
		}

		// Special setup and authentication rules.
		if ( ( isset( $this->base_to_core[ $cap ] ) || isset( $this->meta_to_core[ $cap ] ) ) ) {
			// If setup has not yet been completed, require administrator capabilities for everything.
			if ( self::SETUP !== $cap && ! $this->authentication->is_setup_completed() ) {
				$caps[] = self::SETUP;
			}

			if ( ! in_array( $cap, array( self::AUTHENTICATE, self::SETUP, self::VIEW_DASHBOARD, self::VIEW_POSTS_INSIGHTS, self::VIEW_WP_DASHBOARD_WIDGET, self::VIEW_ADMIN_BAR_MENU ), true ) ) {
				// For regular users, require being authenticated.
				if ( ! $this->is_user_authenticated( $user_id ) ) {
					return array_merge( $caps, array( 'do_not_allow' ) );
				}
				// For admin users, also require being verified.
				if ( user_can( $user_id, self::SETUP ) && ! $this->is_user_verified( $user_id ) ) {
					return array_merge( $caps, array( 'do_not_allow' ) );
				}

				// For all users, require setup to have been completed.
				if ( ! $this->authentication->is_setup_completed() ) {
					return array_merge( $caps, array( 'do_not_allow' ) );
				}
			}
		}

		if ( in_array( $cap, self::get_dashboard_sharing_capabilities(), true ) ) {
			$caps = array_merge( $caps, $this->check_dashboard_sharing_capability( $cap, $user_id, $args ) );
		}

		switch ( $cap ) {
			case self::VIEW_SPLASH:
				$caps = array_merge( $caps, $this->check_view_splash_capability( $user_id ) );
				break;
			// Intentional fallthrough - viewing the dashboard widget and admin bar menu require
			// a user to be authenticated.
			case self::VIEW_AUTHENTICATED_DASHBOARD:
				$caps = array_merge( $caps, $this->check_view_authenticated_dashboard_capability( $user_id ) );
				break;
			// Intentional fallthrough.
			case self::VIEW_DASHBOARD:
			case self::VIEW_POSTS_INSIGHTS:
				$caps = array_merge( $caps, $this->check_view_dashboard_capability( $user_id ) );
				break;
			case self::VIEW_WP_DASHBOARD_WIDGET:
			case self::VIEW_ADMIN_BAR_MENU:
				$caps = array_merge( $caps, $this->check_view_wp_dashboard_widget_and_admin_bar_capability( $user_id ) );
				break;
		}

		return $caps;
	}

	/**
	 * Checks a dashboard sharing capability based on rules of dashboard sharing.
	 *
	 * @since 1.69.0
	 *
	 * @param string $cap     Capability to be checked.
	 * @param int    $user_id User ID of the user the capability is checked for.
	 * @param array  $args    Additional arguments passed to check a meta capability.
	 * @return array Array with a 'do_not_allow' element if checks fail, empty array if checks pass.
	 */
	private function check_dashboard_sharing_capability( $cap, $user_id, $args ) {
		if ( isset( $args[0] ) ) {
			$module_slug = $args[0];
		}

		switch ( $cap ) {
			case self::VIEW_SHARED_DASHBOARD:
				return $this->check_view_shared_dashboard_capability( $user_id );

			case self::READ_SHARED_MODULE_DATA:
				return $this->check_read_shared_module_data_capability( $user_id, $module_slug );

			case self::MANAGE_MODULE_SHARING_OPTIONS:
			case self::DELEGATE_MODULE_SHARING_MANAGEMENT:
				return $this->check_module_sharing_admin_capability( $cap, $user_id, $module_slug );

			default:
				return array();
		}
	}

	/**
	 * Checks if the VIEW_SPLASH capability is allowed for the user.
	 *
	 * @since 1.73.0
	 *
	 * @param int $user_id User ID of the user the capability is checked for.
	 * @return array Array with a 'do_not_allow' element if checks fail, empty array if checks pass.
	 */
	private function check_view_splash_capability( $user_id ) {
		if ( $this->is_shared_dashboard_splash_dismissed( $user_id ) ) {
			return array( self::AUTHENTICATE );
		}

		if ( ! $this->user_has_shared_role( $user_id ) ) {
			return array( self::AUTHENTICATE );
		}

		return array();
	}

	/**
	 * Checks if the VIEW_DASHBOARD capability is allowed for the user.
	 *
	 * Allows access to the VIEW_DASHBOARD capability if the user can view either
	 * the authenticated or shared dashboard.
	 *
	 * @since 1.73.0
	 *
	 * @param int $user_id User ID of the user the capability is checked for.
	 * @return array Array with a 'do_not_allow' element if checks fail, empty array if checks pass.
	 */
	private function check_view_dashboard_capability( $user_id ) {
		$view_authenticated_dashboard = $this->check_view_authenticated_dashboard_capability( $user_id );

		if ( in_array( 'do_not_allow', $view_authenticated_dashboard, true ) ) {
			return $this->check_view_shared_dashboard_capability( $user_id );
		}

		return $view_authenticated_dashboard;
	}

	/**
	 * Checks if the VIEW_WP_DASHBOARD_WIDGET and VIEW_ADMIN_BAR_MENU capabilities are allowed for the user.
	 *
	 * Allows access to the VIEW_WP_DASHBOARD_WIDGET and VIEW_ADMIN_BAR_MENU capabilities if the user can view
	 * either the authenticated or shared dashboard and if the user has a shared role for either the Analytics
	 * or Search Console module.
	 *
	 * @since 1.120.0
	 *
	 * @param int $user_id User ID of the user the capability is checked for.
	 * @return array Array with a 'do_not_allow' element if checks fail, empty array if checks pass.
	 */
	private function check_view_wp_dashboard_widget_and_admin_bar_capability( $user_id ) {
		$view_dashboard_capability = $this->check_view_dashboard_capability( $user_id );

		if ( in_array( self::AUTHENTICATE, $view_dashboard_capability, true ) || in_array( 'do_not_allow', $view_dashboard_capability, true ) ) {
			return $view_dashboard_capability;
		}

		if ( ! $this->user_has_shared_role_for_module( $user_id, 'analytics-4' ) &&
			! $this->user_has_shared_role_for_module( $user_id, 'search-console' ) ) {
			return array( 'do_not_allow' );
		}

		return array();
	}

	/**
	 * Checks if the VIEW_SHARED_DASHBOARD capability should be denied.
	 *
	 * Prevents access to the VIEW_SHARED_DASHBOARD capability if a user does not
	 * have any of the shared roles set for any shareable module or if they have
	 * not dismissed the dashboard sharing splash screen message.
	 *
	 * @since 1.69.0
	 *
	 * @param int $user_id User ID of the user the capability is checked for.
	 * @return array Array with a 'do_not_allow' element if checks fail, empty array if checks pass.
	 */
	private function check_view_shared_dashboard_capability( $user_id ) {
		if ( ! $this->user_has_shared_role( $user_id ) ) {
			return array( 'do_not_allow' );
		}

		if ( ! $this->is_shared_dashboard_splash_dismissed( $user_id ) ) {
			return array( 'do_not_allow' );
		}

		return array();
	}

	/**
	 * Checks if the VIEW_AUTHENTICATED_DASHBOARD capability is allowed for the user.
	 *
	 * Allows access to the VIEW_AUTHENTICATED_DASHBOARD capability if the user is authenticated.
	 *
	 * @since 1.73.0
	 *
	 * @param int $user_id User ID of the user the capability is checked for.
	 * @return array Array with a 'do_not_allow' element if checks fail, otherise returns AUTHENTICATE capability.
	 */
	private function check_view_authenticated_dashboard_capability( $user_id ) {
		if (
			$this->is_user_authenticated( $user_id )
			&& $this->is_user_verified( $user_id )
			&& $this->authentication->is_setup_completed()
		) {
			return array( self::AUTHENTICATE );
		}
		return array( 'do_not_allow' );
	}

	/**
	 * Checks if the READ_SHARED_MODULE_DATA capability should be denied.
	 *
	 * Prevents access to the READ_SHARED_MODULE_DATA capability if a user does not
	 * have the shared roles set for the given module slug.
	 *
	 * @since 1.69.0
	 *
	 * @param int    $user_id     User ID of the user the capability is checked for.
	 * @param string $module_slug Module for which the meta capability is checked for.
	 * @return array Array with a 'do_not_allow' element if checks fail, empty array if checks pass.
	 */
	private function check_read_shared_module_data_capability( $user_id, $module_slug ) {
		if ( ! $this->user_has_shared_role_for_module( $user_id, $module_slug ) ) {
			return array( 'do_not_allow' );
		}

		return array();
	}

	/**
	 * Checks if the MANAGE_MODULE_SHARING_OPTIONS or the DELEGATE_MODULE_SHARING_MANAGEMENT
	 * capability should be denied.
	 *
	 * Prevents access to MANAGE_MODULE_SHARING_OPTIONS or the DELEGATE_MODULE_SHARING_MANAGEMENT
	 * capability if a user is not an authenticated admin.
	 *
	 * Furthermore, it prevents access for these capabilities if the user is not the owner
	 * of the given module slug. This check is skipped for MANAGE_MODULE_SHARING_OPTIONS if the
	 * module settings allow all admins to manage sharing options for that module.
	 *
	 * @since 1.69.0
	 *
	 * @param string $cap         Capability to be checked.
	 * @param int    $user_id     User ID of the user the capability is checked for.
	 * @param string $module_slug Module for which the meta capability is checked for.
	 * @return array Array with a 'do_not_allow' element if checks fail, empty array if checks pass.
	 */
	private function check_module_sharing_admin_capability( $cap, $user_id, $module_slug ) {
		$module_sharing_settings = $this->modules->get_module_sharing_settings();
		$sharing_settings        = $module_sharing_settings->get();

		if ( ! $this->is_user_authenticated( $user_id ) ) {
			return array( 'do_not_allow' );
		}

		if ( self::MANAGE_MODULE_SHARING_OPTIONS === $cap &&
			isset( $sharing_settings[ $module_slug ]['management'] ) &&
			'all_admins' === $sharing_settings[ $module_slug ]['management']
		) {
			return array();
		}

		try {
			$module = $this->modules->get_module( $module_slug );
			if ( ! ( $module instanceof Module_With_Owner ) ) {
				return array( 'do_not_allow' );
			}
			if ( $module->get_owner_id() !== $user_id ) {
				return array( 'do_not_allow' );
			}
		} catch ( Exception $e ) {
			return array( 'do_not_allow' );
		}

		return array();
	}

	/**
	 * Checks if the given user has a role in the list of shared roles.
	 *
	 * @since 1.73.0
	 *
	 * @param int           $user_id User ID.
	 * @param string[]|null $shared_roles Optional. List of shared role IDs to check against the user's. Defaults to all shared module roles.
	 * @return bool
	 */
	private function user_has_shared_role( $user_id, array $shared_roles = null ) {
		if ( ! is_array( $shared_roles ) ) {
			$shared_roles = $this->modules->get_module_sharing_settings()->get_all_shared_roles();
		}

		$shared_user_roles = array_intersect( $shared_roles, ( new WP_User( $user_id ) )->roles );

		return ! empty( $shared_user_roles );
	}

	/**
	 * Checks if the given user has a role in the list of shared roles for the given module.
	 *
	 * @since 1.73.0
	 *
	 * @param int    $user_id User ID.
	 * @param string $module  Module slug.
	 * @return bool
	 */
	private function user_has_shared_role_for_module( $user_id, $module ) {
		$settings = $this->modules->get_module_sharing_settings()->get();

		if ( empty( $settings[ $module ]['sharedRoles'] ) ) {
			return false;
		}

		return $this->user_has_shared_role( $user_id, $settings[ $module ]['sharedRoles'] );
	}

	/**
	 * Checks if a user is authenticated in Site Kit.
	 *
	 * @since 1.69.0
	 *
	 * @param int $user_id User ID of the user to be checked.
	 * @return bool True if the user is authenticated, false if not.
	 */
	public function is_user_authenticated( $user_id ) {
		$restore_user          = $this->user_options->switch_user( $user_id );
		$is_user_authenticated = $this->authentication->is_authenticated();
		$restore_user();
		return $is_user_authenticated;
	}

	/**
	 * Checks if a user is verified in Site Kit.
	 *
	 * @since 1.69.0
	 *
	 * @param int $user_id User ID of the user to be checked.
	 * @return bool True if the user is verified, false if not.
	 */
	public function is_user_verified( $user_id ) {
		$restore_user     = $this->user_options->switch_user( $user_id );
		$is_user_verified = $this->authentication->verification()->has();
		$restore_user();
		return $is_user_verified;
	}

	/**
	 * Checks if a user has dimissed the shared dashboard splash screen message.
	 *
	 * @since 1.69.0
	 *
	 * @param int $user_id User ID of the user to be checked.
	 * @return bool True if the user has dismissed the splash message, false if not.
	 */
	private function is_shared_dashboard_splash_dismissed( $user_id ) {
		$restore_user        = $this->user_options->switch_user( $user_id );
		$is_splash_dismissed = $this->dismissed_items->is_dismissed( 'shared_dashboard_splash' );
		$restore_user();
		return $is_splash_dismissed;
	}

	/**
	 * Grants custom capabilities on-the-fly, based on core capabilities.
	 *
	 * If you want to instead set up your own custom role or mechanism to grant these capabilities, you can set a
	 * constant flag `GOOGLESITEKIT_DISABLE_DYNAMIC_CAPABILITIES` to ensure this function is not hooked in.
	 *
	 * @since 1.0.0
	 *
	 * @param array $allcaps Associative array of $capability => $grant pairs.
	 * @return array Filtered value of $allcaps.
	 */
	private function grant_additional_caps( array $allcaps ) {
		foreach ( $this->base_to_core as $custom_cap => $core_cap ) {
			if ( isset( $allcaps[ $core_cap ] ) ) {
				$allcaps[ $custom_cap ] = $allcaps[ $core_cap ];
			}
		}

		return $allcaps;
	}

	/**
	 * Gets related REST routes.
	 *
	 * @since 1.82.0
	 *
	 * @return array List of REST_Route objects.
	 */
	private function get_rest_routes() {
		return array(
			new REST_Route(
				'core/user/data/permissions',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function() {
							return new WP_REST_Response( $this->check_all_for_current_user() );
						},
						'permission_callback' => function() {
							return current_user_can( Permissions::VIEW_SPLASH ) || current_user_can( Permissions::VIEW_DASHBOARD );
						},
					),
				)
			),
		);
	}

	/**
	 * Gets all the base capabilities used in Google Site Kit.
	 *
	 * @since 1.31.0
	 *
	 * @return array
	 */
	public static function get_capabilities() {
		return array(
			self::AUTHENTICATE,
			self::SETUP,
			self::VIEW_POSTS_INSIGHTS,
			self::VIEW_DASHBOARD,
			self::MANAGE_OPTIONS,
			self::UPDATE_PLUGINS,
			self::VIEW_SPLASH,
			self::VIEW_AUTHENTICATED_DASHBOARD,
			self::VIEW_WP_DASHBOARD_WIDGET,
			self::VIEW_ADMIN_BAR_MENU,
			self::VIEW_SHARED_DASHBOARD,
		);
	}

	/**
	 * Gets all the capabilities specifically added for dashboard sharing.
	 *
	 * @since 1.69.0
	 *
	 * @return array List of capabilities specific to dashboard sharing.
	 */
	public static function get_dashboard_sharing_capabilities() {
		return array(
			self::VIEW_SHARED_DASHBOARD,
			self::READ_SHARED_MODULE_DATA,
			self::MANAGE_MODULE_SHARING_OPTIONS,
			self::DELEGATE_MODULE_SHARING_MANAGEMENT,
		);
	}

	/**
	 * Gets all the meta capabilities specifically added for dashboard sharing.
	 *
	 * @since 1.70.0
	 *
	 * @return array List of meta capabilities specific to dashboard sharing.
	 */
	public static function get_dashboard_sharing_meta_capabilities() {
		return array(
			self::READ_SHARED_MODULE_DATA,
			self::MANAGE_MODULE_SHARING_OPTIONS,
			self::DELEGATE_MODULE_SHARING_MANAGEMENT,
		);
	}
}
