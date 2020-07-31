<?php
/**
 * Class Google\Site_Kit\Core\Storage\Owner_ID
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

use Google\Site_Kit\Core\Authentication\First_Admin;
use Google\Site_Kit\Core\Storage\Options_Interface;
use Google\Site_Kit\Core\Storage\Setting;

/**
 * Owner_ID class.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Owner_ID extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_owner_id';

	/**
	 * First admin option instance.
	 *
	 * @since n.e.x.t
	 * @var First_Admin
	 */
	protected $first_admin;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Options_Interface $options     Options instance.
	 * @param First_Admin       $first_admin User options instance.
	 */
	public function __construct( Options_Interface $options, First_Admin $first_admin ) {
		parent::__construct( $options );
		$this->first_admin = $first_admin;
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'integer';
	}

	/**
	 * Gets the default value.
	 *
	 * @since n.e.x.t
	 *
	 * @return mixed The default value.
	 */
	protected function get_default() {
		return $this->first_admin->get();
	}

	/**
	 * Gets the callback for sanitizing the setting's value before saving.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable The callable sanitize callback.
	 */
	protected function get_sanitize_callback() {
		return 'intval';
	}

}
