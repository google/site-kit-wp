<?php
/**
 * Class Google\Site_Kit\Core\Abilities\Ability
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Abilities;

use WP_Ability;
use WP_Error;

/**
 * Base class for a Site Kit ability definition.
 *
 * WordPress handles discovery, schema validation, and permission checks. Callers
 * should execute the registered WP_Ability returned by wp_get_ability().
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
abstract class Ability {

	/**
	 * Default category for Site Kit abilities.
	 *
	 * @since n.e.x.t
	 * @var string
	 */
	const CATEGORY = 'site-kit';

	/**
	 * Gets the namespaced ability name.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Ability name in the google-site-kit namespace.
	 */
	final public function get_name() {
		return 'google-site-kit/' . $this->get_slug();
	}

	/**
	 * Registers the ability during wp_abilities_api_init.
	 *
	 * @since n.e.x.t
	 *
	 * @return WP_Ability|null Registered ability, or null if unavailable or invalid.
	 */
	final public function register() {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return null;
		}

		return wp_register_ability(
			$this->get_name(),
			array(
				'label'               => $this->get_label(),
				'description'         => $this->get_description(),
				'category'            => $this->get_category(),
				'input_schema'        => $this->get_input_schema(),
				'output_schema'       => $this->get_output_schema(),
				'execute_callback'    => function ( $input = null ) {
					return $this->execute( $input );
				},
				'permission_callback' => function ( $input = null ) {
					return $this->check_permissions( $input );
				},
				'meta'                => array_merge(
					$this->get_meta(),
					array(
						'annotations' => array(
							'instructions' => $this->get_instructions(),
							'readonly'     => $this->is_readonly(),
							'destructive'  => $this->is_destructive(),
							'idempotent'   => $this->is_idempotent(),
						),
						'public'      => true,
					)
				),
			)
		);
	}

	/**
	 * Gets the ability slug, including a module prefix for module abilities.
	 *
	 * Use lowercase letters, numbers, and hyphens, e.g. reader-revenue-manager-get-settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Unique ability slug within Site Kit.
	 */
	abstract protected function get_slug();

	/**
	 * Gets the translated ability label.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Human-readable ability label.
	 */
	abstract protected function get_label();

	/**
	 * Gets the translated ability description.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Description of the ability's purpose, input, and output.
	 */
	abstract protected function get_description();

	/**
	 * Gets the ability category.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Registered category slug, such as Ability::CATEGORY.
	 */
	abstract protected function get_category();

	/**
	 * Gets the input schema.
	 *
	 * @since n.e.x.t
	 *
	 * @return array JSON Schema for input, or an empty array if no input is accepted.
	 */
	abstract protected function get_input_schema();

	/**
	 * Gets the output schema.
	 *
	 * @since n.e.x.t
	 *
	 * @return array JSON Schema describing successful results.
	 */
	abstract protected function get_output_schema();

	/**
	 * Gets additional ability metadata.
	 *
	 * Annotations are supplied by the dedicated methods on this class.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Additional metadata, or an empty array if none is needed.
	 */
	abstract protected function get_meta();

	/**
	 * Gets instructions for using the ability.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Translated usage instructions, or an empty string if unnecessary.
	 */
	abstract protected function get_instructions();

	/**
	 * Checks whether the ability only reads data.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if the ability does not modify its environment.
	 */
	abstract protected function is_readonly();

	/**
	 * Checks whether the ability may perform destructive updates.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if the ability may delete or destructively modify data.
	 */
	abstract protected function is_destructive();

	/**
	 * Checks whether repeated execution has no additional effect.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if repeated calls with the same input have no additional effect.
	 */
	abstract protected function is_idempotent();

	/**
	 * Checks permissions for the current user and the validated input.
	 *
	 * Implementations must check the relevant Site Kit capabilities and any
	 * connection or authentication requirements for the operation.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $input Optional. Validated input. Default null.
	 * @return bool|WP_Error True if allowed, false or an error otherwise.
	 */
	abstract protected function check_permissions( $input = null );

	/**
	 * Executes the ability after WordPress validates input and checks permissions.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $input Optional. Validated input. Default null.
	 * @return mixed|WP_Error Ability result, or an error on failure.
	 */
	abstract protected function execute( $input = null );
}
