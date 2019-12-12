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
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Authentication\Authentication;
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
		$this->context = $context;

		if ( ! $options ) {
			$options = new Options( $this->context );
		}
		$this->options = $options;

		if ( ! $user_options ) {
			$user_options = new User_Options( $this->context );
		}
		$this->user_options = $user_options;

		if ( ! $authentication ) {
			$authentication = new Authentication( $this->context, $this->options, $this->user_options );
		}
		$this->authentication = $authentication;
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
				$modules = $this->get_available_modules();
				foreach ( $modules as $module ) {
					$data[ $module->slug ]                  = $module->prepare_info_for_js();
					$data[ $module->slug ]['active']        = $this->is_module_active( $module->slug );
					$data[ $module->slug ]['setupComplete'] = $data[ $module->slug ]['active'] && $this->is_module_connected( $module->slug );
					$data[ $module->slug ]['dependencies']  = $this->get_module_dependencies( $module->slug );
					$data[ $module->slug ]['dependants']    = $this->get_module_dependants( $module->slug );
				}
				return $data;
			}
		);

		$active_modules = $this->get_active_modules();

		array_walk(
			$active_modules,
			function( Module $module ) {
				$module->register();
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
