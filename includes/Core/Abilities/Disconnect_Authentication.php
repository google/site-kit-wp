<?php
/**
 * Class Google\Site_Kit\Core\Abilities\Disconnect_Authentication
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Abilities;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Storage\Transients;
use WP_Error;

/**
 * Ability for disconnecting a user's Site Kit authentication.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Disconnect_Authentication extends Ability {

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
		return 'auth-disconnect';
	}

	/**
	 * Gets the translated ability label.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Ability label.
	 */
	protected function get_label() {
		return __( 'Disconnect Site Kit User', 'google-site-kit' );
	}

	/**
	 * Gets the translated ability description.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Ability description.
	 */
	protected function get_description() {
		return __( 'Disconnects the specified WordPress user from Site Kit by revoking their Google token and removing their Site Kit user data. Requires the user ID and returns that ID with the completion status.', 'google-site-kit' );
	}

	/**
	 * Gets the input schema.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Schema for the required user ID.
	 */
	protected function get_input_schema() {
		return array(
			'type'                 => 'object',
			'properties'           => array(
				'id' => array(
					'type'        => 'integer',
					'minimum'     => 1,
					'description' => __( 'WordPress user ID to disconnect from Site Kit.', 'google-site-kit' ),
				),
			),
			'required'             => array( 'id' ),
			'additionalProperties' => false,
		);
	}

	/**
	 * Gets the output schema.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Schema for the disconnect result.
	 */
	protected function get_output_schema() {
		return array(
			'type'                 => 'object',
			'properties'           => array(
				'success' => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the Site Kit user disconnect completed.', 'google-site-kit' ),
				),
				'id'      => array(
					'type'        => 'integer',
					'description' => __( 'WordPress user ID that was disconnected.', 'google-site-kit' ),
				),
			),
			'required'             => array( 'success', 'id' ),
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
		return __( 'Provide the WordPress user ID, not a Google account ID. Disconnecting another user requires permission to edit that user. The user will need to reconnect to Site Kit to restore their access.', 'google-site-kit' );
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
	 * Checks whether the current user can disconnect the specified user.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $input Optional. Validated input. Default null.
	 * @return bool|WP_Error True if allowed, false or an error otherwise.
	 */
	protected function check_permissions( $input = null ) {
		if ( ! current_user_can( Permissions::AUTHENTICATE ) ) {
			return false;
		}

		$user_id = (int) $input['id'];
		if ( get_current_user_id() !== $user_id && ! current_user_can( 'edit_user', $user_id ) ) {
			return false;
		}

		if ( ! get_userdata( $user_id ) || ( is_multisite() && ! is_user_member_of_blog( $user_id ) ) ) {
			return new WP_Error(
				'invalid_user',
				__( 'The specified user does not exist on this site.', 'google-site-kit' ),
				array( 'status' => 404 )
			);
		}

		return true;
	}

	/**
	 * Disconnects the specified user using the same operation as the auth CLI command.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $input Optional. Validated input. Default null.
	 * @return array Disconnect result.
	 */
	protected function execute( $input = null ) {
		$user_id = (int) $input['id'];

		$authentication = new Authentication(
			$this->context,
			new Options( $this->context ),
			new User_Options( $this->context, $user_id ),
			new Transients( $this->context )
		);
		$authentication->disconnect();

		return array(
			'success' => true,
			'id'      => $user_id,
		);
	}
}
