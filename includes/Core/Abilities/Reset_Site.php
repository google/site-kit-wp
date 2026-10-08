<?php
/**
 * Class Google\Site_Kit\Core\Abilities\Reset_Site
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Abilities;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Util\Reset;
use Google\Site_Kit\Core\Util\Reset_Persistent;

/**
 * Ability for resetting Site Kit settings and data.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Reset_Site extends Ability {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Gets the ability slug.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Ability slug.
	 */
	protected function get_slug() {
		return 'reset-site';
	}

	/**
	 * Gets the translated ability label.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Ability label.
	 */
	protected function get_label() {
		return __( 'Reset Site Kit', 'google-site-kit' );
	}

	/**
	 * Gets the translated ability description.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Ability description.
	 */
	protected function get_description() {
		return __( 'Resets Site Kit for this site by deleting its settings, user data, transients, and stored content, and clearing the object cache. Optionally also deletes persistent Site Kit data. Returns whether the reset completed.', 'google-site-kit' );
	}

	/**
	 * Gets the input schema.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Schema for the optional persistent flag.
	 */
	protected function get_input_schema() {
		return array(
			'type'                 => 'object',
			'properties'           => array(
				'persistent' => array(
					'type'        => 'boolean',
					'description' => __( 'Whether to also delete persistent Site Kit data.', 'google-site-kit' ),
					'default'     => false,
				),
			),
			'additionalProperties' => false,
			'default'              => array( 'persistent' => false ),
		);
	}

	/**
	 * Gets the output schema.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Schema for the reset result.
	 */
	protected function get_output_schema() {
		return array(
			'type'                 => 'object',
			'properties'           => array(
				'success' => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the Site Kit reset completed.', 'google-site-kit' ),
				),
			),
			'required'             => array( 'success' ),
			'additionalProperties' => false,
		);
	}

	/**
	 * Gets instructions for using the ability.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Usage instructions.
	 */
	protected function get_instructions() {
		return __( 'This operation deletes Site Kit data for all users on this site and requires setting up Site Kit again. Set persistent to true only when persistent Site Kit data should also be removed. Data stored in Google services is not deleted.', 'google-site-kit' );
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
	 * @return bool Always true.
	 */
	protected function is_destructive() {
		return true;
	}

	/**
	 * Checks whether repeated execution has no additional effect.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool Always true.
	 */
	protected function is_idempotent() {
		return true;
	}

	/**
	 * Checks whether the current user can reset Site Kit.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $input Optional. Validated input. Default null.
	 * @return bool Whether the current user can set up Site Kit.
	 */
	protected function check_permissions( $input = null ) {
		return current_user_can( Permissions::SETUP );
	}

	/**
	 * Resets Site Kit using the same operations as the reset CLI command.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $input Optional. Validated input. Default null.
	 * @return array Reset result.
	 */
	protected function execute( $input = null ) {
		$reset = new Reset( $this->context );
		$reset->all();

		if ( ! empty( $input['persistent'] ) ) {
			$reset_persistent = new Reset_Persistent( $this->context );
			$reset_persistent->all();
		}

		return array( 'success' => true );
	}
}
