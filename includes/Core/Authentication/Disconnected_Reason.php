<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Disconnected_Reason
 *
 * @package   Google\Site_Kit\Core\Authentication
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Core\Storage\User_Setting;

/**
 * Disconnected_Reason class.
 *
 * @since 1.17.0
 * @access private
 * @ignore
 */
class Disconnected_Reason extends User_Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_disconnected_reason';

	/**
	 * Available reasons.
	 */
	const REASON_CONNECTED_URL_MISMATCH = 'connected_url_mismatch';

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since 1.17.0
	 */
	public function register() {
		parent::register();
		add_action( 'googlesitekit_authorize_user', array( $this, 'delete' ) );
	}

}
