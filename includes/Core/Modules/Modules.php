<?php
/**
 * Class Google\Site_Kit\Core\Modules\Modules
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\REST_Route;
use Google\Site_Kit\Core\REST_API\REST_Routes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Datapoint_Exception;
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
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context        $context        Plugin context.
	 * @param Options        $options        Optional. Option API instance. Default is a new instance.
	 * @param User_Options   $user_options   Optional. User Option API instance. Default is a new instance.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null,
		Authentication $authentication = null
	) {
		$this->context        = $context;
		$this->options        = $options ?: new Options( $this->context );
		$this->user_options   = $user_options ?: new User_Options( $this->context );
		$this->authentication = $authentication ?: new Authentication( $this->context, $this->options, $this->user_options );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		add_filter(
			'googlesitekit_modules_data',
			function( $data ) {
				foreach ( $this->get_available_modules() as $module ) {
					$data[ $module->slug ]                  = $module->prepare_info_for_js();
					$data[ $module->slug ]['active']        = $this->is_module_active( $module->slug );
					$data[ $module->slug ]['setupComplete'] = $data[ $module->slug ]['active'] && $this->is_module_connected( $module->slug );
					$data[ $module->slug ]['dependencies']  = $this->get_module_dependencies( $module->slug );
					$data[ $module->slug ]['dependants']    = $this->get_module_dependants( $module->slug );
					$data[ $module->slug ]['owner']         = null;

					if ( current_user_can( 'list_users' ) && $module instanceof Module_With_Owner ) {
						$owner_id = $module->get_owner_id();
						if ( $owner_id ) {
							$data[ $module->slug ]['owner'] = array(
								'id'    => $owner_id,
								'login' => get_the_author_meta( 'user_login', $owner_id ),
							);
						}
					}
				}

				return $data;
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
			}
		);

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
			$module_classes = array(
				'Google\Site_Kit\Modules\Site_Verification',
				'Google\Site_Kit\Modules\Search_Console',
				'Google\Site_Kit\Modules\Analytics',
				'Google\Site_Kit\Modules\Optimize',
				'Google\Site_Kit\Modules\Tag_Manager',
				'Google\Site_Kit\Modules\AdSense',
				'Google\Site_Kit\Modules\PageSpeed_Insights',
			);
			foreach ( $module_classes as $module_class ) {
				$instance = new $module_class( $this->context, $this->options, $this->user_options, $this->authentication );

				$this->modules[ $instance->slug ]      = $instance;
				$this->dependencies[ $instance->slug ] = array();
				$this->dependants[ $instance->slug ]   = array();
			}

			uasort(
				$this->modules,
				function( Module $a, Module $b ) {
					return $a->order > $b->order;
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

		return array_merge(
			// Force-active modules.
			array_filter(
				$modules,
				function( Module $module ) {
					return $module->force_active;
				}
			),
			// Manually active modules.
			array_intersect_key(
				$modules,
				array_flip( $option )
			)
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

		$option = $this->get_active_modules_option();

		if ( in_array( $slug, $option, true ) ) {
			return true;
		}

		$option[] = $slug;

		$this->set_active_modules_option( $option );

		if ( is_callable( array( $module, 'on_activation' ) ) ) {
			call_user_func( array( $module, 'on_activation' ) );
		}

		return true;
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

		if ( is_callable( array( $module, 'on_deactivation' ) ) ) {
			call_user_func( array( $module, 'on_deactivation' ) );
		}

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
	 * Gets related REST routes.
	 *
	 * @since 1.3.0
	 *
	 * @return array List of REST_Route objects.
	 */
	private function get_rest_routes() {
		$can_authenticate = function() {
			return current_user_can( Permissions::AUTHENTICATE );
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
						'permission_callback' => $can_authenticate,
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
				'modules/(?P<slug>[a-z\-]+)/data/notifications',
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
				'modules/(?P<slug>[a-z\-]+)/data/settings',
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

							$data   = isset( $request['data'] ) ? (array) $request['data'] : array();
							$result = $this->update_module_settings( $module, $data );
							if ( is_wp_error( $result ) ) {
								return $result;
							}
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
				'modules/(?P<slug>[a-z\-]+)/data/(?P<datapoint>[a-z\-]+)',
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
		);
	}

	/**
	 * Updates settings for a module.
	 *
	 * If the module includes a datapoint 'POST:settings', that datapoint is relied upon, allowing more advanced
	 * customization. Otherwise this method will ensure every setting is present as a parameter and then update the
	 * settings.
	 *
	 * @since 1.6.0
	 *
	 * @param Module $module Module to update settings for. Must implement {@see Module_With_Settings}.
	 * @param array  $data   Associative array of new settings data to set.
	 * @return bool|WP_Error True on success, or an error object on failure.
	 */
	private function update_module_settings( Module $module, array $data ) {
		if ( ! $module instanceof Module_With_Settings ) {
			return new WP_Error( 'invalid_module_slug', __( 'Module does not support settings.', 'google-site-kit' ), array( 'status' => 400 ) );
		}

		if ( in_array( 'settings', $module->get_datapoints(), true ) ) {
			$result = $module->set_data( 'settings', $data );
			if ( is_wp_error( $result ) && $result->get_error_code() !== Invalid_Datapoint_Exception::WP_ERROR_CODE ) {
				return $result;
			} elseif ( ! is_wp_error( $result ) ) {
				return true;
			}
		}

		if ( ! $module->get_settings()->merge( $data ) ) {
			return new WP_Error( 'updating_settings_failed', __( 'Updating settings failed.', 'google-site-kit' ), array( 'status' => 500 ) );
		}

		return true;
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

		if ( is_array( $option ) ) {
			return $option;
		}

		$legacy_option = $this->options->get( 'googlesitekit-active-modules' );

		if ( is_array( $legacy_option ) ) {
			return $legacy_option;
		}

		return array();
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
}
