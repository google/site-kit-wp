<?php
/**
 * Class Google\Site_Kit\Core\Abilities\Connect_Module
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Abilities;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Modules\PageSpeed_Insights;
use Google\Site_Kit\Modules\Search_Console;
use WP_Error;

/**
 * Ability for activating a module and handing setup off to the browser.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Connect_Module extends Ability {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Module manager.
	 *
	 * @since n.e.x.t
	 * @var Modules
	 */
	private $modules;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 * @param Modules $modules Module manager.
	 */
	public function __construct( Context $context, Modules $modules ) {
		$this->context = $context;
		$this->modules = $modules;
	}

	/**
	 * Gets the ability slug.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Ability slug.
	 */
	protected function get_slug() {
		return 'connect-module';
	}

	/**
	 * Gets the translated ability label.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Ability label.
	 */
	protected function get_label() {
		return __( 'Connect a Site Kit Module', 'google-site-kit' );
	}

	/**
	 * Gets the translated ability description.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Ability description.
	 */
	protected function get_description() {
		return __( 'Starts connecting a Google service in Site Kit by activating its module and returning a URL for the user to finish setup manually in their browser. Activation alone does not complete Google authentication or service configuration.', 'google-site-kit' );
	}

	/**
	 * Gets the input schema.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Schema for the available module slugs and their names.
	 */
	protected function get_input_schema() {
		$modules      = $this->get_available_modules();
		$descriptions = array( __( 'The module to connect. Choose the slug corresponding to the requested Google service:', 'google-site-kit' ) );
		foreach ( $modules as $slug => $module ) {
			$descriptions[] = $slug . ': ' . $module->name;
		}

		return array(
			'type'                 => 'object',
			'properties'           => array(
				'slug' => array(
					'type'        => 'string',
					'enum'        => array_keys( $modules ),
					'description' => implode( "\n", $descriptions ),
				),
			),
			'required'             => array( 'slug' ),
			'additionalProperties' => false,
		);
	}

	/**
	 * Gets the output schema.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Schema for the activation result and browser setup URL.
	 */
	protected function get_output_schema() {
		return array(
			'type'                 => 'object',
			'properties'           => array(
				'slug'     => array(
					'type'        => 'string',
					'description' => __( 'Activated module slug.', 'google-site-kit' ),
				),
				'active'   => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the module is active. This does not indicate that authentication or setup is complete.', 'google-site-kit' ),
				),
				'setupURL' => array(
					'type'        => 'string',
					'format'      => 'uri',
					'description' => __( 'URL the user should open in their browser to complete or review module setup.', 'google-site-kit' ),
				),
			),
			'required'             => array( 'slug', 'active', 'setupURL' ),
			'additionalProperties' => false,
		);
	}

	/**
	 * Gets the ability category.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Site Kit category slug.
	 */
	protected function get_category() {
		return self::CATEGORY;
	}

	/**
	 * Gets additional ability metadata.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Empty metadata.
	 */
	protected function get_meta() {
		return array();
	}

	/**
	 * Gets instructions for using the ability.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Usage instructions.
	 */
	protected function get_instructions() {
		return __( 'Match the requested Google service to a module slug using the input description; ask the user if the service is ambiguous. After activation, present setupURL as a clickable link and ask the user to open it in their browser, sign in to WordPress if needed, and manually complete any Google authentication, consent, and service setup steps. If prompted to reauthenticate, follow that prompt and reopen setupURL afterwards if needed. Do not collect passwords, authorization codes, or tokens in the conversation, and do not complete authentication on the user’s behalf. Explain that the module is activated, not necessarily fully connected. Wait for the user to finish before continuing dependent work; do not infer setup completion from active being true. If no setup steps are shown, ask the user to review the module in Site Kit. Existing active modules are not deactivated or reset. Inactive dependencies must be activated separately.', 'google-site-kit' );
	}

	/**
	 * Checks whether the ability only reads data.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Always false.
	 */
	protected function is_readonly() {
		return false;
	}

	/**
	 * Checks whether the ability may perform destructive updates.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Always false; activation does not reset existing module settings.
	 */
	protected function is_destructive() {
		return false;
	}

	/**
	 * Checks whether repeated execution has no additional effect.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Always true; already activated modules remain active.
	 */
	protected function is_idempotent() {
		return true;
	}

	/**
	 * Checks the same permissions as the module activation REST endpoint.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $input Optional. Validated input. Default null.
	 * @return bool Whether the current user can activate modules.
	 */
	protected function check_permissions( $input = null ) {
		return current_user_can( Permissions::SETUP ) || current_user_can( Permissions::MANAGE_OPTIONS );
	}

	/**
	 * Activates the module and returns the browser setup destination.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $input Optional. Validated input. Default null.
	 * @return array|WP_Error Activation result and setup URL, or an activation error.
	 */
	protected function execute( $input = null ) {
		$slug    = $input['slug'];
		$modules = $this->get_available_modules();
		if ( ! isset( $modules[ $slug ] ) ) {
			return new WP_Error( 'invalid_module_slug', __( 'The requested module is not available.', 'google-site-kit' ) );
		}

		// Match REST_Modules_Controller::handle_module_activation() dependency checks.
		$all_modules = $this->modules->get_available_modules();
		foreach ( $this->modules->get_module_dependencies( $slug ) as $dependency_slug ) {
			if ( ! $this->modules->is_module_active( $dependency_slug ) ) {
				return new WP_Error(
					'inactive_dependencies',
					sprintf(
						/* translators: %s: module name */
						__( 'Module cannot be activated because of inactive dependency %s.', 'google-site-kit' ),
						$all_modules[ $dependency_slug ]->name
					),
					array( 'status' => 500 )
				);
			}
		}

		if ( ! $this->modules->activate_module( $slug ) ) {
			return new WP_Error(
				'cannot_activate_module',
				__( 'An internal error occurred while trying to activate the module.', 'google-site-kit' ),
				array( 'status' => 500 )
			);
		}

		// Mirror the dashboard destination in create-info-store.js#getAdminReauthURL.
		// Leave nonce-bearing authentication links to the user's browser session.
		$query_args = array(
			'slug'   => $slug,
			'reAuth' => 'true',
		);
		// These modules set requiresSetup: false in their client-side base stores.
		if ( in_array( $slug, array( PageSpeed_Insights::MODULE_SLUG, Search_Console::MODULE_SLUG ), true ) ) {
			unset( $query_args['reAuth'] );
			$query_args['notification'] = 'authentication_success';
		}

		return array(
			'slug'     => $slug,
			'active'   => true,
			'setupURL' => $this->context->admin_url( 'dashboard', $query_args ),
		);
	}

	/**
	 * Gets available user-facing modules, including those not yet active.
	 *
	 * @since n.e.x.t
	 *
	 * @return Module[] Available modules keyed by slug.
	 */
	private function get_available_modules() {
		return array_filter(
			$this->modules->get_available_modules(),
			function ( Module $module ) {
				return ! $module->internal;
			}
		);
	}
}
