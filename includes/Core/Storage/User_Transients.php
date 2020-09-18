<?php
/**
 * Class Google\Site_Kit\Core\Storage\User_Transients
 *
 * @package   Google\Site_Kit
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

use Google\Site_Kit\Context;

/**
 * Class providing access to per-user transients.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class User_Transients implements User_Aware_Interface {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * User_Options object.
	 *
	 * @since n.e.x.t
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 * @param int     $user_id Optional. User ID for whom transients should be managed. Default is the current user.
	 */
	public function __construct( Context $context, $user_id = 0 ) {
		$this->context      = $context;
		$this->user_options = new User_Options( $context, $user_id );
	}

	/**
	 * Gets the associated user ID.
	 *
	 * @since n.e.x.t
	 *
	 * @return int User ID.
	 */
	public function get_user_id() {
		return $this->user_options->get_user_id();
	}

	/**
	 * Switches the current user to the one with the given ID.
	 *
	 * This method exists to exchange the user that is set as the current user in WordPress on the fly. In most cases
	 * it is preferred to create a new instance of the class when dealing with multiple users. This method should only
	 * be applied when the entire chain of class main instances need to be updated to rely on another user, i.e. when
	 * the current WordPress user has changed.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $user_id User ID.
	 * @return callable A closure to switch back to the original user.
	 */
	public function switch_user( $user_id ) {
		return $this->user_options->switch_user( $user_id );
	}

	/**
	 * Gets the value of the given transient.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $transient Transient name.
	 * @return mixed Value set for the transient, or false if not set.
	 */
	public function get( $transient ) {
		return wp_using_ext_object_cache()
			? $this->get_from_cache( $transient )
			: $this->get_from_user_options( $transient );
	}

	/**
	 * Sets the value for a transient.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $transient  Transient name.
	 * @param mixed  $value      Transient value.
	 * @param int    $expiration Optional. Time until expiration in seconds. Default 0 (no expiration).
	 * @return bool True on success, false on failure.
	 */
	public function set( $transient, $value, $expiration = 0 ) {
		return wp_using_ext_object_cache()
			? $this->set_in_cache( $transient, $value, $expiration )
			: $this->set_in_user_options( $transient, $value, $expiration );
	}

	/**
	 * Deletes the given transient.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $transient Transient name.
	 * @return bool True on success, false on failure.
	 */
	public function delete( $transient ) {
		return wp_using_ext_object_cache()
			? $this->delete_from_cache( $transient )
			: $this->delete_from_user_options( $transient );
	}

	/**
	 * Gets prefixed transient name for an external cache.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $transient Transient name.
	 * @return string Prefixed transient name.
	 */
	private function get_transient_name_for_cache( $transient ) {
		$user_id = $this->get_user_id();
		return $this->user_options->get_meta_key( "user_{$user_id}_{$transient}" );
	}

	/**
	 * Gets group name for an external cache.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Group name.
	 */
	private function get_transient_group_for_cache() {
		return $this->context->is_network_mode()
			? 'site-transient'
			: 'transient';
	}

	/**
	 * Gets the value of the given transient from an external cache.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $transient Transient name.
	 * @return mixed Value set for the transient, or false if not set.
	 */
	private function get_from_cache( $transient ) {
		$key   = $this->get_transient_name_for_cache( $transient );
		$group = $this->get_transient_group_for_cache();
		return wp_cache_get( $key, $group );
	}

	/**
	 * Sets the value for a transient in an external cache.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $transient  Transient name.
	 * @param mixed  $value      Transient value.
	 * @param int    $expiration Optional. Time until expiration in seconds. Default 0 (no expiration).
	 * @return bool True on success, false on failure.
	 */
	private function set_in_cache( $transient, $value, $expiration ) {
		$key   = $this->get_transient_name_for_cache( $transient );
		$group = $this->get_transient_group_for_cache();
		return wp_cache_set( $key, $value, $group, (int) $expiration ); // phpcs:ignore WordPressVIPMinimum.Performance.LowExpiryCacheTime.LowCacheTime
	}

	/**
	 * Deletes the given transient in an external cache.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $transient Transient name.
	 * @return bool True on success, false on failure.
	 */
	private function delete_from_cache( $transient ) {
		$key   = $this->get_transient_name_for_cache( $transient );
		$group = $this->get_transient_group_for_cache();
		return wp_cache_delete( $key, $group );
	}

	/**
	 * Gets prefixed transient name.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $transient Transient name.
	 * @return string Prefixed transient name.
	 */
	private function get_transient_name_for_user_options( $transient ) {
		return "googlesitekit_transient_{$transient}";
	}

	/**
	 * Gets prefixed transient timeout name.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $transient Transient name.
	 * @return string Prefixed transient timeout name.
	 */
	private function get_transient_timeout_for_user_options( $transient ) {
		return "googlesitekit_transient_timeout_{$transient}";
	}

	/**
	 * Gets the value of the given transient.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $transient Transient name.
	 * @return mixed Value set for the transient, or false if not set.
	 */
	private function get_from_user_options( $transient ) {
		$prefixed_transient_timeout = $this->get_transient_timeout_for_user_options( $transient );
		$timeout                    = $this->user_options->get( $prefixed_transient_timeout );
		if ( false !== $timeout && $timeout < time() ) {
			$this->delete( $transient );
			return false;
		}

		$prefixed_transient = $this->get_transient_name_for_user_options( $transient );
		return $this->user_options->get( $prefixed_transient );
	}

	/**
	 * Sets the value for a transient.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $transient  Transient name.
	 * @param mixed  $value      Transient value.
	 * @param int    $expiration Optional. Time until expiration in seconds. Default 0 (no expiration).
	 * @return bool True on success, false on failure.
	 */
	private function set_in_user_options( $transient, $value, $expiration ) {
		$prefixed_transient_timeout = $this->get_transient_timeout_for_user_options( $transient );
		$this->user_options->set( $prefixed_transient_timeout, (int) $expiration );

		$prefixed_transient = $this->get_transient_name_for_user_options( $transient );
		return $this->user_options->set( $prefixed_transient, $value );
	}

	/**
	 * Deletes the given transient.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $transient Transient name.
	 * @return bool True on success, false on failure.
	 */
	private function delete_from_user_options( $transient ) {
		$prefixed_transient_timeout = $this->get_transient_timeout_for_user_options( $transient );
		$this->user_options->delete( $prefixed_transient_timeout );

		$prefixed_transient = $this->get_transient_name_for_user_options( $transient );
		return $this->user_options->delete( $prefixed_transient );
	}

}
