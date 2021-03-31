<?php
/**
 * Class Google\Site_Kit\Core\Storage\User_Options
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

use Google\Site_Kit\Context;

/**
 * Class providing access to per-user options.
 *
 * It uses user options (which are per site) or user meta, depending on in which mode the plugin is running.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class User_Options implements User_Options_Interface {

	use User_Aware_Trait;

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context $context Plugin context.
	 * @param int     $user_id Optional. User ID for whom options should be managed. Default is the current user.
	 */
	public function __construct( Context $context, $user_id = 0 ) {
		$this->context = $context;

		if ( empty( $user_id ) ) {
			$user_id = get_current_user_id();
		}
		$this->user_id = (int) $user_id;
	}

	/**
	 * Gets the value of the given user option.
	 *
	 * @since 1.0.0
	 *
	 * @param string $option User option name.
	 * @return mixed Value set for the user option, or false if not set.
	 */
	public function get( $option ) {
		$user_id = $this->get_user_id();
		if ( ! $user_id ) {
			return false;
		}

		if ( $this->context->is_network_mode() ) {
			$value = get_user_meta( $user_id, $option );
			if ( empty( $value ) ) {
				return false;
			}

			return $value[0];
		}

		return get_user_option( $option, $user_id );
	}

	/**
	 * Sets the value for a user option.
	 *
	 * @since 1.0.0
	 *
	 * @param string $option User option name.
	 * @param mixed  $value User option value. Must be serializable if non-scalar.
	 * @return bool True on success, false on failure.
	 */
	public function set( $option, $value ) {
		$user_id = $this->get_user_id();
		if ( ! $user_id ) {
			return false;
		}

		if ( $this->context->is_network_mode() ) {
			return (bool) update_user_meta( $user_id, $option, $value );
		}

		return (bool) update_user_option( $user_id, $option, $value );
	}

	/**
	 * Deletes the given user option.
	 *
	 * @since 1.0.0
	 *
	 * @param string $option User option name.
	 * @return bool True on success, false on failure.
	 */
	public function delete( $option ) {
		$user_id = $this->get_user_id();
		if ( ! $user_id ) {
			return false;
		}

		if ( $this->context->is_network_mode() ) {
			return (bool) delete_user_meta( $user_id, $option );
		}

		return (bool) delete_user_option( $user_id, $option );
	}

	/**
	 * Gets the underlying meta key for the given option.
	 *
	 * @since 1.4.0
	 *
	 * @param string $option Option name.
	 * @return string Meta key name.
	 */
	public function get_meta_key( $option ) {
		global $wpdb;

		if ( $this->context->is_network_mode() ) {
			return $option;
		}

		return $wpdb->get_blog_prefix() . $option;
	}

}
