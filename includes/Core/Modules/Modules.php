<?php
/**
 * Class Google\Site_Kit\Core\Modules\Modules
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
use Google\Site_Kit\Core\Util\Feature_Flags;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\Analytics;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Idea_Hub;
use Google\Site_Kit\Modules\Optimize;
use Google\Site_Kit\Modules\PageSpeed_Insights;
use Google\Site_Kit\Modules\Search_Console;
use Google\Site_Kit\Modules\Site_Verification;
use Google\Site_Kit\Modules\Tag_Manager;
use Google\Site_Kit\Modules\Thank_With_Google;
use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Exception;

/**
 * Class managing the different modules.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Modules {

	use Method_Proxy_Trait;

	const OPTION_ACTIVE_MODULES = 'googlesitekit_active_modules';

	const REST_ENDPOINT_CHECK_ACCESS = 'core/modules/data/check-access';

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Option API instance.
	 *
	 * @since 1.0.0
	 * @var Options
	 */
	private $options;

	/**
	 * Module Sharing Settings instance.
	 *
	 * @since 1.68.0
	 * @var Module_Sharing_Settings
	 */
	private $sharing_settings;

	/**
	 * User Option API instance.
	 *
	 * @since 1.0.0
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Authentication instance.
	 *
	 * @since 1.0.0
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Available modules as $slug => $module pairs.
	 *
	 * @since 1.0.0
	 * @var array
	 */
	private $modules = array();

	/**
	 * Map of module slugs and which other modules they depend on.
	 *
	 * @since 1.0.0
	 * @var array
	 */
	private $dependencies = array();

	/**
	 * Map of module slugs and which other modules depend on them.
	 *
	 * @since 1.0.0
	 * @var array
	 */
	private $dependants = array();

	/**
	 * Module_Registry instance.
	 *
	 * @since 1.21.0
	 * @var Module_Registry
	 */
	private $registry;

	/**
	 * Assets API instance.
	 *
	 * @since 1.40.0
	 * @var Assets
	 */
	private $assets;

	/**
	 * REST_Dashboard_Sharing_Controller instance.
	 *
	 * @since 1.75.0
	 * @var REST_Dashboard_Sharing_Controller
	 */
	private $rest_controller;

	/**
	 * Core module class names.
	 *
	 * @since 1.21.0
	 * @var string[] Core module class names.
	 */
	private $core_modules = array(
		Site_Verification::MODULE_SLUG  => Site_Verification::class,
		Search_Console::MODULE_SLUG     => Search_Console::class,
		Analytics::MODULE_SLUG          => Analytics::class,
		Optimize::MODULE_SLUG           => Optimize::class,
		Tag_Manager::MODULE_SLUG        => Tag_Manager::class,
		AdSense::MODULE_SLUG            => AdSense::class,
		PageSpeed_Insights::MODULE_SLUG => PageSpeed_Insights::class,
	);

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
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
		$this->context          = $context;
		$this->options          = $options ?: new Options( $this->context );
		$this->sharing_settings = new Module_Sharing_Settings( $this->options );
		$this->user_options     = $user_options ?: new User_Options( $this->context );
		$this->authentication   = $authentication ?: new Authentication( $this->context, $this->options, $this->user_options );
		$this->assets           = $assets ?: new Assets( $this->context );

		$this->core_modules[ Analytics_4::MODULE_SLUG ] = Analytics_4::class;

		if ( Feature_Flags::enabled( 'ideaHubModule' ) ) {
			$this->core_modules[ Idea_Hub::MODULE_SLUG ] = Idea_Hub::class;
		}
		if ( Feature_Flags::enabled( 'twgModule' ) ) {
			$this->core_modules[ Thank_With_Google::MODULE_SLUG ] = Thank_With_Google::class;
		}

		if ( Feature_Flags::enabled( 'dashboardSharing' ) ) {
			$this->rest_dashboard_sharing_controller = new REST_Dashboard_Sharing_Controller( $this );
		}
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		add_filter(
			'googlesitekit_features_request_data',
			function( $body ) {
				$active_modules    = $this->get_active_modules();
				$connected_modules = array_filter(
					$active_modules,
					function( $module ) {
						return $module->is_connected();
					}
				);

				$body['active_modules']    = implode( ' ', array_keys( $active_modules ) );
				$body['connected_modules'] = implode( ' ', array_keys( $connected_modules ) );
				return $body;
			}
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
				$modules_routes = array(
					'/' . REST_Routes::REST_ROOT . '/core/modules/data/list',
				);

				return array_merge( $paths, $modules_routes );
			}
		);

		$available_modules = $this->get_available_modules();
		array_walk(
			$available_modules,
			function( Module $module ) {
				if ( $module instanceof Module_With_Settings ) {
					$module->get_settings()->register();
				}

				if ( $module instanceof Module_With_Persistent_Registration ) {
					$module->register_persistent();
				}
			}
		);

		$this->sharing_settings->register();

		if ( Feature_Flags::enabled( 'dashboardSharing' ) ) {
			$this->rest_dashboard_sharing_controller->register();
		}

		add_filter(
			'googlesitekit_assets',
			function( $assets ) use ( $available_modules ) {
				foreach ( $available_modules as $module ) {
					if ( $module instanceof Module_With_Assets ) {
						$assets = array_merge( $assets, $module->get_assets() );
					}
				}
				return $assets;
			}
		);

		$active_modules = $this->get_active_modules();
		array_walk(
			$active_modules,
			function( Module $module ) {
				$module->register();
			}
		);

		add_filter(
			'googlesitekit_apifetch_preload_paths',
			function ( $paths ) use ( $active_modules ) {
				$settings_routes = array_map(
					function ( Module $module ) {
						if ( $module instanceof Module_With_Settings ) {
							return '/' . REST_Routes::REST_ROOT . "/modules/{$module->slug}/data/settings";
						}
						return null;
					},
					array_values( $active_modules )
				);

				return array_merge( $paths, array_filter( $settings_routes ) );
			}
		);

		add_action(
			'googlesitekit_authorize_user',
			function( $token_response ) {
				if ( empty( $token_response['analytics_configuration'] ) ) {
					return;
				}

				// Do nothing if the Analytics module is already activated.
				if ( $this->is_module_active( Analytics::MODULE_SLUG ) ) {
					return;
				}

				$this->activate_module( Analytics::MODULE_SLUG );

				$extra_scopes = $this->user_options->get( OAuth_Client::OPTION_ADDITIONAL_AUTH_SCOPES );
				if ( is_array( $extra_scopes ) ) {
					$readonly_scope_index = array_search( Analytics::READONLY_SCOPE, $extra_scopes, true );
					if ( $readonly_scope_index >= 0 ) {
						unset( $extra_scopes[ $readonly_scope_index ] );

						$auth_scopes = $this->user_options->get( OAuth_Client::OPTION_AUTH_SCOPES );
						if ( is_array( $auth_scopes ) ) {
							$auth_scopes[] = Analytics::READONLY_SCOPE;
							$auth_scopes   = array_unique( $auth_scopes );

							$this->user_options->set( OAuth_Client::OPTION_ADDITIONAL_AUTH_SCOPES, array_values( $extra_scopes ) );
							$this->user_options->set( OAuth_Client::OPTION_AUTH_SCOPES, $auth_scopes );
						}
					}
				}

				try {
					$analytics = $this->get_module( Analytics::MODULE_SLUG );
					$analytics->handle_token_response_data( $token_response );
				} catch ( Exception $e ) {
					return;
				}
			},
			1
		);

		add_filter( 'googlesitekit_inline_base_data', $this->get_method_proxy( 'inline_js_data' ) );
		add_filter( 'googlesitekit_inline_tracking_data', $this->get_method_proxy( 'inline_js_data' ) );

		add_filter(
			'googlesitekit_dashboard_sharing_data',
			function ( $data ) {
				$data['recoverableModules']     = array_keys( $this->get_recoverable_modules() );
				$data['sharedOwnershipModules'] = array_keys( $this->get_shared_ownership_modules() );

				return $data;
			}
		);

		add_filter(
			'googlesitekit_is_module_recoverable',
			function ( $recoverable, $slug ) {
				return $this->is_module_recoverable( $slug );
			},
			10,
			2
		);

		add_filter( 'option_' . Module_Sharing_Settings::OPTION, $this->get_method_proxy( 'filter_shared_ownership_module_settings' ) );
		add_filter( 'default_option_' . Module_Sharing_Settings::OPTION, $this->get_method_proxy( 'filter_shared_ownership_module_settings' ), 20 );

		add_action(
			'add_option_' . Module_Sharing_Settings::OPTION,
			function( $option, $values ) {
				array_walk(
					$values,
					function( $value, $module_slug ) {
						if ( ! $this->module_exists( $module_slug ) ) {
							return;
						}

						$module = $this->get_module( $module_slug );

						if ( ! $module instanceof Module_With_Service_Entity ) {

							$module->get_settings()->merge(
								array(
									'ownerID' => get_current_user_id(),
								)
							);

						};
					}
				);
			},
			10,
			2
		);

		add_action(
			'update_option_' . Module_Sharing_Settings::OPTION,
			function( $old_values, $values ) {
				if ( is_array( $values ) && is_array( $old_values ) ) {
					array_walk(
						$values,
						function( $value, $module_slug ) use ( $old_values ) {
							if ( ! $this->module_exists( $module_slug ) ) {
								return;
							}

							$module = $this->get_module( $module_slug );

							if ( ! $module instanceof Module_With_Service_Entity ) {
								$changed_settings = false;

								if ( is_array( $value ) ) {
									array_walk(
										$value,
										function( $setting, $setting_key ) use ( $old_values, $module_slug, &$changed_settings ) {
											// Check if old value is an array and set, then compare both arrays.
											if (
												is_array( $setting ) &&
												isset( $old_values[ $module_slug ][ $setting_key ] ) &&
												is_array( $old_values[ $module_slug ][ $setting_key ] )
											) {
												sort( $setting );
												sort( $old_values[ $module_slug ][ $setting_key ] );
												if ( $setting !== $old_values[ $module_slug ][ $setting_key ] ) {
													$changed_settings = true;
												}
											} elseif (
												// If we don't have the old values or the types are different, then we have updated settings.
												! isset( $old_values[ $module_slug ][ $setting_key ] ) ||
												gettype( $setting ) !== gettype( $old_values[ $module_slug ][ $setting_key ] ) ||
												$setting !== $old_values[ $module_slug ][ $setting_key ]
											) {
												$changed_settings = true;
											}
										}
									);
								}

								if ( $changed_settings ) {
									$module->get_settings()->merge(
										array(
											'ownerID' => get_current_user_id(),
										)
									);
								}
							}
						}
					);
				}
			},
			10,
			2
		);
	}

	/**
	 * Adds / modifies data to pass to JS.
	 *
	 * @since 1.78.0
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_data( $data ) {
		$all_active_modules = $this->get_active_modules();

		$non_internal_active_modules = array_filter(
			$all_active_modules,
			function( Module $module ) {
				return false === $module->internal;
			}
		);

		$data['activeModules'] = array_keys( $non_internal_active_modules );

		return $data;
	}

	/**
	 * Gets the reference to the Module_Sharing_Settings instance.
	 *
	 * @since 1.69.0
	 *
	 * @return Module_Sharing_Settings An instance of the Module_Sharing_Settings class.
	 */
	public function get_module_sharing_settings() {
		return $this->sharing_settings;
	}

	/**
	 * Gets the available modules.
	 *
	 * @since 1.0.0
	 *
	 * @return array Available modules as $slug => $module pairs.
	 */
	public function get_available_modules() {
		if ( empty( $this->modules ) ) {
			$module_classes = $this->get_registry()->get_all();
			foreach ( $module_classes as $module_class ) {
				$instance = new $module_class( $this->context, $this->options, $this->user_options, $this->authentication, $this->assets );

				$this->modules[ $instance->slug ]      = $instance;
				$this->dependencies[ $instance->slug ] = array();
				$this->dependants[ $instance->slug ]   = array();
			}

			uasort(
				$this->modules,
				function( Module $a, Module $b ) {
					if ( $a->order === $b->order ) {
						return 0;
					}
					return ( $a->order < $b->order ) ? -1 : 1;
				}
			);

			// Set up dependency maps.
			foreach ( $this->modules as $module ) {
				foreach ( $module->depends_on as $dependency ) {
					if ( ! isset( $this->modules[ $dependency ] ) || $module->slug === $dependency ) {
						continue;
					}

					$this->dependencies[ $module->slug ][] = $dependency;
					$this->dependants[ $dependency ][]     = $module->slug;
				}
			}
		}

		return $this->modules;
	}

	/**
	 * Gets the active modules.
	 *
	 * @since 1.0.0
	 *
	 * @return array Active modules as $slug => $module pairs.
	 */
	public function get_active_modules() {
		$modules = $this->get_available_modules();
		$option  = $this->get_active_modules_option();

		return array_filter(
			$modules,
			function( Module $module ) use ( $option ) {
				// Force active OR manually active modules.
				return $module->force_active || in_array( $module->slug, $option, true );
			}
		);
	}

	/**
	 * Gets the module identified by the given slug.
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug Unique module slug.
	 * @return Module Module for the slug.
	 *
	 * @throws Exception Thrown when the module slug is invalid.
	 */
	public function get_module( $slug ) {
		$modules = $this->get_available_modules();

		if ( ! isset( $modules[ $slug ] ) ) {
			/* translators: %s: module slug */
			throw new Exception( sprintf( __( 'Invalid module slug %s.', 'google-site-kit' ), $slug ) );
		}

		return $modules[ $slug ];
	}

	/**
	 * Checks if the module exists.
	 *
	 * @since 1.80.0
	 *
	 * @param string $slug Module slug.
	 * @return bool True if the module exists, false otherwise.
	 */
	public function module_exists( $slug ) {
		try {
			$this->get_module( $slug );
			return true;
		} catch ( Exception $e ) {
			return false;
		}
	}

	/**
	 * Gets the list of module slugs the module with the given slug depends on.
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug Unique module slug.
	 * @return array List of slugs for other modules that are dependencies.
	 *
	 * @throws Exception Thrown when the module slug is invalid.
	 */
	public function get_module_dependencies( $slug ) {
		$modules = $this->get_available_modules();

		if ( ! isset( $modules[ $slug ] ) ) {
			/* translators: %s: module slug */
			throw new Exception( sprintf( __( 'Invalid module slug %s.', 'google-site-kit' ), $slug ) );
		}

		return $this->dependencies[ $slug ];
	}

	/**
	 * Gets the list of module slugs that depend on the module with the given slug.
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug Unique module slug.
	 * @return array List of slugs for other modules that are dependants.
	 *
	 * @throws Exception Thrown when the module slug is invalid.
	 */
	public function get_module_dependants( $slug ) {
		$modules = $this->get_available_modules();

		if ( ! isset( $modules[ $slug ] ) ) {
			/* translators: %s: module slug */
			throw new Exception( sprintf( __( 'Invalid module slug %s.', 'google-site-kit' ), $slug ) );
		}

		return $this->dependants[ $slug ];
	}

	/**
	 * Checks whether the module identified by the given slug is active.
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug Unique module slug.
	 * @return bool True if module is active, false otherwise.
	 */
	public function is_module_active( $slug ) {
		$modules = $this->get_active_modules();

		return isset( $modules[ $slug ] );
	}

	/**
	 * Checks whether the module identified by the given slug is connected.
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug Unique module slug.
	 * @return bool True if module is connected, false otherwise.
	 */
	public function is_module_connected( $slug ) {
		try {
			$module = $this->get_module( $slug );
		} catch ( Exception $e ) {
			return false;
		}

		return (bool) $module->is_connected();
	}

	/**
	 * Activates the module identified by the given slug.
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug Unique module slug.
	 * @return bool True on success, false on failure.
	 */
	public function activate_module( $slug ) {
		try {
			$module = $this->get_module( $slug );
		} catch ( Exception $e ) {
			return false;
		}

		// TODO: Remove this hack.
		if ( Analytics::MODULE_SLUG === $slug ) {
			// GA4 needs to be handled first to pass conditions below
			// due to special handling in active modules option.
			$this->activate_module( Analytics_4::MODULE_SLUG );
		}

		$option = $this->get_active_modules_option();

		if ( in_array( $slug, $option, true ) ) {
			return true;
		}

		$option[] = $slug;

		$this->set_active_modules_option( $option );

		if ( $module instanceof Module_With_Activation ) {
			$module->on_activation();
		}

		return true;
	}

	/**
	 * Checks whether the module identified by the given slug is enabled by the option.
	 *
	 * @since 1.46.0
	 *
	 * @param string $slug Unique module slug.
	 * @return bool True if module has been manually enabled, false otherwise.
	 */
	private function manually_enabled( $slug ) {
		$option = $this->get_active_modules_option();
		return in_array( $slug, $option, true );
	}

	/**
	 * Deactivates the module identified by the given slug.
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug Unique module slug.
	 * @return bool True on success, false on failure.
	 */
	public function deactivate_module( $slug ) {
		try {
			$module = $this->get_module( $slug );
		} catch ( Exception $e ) {
			return false;
		}

		// TODO: Remove this hack.
		if ( Analytics::MODULE_SLUG === $slug ) {
			// GA4 needs to be handled first to pass conditions below
			// due to special handling in active modules option.
			$this->deactivate_module( Analytics_4::MODULE_SLUG );
		}

		$option = $this->get_active_modules_option();

		$key = array_search( $slug, $option, true );
		if ( false === $key ) {
			return true;
		}

		// Prevent deactivation if force-active.
		if ( $module->force_active ) {
			return false;
		}

		unset( $option[ $key ] );

		$this->set_active_modules_option( array_values( $option ) );

		if ( $module instanceof Module_With_Deactivation ) {
			$module->on_deactivation();
		}

		$this->sharing_settings->unset_module( $slug );

		return true;
	}

	/**
	 * Enqueues all module-specific assets.
	 *
	 * @since 1.7.0
	 */
	public function enqueue_assets() {
		$available_modules = $this->get_available_modules();
		array_walk(
			$available_modules,
			function( Module $module ) {
				if ( $module instanceof Module_With_Assets ) {
					$module->enqueue_assets();
				}
			}
		);
	}

	/**
	 * Gets the configured module registry instance.
	 *
	 * @since 1.21.0
	 *
	 * @return Module_Registry
	 */
	protected function get_registry() {
		if ( ! $this->registry instanceof Module_Registry ) {
			$this->registry = $this->setup_registry();
		}

		return $this->registry;
	}

	/**
	 * Sets up a fresh module registry instance.
	 *
	 * @since 1.21.0
	 *
	 * @return Module_Registry
	 */
	protected function setup_registry() {
		$registry = new Module_Registry();
		/**
		 * Filters core module slugs before registering them in the module registry. Each slug presented on this array will
		 * be registered for inclusion. If a module is forced to be active, then it will be included even if the module slug is
		 * removed from this filter.
		 *
		 * @since 1.49.0
		 *
		 * @param array $available_modules An array of core module slugs available for registration in the module registry.
		 * @return array An array of filtered module slugs.
		 */
		$available_modules = (array) apply_filters( 'googlesitekit_available_modules', array_keys( $this->core_modules ) );
		$modules           = array_fill_keys( $available_modules, true );

		foreach ( $this->core_modules as $slug => $module ) {
			if ( isset( $modules[ $slug ] ) || call_user_func( array( $module, 'is_force_active' ) ) ) {
				$registry->register( $module );
			}
		}

		return $registry;
	}

	/**
	 * Gets related REST routes.
	 *
	 * @since 1.3.0
	 *
	 * @return array List of REST_Route objects.
	 */
	private function get_rest_routes() {
		$can_setup = function() {
			return current_user_can( Permissions::SETUP );
		};

		$can_authenticate = function() {
			return current_user_can( Permissions::AUTHENTICATE );
		};

		$can_list_data = function() {
			return current_user_can( Permissions::VIEW_SPLASH ) || current_user_can( Permissions::VIEW_DASHBOARD );
		};

		$can_view_insights = function() {
			// This accounts for routes that need to be called before user has completed setup flow.
			if ( current_user_can( Permissions::SETUP ) ) {
				return true;
			}

			return current_user_can( Permissions::VIEW_POSTS_INSIGHTS );
		};

		$can_manage_options = function() {
			// This accounts for routes that need to be called before user has completed setup flow.
			if ( current_user_can( Permissions::SETUP ) ) {
				return true;
			}

			return current_user_can( Permissions::MANAGE_OPTIONS );
		};

		$get_module_schema = function () {
			return $this->get_module_schema();
		};

		return array(
			new REST_Route(
				'core/modules/data/list',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$modules = array_map(
								array( $this, 'prepare_module_data_for_response' ),
								$this->get_available_modules()
							);
							return new WP_REST_Response( array_values( $modules ) );
						},
						'permission_callback' => $can_list_data,
					),
				),
				array(
					'schema' => $get_module_schema,
				)
			),
			new REST_Route(
				'core/modules/data/activation',
				array(
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$data = $request['data'];
							$slug = isset( $data['slug'] ) ? $data['slug'] : '';

							try {
								$this->get_module( $slug );
							} catch ( Exception $e ) {
								return new WP_Error( 'invalid_module_slug', $e->getMessage() );
							}

							$modules = $this->get_available_modules();

							if ( ! empty( $data['active'] ) ) {
								// Prevent activation if one of the dependencies is not active.
								$dependency_slugs = $this->get_module_dependencies( $slug );
								foreach ( $dependency_slugs as $dependency_slug ) {
									if ( ! $this->is_module_active( $dependency_slug ) ) {
										/* translators: %s: module name */
										return new WP_Error( 'inactive_dependencies', sprintf( __( 'Module cannot be activated because of inactive dependency %s.', 'google-site-kit' ), $modules[ $dependency_slug ]->name ), array( 'status' => 500 ) );
									}
								}
								if ( ! $this->activate_module( $slug ) ) {
									return new WP_Error( 'cannot_activate_module', __( 'An internal error occurred while trying to activate the module.', 'google-site-kit' ), array( 'status' => 500 ) );
								}
							} else {
								// Automatically deactivate dependants.
								$dependant_slugs = $this->get_module_dependants( $slug );
								foreach ( $dependant_slugs as $dependant_slug ) {
									if ( $this->is_module_active( $dependant_slug ) ) {
										if ( ! $this->deactivate_module( $dependant_slug ) ) {
											/* translators: %s: module name */
											return new WP_Error( 'cannot_deactivate_dependant', sprintf( __( 'Module cannot be deactivated because deactivation of dependant %s failed.', 'google-site-kit' ), $modules[ $dependant_slug ]->name ), array( 'status' => 500 ) );
										}
									}
								}
								if ( ! $this->deactivate_module( $slug ) ) {
									return new WP_Error( 'cannot_deactivate_module', __( 'An internal error occurred while trying to deactivate the module.', 'google-site-kit' ), array( 'status' => 500 ) );
								}
							}

							return new WP_REST_Response( array( 'success' => true ) );
						},
						'permission_callback' => $can_manage_options,
						'args'                => array(
							'data' => array(
								'type'     => 'object',
								'required' => true,
							),
						),
					),
				),
				array(
					'schema' => $get_module_schema,
				)
			),
			new REST_Route(
				'core/modules/data/info',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function( WP_REST_Request $request ) {
							try {
								$module = $this->get_module( $request['slug'] );
							} catch ( Exception $e ) {
								return new WP_Error( 'invalid_module_slug', $e->getMessage() );
							}

							return new WP_REST_Response( $this->prepare_module_data_for_response( $module ) );
						},
						'permission_callback' => $can_authenticate,
						'args'                => array(
							'slug' => array(
								'type'              => 'string',
								'description'       => __( 'Identifier for the module.', 'google-site-kit' ),
								'sanitize_callback' => 'sanitize_key',
							),
						),
					),
				),
				array(
					'schema' => $get_module_schema,
				)
			),
			new REST_Route(
				self::REST_ENDPOINT_CHECK_ACCESS,
				array(
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$data = $request['data'];
							$slug = isset( $data['slug'] ) ? $data['slug'] : '';

							try {
								$module = $this->get_module( $slug );
							} catch ( Exception $e ) {
								return new WP_Error( 'invalid_module_slug', __( 'Invalid module slug.', 'google-site-kit' ), array( 'status' => 404 ) );
							}

							if ( ! $this->is_module_connected( $slug ) ) {
								return new WP_Error( 'module_not_connected', __( 'Module is not connected.', 'google-site-kit' ), array( 'status' => 400 ) );
							}

							if ( ! $module instanceof Module_With_Service_Entity ) {
								if ( $module->is_shareable() ) {
									return new WP_REST_Response(
										array(
											'access' => true,
										)
									);
								}

								return new WP_Error( 'invalid_module', __( 'Module access cannot be checked.', 'google-site-kit' ), array( 'status' => 400 ) );
							}

							$access = $module->check_service_entity_access();

							if ( is_wp_error( $access ) ) {
								return $access;
							}

							return new WP_REST_Response(
								array(
									'access' => $access,
								)
							);
						},
						'permission_callback' => $can_setup,
						'args'                => array(
							'slug' => array(
								'type'              => 'string',
								'description'       => __( 'Identifier for the module.', 'google-site-kit' ),
								'sanitize_callback' => 'sanitize_key',
							),
						),
					),
				)
			),
			new REST_Route(
				'modules/(?P<slug>[a-z0-9\-]+)/data/notifications',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$slug = $request['slug'];
							$modules = $this->get_available_modules();
							if ( ! isset( $modules[ $slug ] ) ) {
								return new WP_Error( 'invalid_module_slug', __( 'Invalid module slug.', 'google-site-kit' ), array( 'status' => 404 ) );
							}
							$notifications = array();
							if ( $this->is_module_active( $slug ) ) {
								$notifications = $modules[ $slug ]->get_data( 'notifications' );
								if ( is_wp_error( $notifications ) ) {
									// Don't consider it an error if the module does not have a 'notifications' datapoint.
									if ( Invalid_Datapoint_Exception::WP_ERROR_CODE === $notifications->get_error_code() ) {
										$notifications = array();
									}
									return $notifications;
								}
							}
							return new WP_REST_Response( $notifications );
						},
						'permission_callback' => $can_authenticate,
					),
				),
				array(
					'args' => array(
						'slug' => array(
							'type'              => 'string',
							'description'       => __( 'Identifier for the module.', 'google-site-kit' ),
							'sanitize_callback' => 'sanitize_key',
						),
					),
				)
			),
			new REST_Route(
				'modules/(?P<slug>[a-z0-9\-]+)/data/settings',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$slug = $request['slug'];
							try {
								$module = $this->get_module( $slug );
							} catch ( Exception $e ) {
								return new WP_Error( 'invalid_module_slug', __( 'Invalid module slug.', 'google-site-kit' ), array( 'status' => 404 ) );
							}

							if ( ! $module instanceof Module_With_Settings ) {
								return new WP_Error( 'invalid_module_slug', __( 'Module does not support settings.', 'google-site-kit' ), array( 'status' => 400 ) );
							}
							return new WP_REST_Response( $module->get_settings()->get() );
						},
						'permission_callback' => $can_manage_options,
					),
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$slug = $request['slug'];
							try {
								$module = $this->get_module( $slug );
							} catch ( Exception $e ) {
								return new WP_Error( 'invalid_module_slug', __( 'Invalid module slug.', 'google-site-kit' ), array( 'status' => 404 ) );
							}

							if ( ! $module instanceof Module_With_Settings ) {
								return new WP_Error( 'invalid_module_slug', __( 'Module does not support settings.', 'google-site-kit' ), array( 'status' => 400 ) );
							}

							$module->get_settings()->merge( (array) $request['data'] );

							return new WP_REST_Response( $module->get_settings()->get() );
						},
						'permission_callback' => $can_manage_options,
						'args'                => array(
							'data' => array(
								'type'              => 'object',
								'description'       => __( 'Settings to set.', 'google-site-kit' ),
								'validate_callback' => function( $value ) {
									return is_array( $value );
								},
							),
						),
					),
				),
				array(
					'args' => array(
						'slug' => array(
							'type'              => 'string',
							'description'       => __( 'Identifier for the module.', 'google-site-kit' ),
							'sanitize_callback' => 'sanitize_key',
						),
					),
				)
			),
			new REST_Route(
				'modules/(?P<slug>[a-z0-9\-]+)/data/(?P<datapoint>[a-z\-]+)',
				array(
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$slug = $request['slug'];
							try {
								$module = $this->get_module( $slug );
							} catch ( Exception $e ) {
								return new WP_Error( 'invalid_module_slug', __( 'Invalid module slug.', 'google-site-kit' ), array( 'status' => 404 ) );
							}
							$data = $module->get_data( $request['datapoint'], $request->get_params() );
							if ( is_wp_error( $data ) ) {
								return $data;
							}
							return new WP_REST_Response( $data );
						},
						'permission_callback' => $can_view_insights,
					),
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$slug = $request['slug'];
							try {
								$module = $this->get_module( $slug );
							} catch ( Exception $e ) {
								return new WP_Error( 'invalid_module_slug', __( 'Invalid module slug.', 'google-site-kit' ), array( 'status' => 404 ) );
							}
							$data = isset( $request['data'] ) ? (array) $request['data'] : array();
							$data = $module->set_data( $request['datapoint'], $data );
							if ( is_wp_error( $data ) ) {
								return $data;
							}
							return new WP_REST_Response( $data );
						},
						'permission_callback' => $can_manage_options,
						'args'                => array(
							'data' => array(
								'type'              => 'object',
								'description'       => __( 'Data to set.', 'google-site-kit' ),
								'validate_callback' => function( $value ) {
									return is_array( $value );
								},
							),
						),
					),
				),
				array(
					'args' => array(
						'slug'      => array(
							'type'              => 'string',
							'description'       => __( 'Identifier for the module.', 'google-site-kit' ),
							'sanitize_callback' => 'sanitize_key',
						),
						'datapoint' => array(
							'type'              => 'string',
							'description'       => __( 'Module data point to address.', 'google-site-kit' ),
							'sanitize_callback' => 'sanitize_key',
						),
					),
				)
			),
			new REST_Route(
				'core/modules/data/recover-module',
				array(
					array(
						'methods'             => WP_REST_Server::EDITABLE,
						'callback'            => function( WP_REST_Request $request ) {
							$data = $request['data'];
							$slug = isset( $data['slug'] ) ? $data['slug'] : '';
							try {
								$module = $this->get_module( $slug );
							} catch ( Exception $e ) {
								return new WP_Error( 'invalid_module_slug', $e->getMessage(), array( 'status' => 404 ) );
							}

							if ( ! $module->is_shareable() ) {
								return new WP_Error( 'module_not_shareable', __( 'Module is not shareable.', 'google-site-kit' ), array( 'status' => 404 ) );
							}

							if ( ! $this->is_module_recoverable( $module ) ) {
								return new WP_Error( 'module_not_recoverable', __( 'Module is not recoverable.', 'google-site-kit' ), array( 'status' => 403 ) );
							}

							$check_access_endpoint = '/' . REST_Routes::REST_ROOT . '/' . self::REST_ENDPOINT_CHECK_ACCESS;
							$check_access_request = new WP_REST_Request( 'POST', $check_access_endpoint );
							$check_access_request->set_body_params(
								array(
									'data' => array(
										'slug' => $slug,
									),
								)
							);
							$check_access_response = rest_do_request( $check_access_request );

							if ( is_wp_error( $check_access_response ) ) {
								return $check_access_response;
							}
							$access = isset( $check_access_response->data['access'] ) ? $check_access_response->data['access'] : false;
							if ( ! $access ) {
								return new WP_Error( 'module_not_accessible', __( 'Module is not accessible by current user.', 'google-site-kit' ), array( 'status' => 403 ) );
							}

							// Update the module's ownerID to the ID of the user making the request.
							$module_setting_updates = array(
								'ownerID' => get_current_user_id(),
							);
							$module->get_settings()->merge( $module_setting_updates );

							return new WP_REST_Response( $module_setting_updates );
						},
						'permission_callback' => $can_setup,
					),
				),
				array(
					'schema' => $get_module_schema,
				)
			),
		);
	}

	/**
	 * Prepares module data for a REST response according to the schema.
	 *
	 * @since 1.3.0
	 *
	 * @param Module $module Module instance.
	 * @return array Module REST response data.
	 */
	private function prepare_module_data_for_response( Module $module ) {
		$module_data = array(
			'slug'         => $module->slug,
			'name'         => $module->name,
			'description'  => $module->description,
			'homepage'     => $module->homepage,
			'internal'     => $module->internal,
			'order'        => $module->order,
			'forceActive'  => $module->force_active,
			'shareable'    => $module->is_shareable(),
			'active'       => $this->is_module_active( $module->slug ),
			'connected'    => $this->is_module_connected( $module->slug ),
			'dependencies' => $this->get_module_dependencies( $module->slug ),
			'dependants'   => $this->get_module_dependants( $module->slug ),
			'owner'        => null,
		);

		if ( current_user_can( 'list_users' ) && $module instanceof Module_With_Owner ) {
			$owner_id = $module->get_owner_id();
			if ( $owner_id ) {
				$module_data['owner'] = array(
					'id'    => $owner_id,
					'login' => get_the_author_meta( 'user_login', $owner_id ),
				);
			}
		}

		return $module_data;
	}

	/**
	 * Gets the REST schema for a module.
	 *
	 * @since 1.3.0
	 *
	 * @return array Module REST schema.
	 */
	private function get_module_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'module',
			'type'       => 'object',
			'properties' => array(
				'slug'         => array(
					'type'        => 'string',
					'description' => __( 'Identifier for the module.', 'google-site-kit' ),
					'readonly'    => true,
				),
				'name'         => array(
					'type'        => 'string',
					'description' => __( 'Name of the module.', 'google-site-kit' ),
					'readonly'    => true,
				),
				'description'  => array(
					'type'        => 'string',
					'description' => __( 'Description of the module.', 'google-site-kit' ),
					'readonly'    => true,
				),
				'homepage'     => array(
					'type'        => 'string',
					'description' => __( 'The module homepage.', 'google-site-kit' ),
					'format'      => 'uri',
					'readonly'    => true,
				),
				'internal'     => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the module is internal, thus without any UI.', 'google-site-kit' ),
					'readonly'    => true,
				),
				'active'       => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the module is active.', 'google-site-kit' ),
				),
				'connected'    => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the module setup has been completed.', 'google-site-kit' ),
					'readonly'    => true,
				),
				'dependencies' => array(
					'type'        => 'array',
					'description' => __( 'List of slugs of other modules that the module depends on.', 'google-site-kit' ),
					'items'       => array(
						'type' => 'string',
					),
					'readonly'    => true,
				),
				'dependants'   => array(
					'type'        => 'array',
					'description' => __( 'List of slugs of other modules depending on the module.', 'google-site-kit' ),
					'items'       => array(
						'type' => 'string',
					),
					'readonly'    => true,
				),
				'owner'        => array(
					'type'       => 'object',
					'properties' => array(
						'id'    => array(
							'type'        => 'integer',
							'description' => __( 'Owner ID.', 'google-site-kit' ),
							'readonly'    => true,
						),
						'login' => array(
							'type'        => 'string',
							'description' => __( 'Owner login.', 'google-site-kit' ),
							'readonly'    => true,
						),
					),
				),
			),
		);
	}

	/**
	 * Gets the option containing the active modules.
	 *
	 * @since 1.0.0
	 *
	 * @return array List of active module slugs.
	 */
	private function get_active_modules_option() {
		$option = $this->options->get( self::OPTION_ACTIVE_MODULES );

		if ( ! is_array( $option ) ) {
			$option = $this->options->get( 'googlesitekit-active-modules' );
		}

		// If both options are not arrays, use the default value.
		if ( ! is_array( $option ) ) {
			$option = array( PageSpeed_Insights::MODULE_SLUG );
		}

		$includes_analytics   = in_array( Analytics::MODULE_SLUG, $option, true );
		$includes_analytics_4 = in_array( Analytics_4::MODULE_SLUG, $option, true );
		if ( $includes_analytics && ! $includes_analytics_4 ) {
			$option[] = Analytics_4::MODULE_SLUG;
		}

		return $option;
	}

	/**
	 * Sets the option containing the active modules.
	 *
	 * @since 1.0.0
	 *
	 * @param array $option List of active module slugs.
	 */
	private function set_active_modules_option( array $option ) {
		if ( in_array( Analytics_4::MODULE_SLUG, $option, true ) ) {
			unset( $option[ array_search( Analytics_4::MODULE_SLUG, $option, true ) ] );
		}

		$this->options->set( self::OPTION_ACTIVE_MODULES, $option );
	}

	/**
	 * Gets the shareable active modules.
	 *
	 * @since 1.50.0
	 *
	 * @return array Shareable modules as $slug => $module pairs.
	 */
	public function get_shareable_modules() {
		$all_active_modules = $this->get_active_modules();

		return array_filter(
			$all_active_modules,
			function( Module $module ) {
				return $module->is_shareable();
			}
		);
	}

	/**
	 * Checks the given module is recoverable.
	 *
	 * A module is recoverable if:
	 * - No user is identified by its owner ID
	 * - the owner lacks the capability to authenticate
	 * - the owner is no longer authenticated
	 * - no user exists for the owner ID
	 *
	 * @since 1.69.0
	 *
	 * @param Module|string $module A module instance or its slug.
	 * @return bool True if the module is recoverable, false otherwise.
	 */
	public function is_module_recoverable( $module ) {
		if ( is_string( $module ) ) {
			try {
				$module = $this->get_module( $module );
			} catch ( Exception $e ) {
				return false;
			}
		}

		if ( ! $module instanceof Module_With_Owner ) {
			return false;
		}

		$shared_roles = $this->sharing_settings->get_shared_roles( $module->slug );
		if ( empty( $shared_roles ) ) {
			return false;
		}

		$owner_id = $module->get_owner_id();
		if ( ! $owner_id || ! user_can( $owner_id, Permissions::AUTHENTICATE ) ) {
			return true;
		}

		$restore_user        = $this->user_options->switch_user( $owner_id );
		$owner_authenticated = $this->authentication->is_authenticated();
		$restore_user();

		if ( ! $owner_authenticated ) {
			return true;
		}

		return false;
	}

	/**
	 * Gets the recoverable modules.
	 *
	 * @since 1.50.0
	 *
	 * @return array Recoverable modules as $slug => $module pairs.
	 */
	public function get_recoverable_modules() {
		return array_filter(
			$this->get_shareable_modules(),
			array( $this, 'is_module_recoverable' )
		);
	}

	/**
	 * Gets shared ownership modules.
	 *
	 * @since 1.70.0
	 *
	 * @return array Shared ownership modules as $slug => $module pairs.
	 */
	public function get_shared_ownership_modules() {
		return array_filter(
			$this->get_shareable_modules(),
			function( $module ) {
				return ! ( $module instanceof Module_With_Service_Entity );
			}
		);
	}

	/**
	 * Inserts default settings for shared ownership modules.
	 *
	 * Sharing settings for shared ownership modules such as pagespeed-insights
	 * and idea-hub should always be manageable by "all admins". This filter inserts
	 * this 'default' setting for their respective module slugs even when the
	 * dashboard_sharing settings option is not defined in the database or when settings
	 * are not set for these modules. This filter is applied after every attempt to fetch
	 * the googlesitekit-dashboard_sharing settings option from the database.
	 *
	 * @since 1.75.0
	 *
	 * @param array $sharing_settings The dashboard_sharing settings option fetched from the database.
	 * @return array Dashboard sharing settings option with default settings inserted for shared ownership modules.
	 */
	protected function filter_shared_ownership_module_settings( $sharing_settings ) {
		$shared_ownership_modules = array_keys( $this->get_shared_ownership_modules() );
		foreach ( $shared_ownership_modules as $shared_ownership_module ) {
			if ( ! isset( $sharing_settings[ $shared_ownership_module ] ) ) {
				$sharing_settings[ $shared_ownership_module ] = array(
					'sharedRoles' => array(),
					'management'  => 'all_admins',
				);
			}
		}
		return $sharing_settings;
	}

	/**
	 * Gets the ownerIDs of all shareable modules.
	 *
	 * @since 1.75.0
	 *
	 * @return array Array of $module_slug => $owner_id.
	 */
	public function get_shareable_modules_owners() {
		$module_owners     = array();
		$shareable_modules = $this->get_shareable_modules();
		foreach ( $shareable_modules as $module_slug => $module ) {
			$module_owners[ $module_slug ] = $module->get_owner_id();
		}
		return $module_owners;
	}

}
