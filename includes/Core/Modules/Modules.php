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
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\PageSpeed_Insights;
use Google\Site_Kit\Modules\Search_Console;
use Google\Site_Kit\Modules\Site_Verification;
use Google\Site_Kit\Modules\Tag_Manager;
use Google\Site_Kit\Modules\Ads;
use Google\Site_Kit\Core\Util\Feature_Flags;
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
	 * REST_Modules_Controller instance.
	 *
	 * @since 1.92.0
	 * @var REST_Modules_Controller
	 */
	private $rest_controller;

	/**
	 * REST_Dashboard_Sharing_Controller instance.
	 *
	 * @since 1.109.0
	 * @var REST_Dashboard_Sharing_Controller
	 */
	private $dashboard_sharing_controller;

	/**
	 * Core module class names.
	 *
	 * @since 1.21.0
	 * @var string[] Core module class names.
	 */
	private $core_modules = array(
		Site_Verification::MODULE_SLUG  => Site_Verification::class,
		Search_Console::MODULE_SLUG     => Search_Console::class,
		Analytics_4::MODULE_SLUG        => Analytics_4::class,
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

		if ( Feature_Flags::enabled( 'adsModule' ) ) {
			$this->core_modules[ Ads::MODULE_SLUG ] = Ads::class;
		}

		$this->rest_controller              = new REST_Modules_Controller( $this );
		$this->dashboard_sharing_controller = new REST_Dashboard_Sharing_Controller( $this );
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

		$this->rest_controller->register();
		$this->sharing_settings->register();
		$this->dashboard_sharing_controller->register();

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

		add_filter( 'googlesitekit_inline_base_data', $this->get_method_proxy( 'inline_js_data' ) );
		add_filter( 'googlesitekit_inline_tracking_data', $this->get_method_proxy( 'inline_js_data' ) );

		add_filter( 'googlesitekit_inline_modules_data', $this->get_method_proxy( 'inline_modules_data' ) );

		add_filter(
			'googlesitekit_dashboard_sharing_data',
			function ( $data ) {
				$data['sharedOwnershipModules']               = array_keys( $this->get_shared_ownership_modules() );
				$data['defaultSharedOwnershipModuleSettings'] = $this->populate_default_shared_ownership_module_settings( array() );

				return $data;
			}
		);

		add_filter(
			'googlesitekit_module_exists',
			function ( $exists, $slug ) {
				return $this->module_exists( $slug );
			},
			10,
			2
		);

		add_filter(
			'googlesitekit_is_module_recoverable',
			function ( $recoverable, $slug ) {
				return $this->is_module_recoverable( $slug );
			},
			10,
			2
		);

		add_filter(
			'googlesitekit_is_module_connected',
			function ( $connected, $slug ) {
				return $this->is_module_connected( $slug );
			},
			10,
			2
		);

		add_filter( 'option_' . Module_Sharing_Settings::OPTION, $this->get_method_proxy( 'populate_default_shared_ownership_module_settings' ) );
		add_filter( 'default_option_' . Module_Sharing_Settings::OPTION, $this->get_method_proxy( 'populate_default_shared_ownership_module_settings' ), 20 );

		$this->sharing_settings->on_change(
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
								// If the option was just added, set the ownerID directly and bail.
								if ( empty( $old_values ) ) {
									$module->get_settings()->merge(
										array(
											'ownerID' => get_current_user_id(),
										)
									);

									return;
								}

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
			}
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
	 * Populates modules data to pass to JS.
	 *
	 * @since 1.96.0
	 *
	 * @param array $modules_data Inline modules data.
	 * @return array Inline modules data.
	 */
	private function inline_modules_data( $modules_data ) {
		$available_modules = $this->get_available_modules();

		foreach ( $available_modules as $module ) {
			if ( $module instanceof Module_With_Data_Available_State ) {
				$modules_data[ 'data_available_' . $module->slug ] = $this->is_module_active( $module->slug ) && $module->is_connected() && $module->is_data_available();
			}
		}

		return $modules_data;
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
	 * @since 1.85.0 Filter out modules which are missing any of the dependencies specified in `depends_on`.
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

			// Remove any modules which are missing dependencies. This may occur as the result of a dependency
			// being removed via the googlesitekit_available_modules filter.
			$this->modules = array_filter(
				$this->modules,
				function( Module $module ) {
					foreach ( $module->depends_on as $dependency ) {
						if ( ! isset( $this->modules[ $dependency ] ) ) {
							return false;
						}
					}
					return true;
				}
			);

			// Set up dependency maps.
			foreach ( $this->modules as $module ) {
				foreach ( $module->depends_on as $dependency ) {
					if ( $module->slug === $dependency ) {
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
	 * Gets the connected modules.
	 *
	 * @since 1.105.0
	 *
	 * @return array Connected modules as $slug => $module pairs.
	 */
	public function get_connected_modules() {
		$modules = $this->get_available_modules();

		return array_filter(
			$modules,
			function( Module $module ) {
				return $this->is_module_connected( $module->slug );
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
		if ( ! $this->is_module_active( $slug ) ) {
			return false;
		}

		$module = $this->get_module( $slug );

		return (bool) $module->is_connected();
	}

	/**
	 * Checks whether the module identified by the given slug is shareable.
	 *
	 * @since 1.105.0
	 *
	 * @param string $slug Unique module slug.
	 * @return bool True if module is shareable, false otherwise.
	 */
	public function is_module_shareable( $slug ) {
		$modules = $this->get_shareable_modules();

		return isset( $modules[ $slug ] );
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
		$this->options->set( self::OPTION_ACTIVE_MODULES, $option );
	}

	/**
	 * Gets the shareable connected modules.
	 *
	 * @since 1.50.0
	 * @since 1.105.0 Updated to only return connected shareable modules.
	 *
	 * @return array Shareable modules as $slug => $module pairs.
	 */
	public function get_shareable_modules() {
		$all_connected_modules = $this->get_connected_modules();

		return array_filter(
			$all_connected_modules,
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
	 * Inserts default settings for shared ownership modules in passed dashboard sharing settings.
	 *
	 * Sharing settings for shared ownership modules such as pagespeed-insights
	 * should always be manageable by "all admins". This function inserts
	 * this 'default' setting for their respective module slugs even when the
	 * dashboard_sharing settings option is not defined in the database or when settings
	 * are not set for these modules.
	 *
	 * @since 1.75.0
	 * @since 1.85.0 Renamed from filter_shared_ownership_module_settings to populate_default_shared_ownership_module_settings.
	 *
	 * @param array $sharing_settings The dashboard_sharing settings option fetched from the database.
	 * @return array Dashboard sharing settings option with default settings inserted for shared ownership modules.
	 */
	protected function populate_default_shared_ownership_module_settings( $sharing_settings ) {
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

	/**
	 * Deletes sharing settings.
	 *
	 * @since 1.84.0
	 *
	 * @return bool True on success, false on failure.
	 */
	public function delete_dashboard_sharing_settings() {
		return $this->options->delete( Module_Sharing_Settings::OPTION );
	}
}
