<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Existing_Client_ID
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google;

use Google\Site_Kit\Core\Storage\Setting;

/**
 * Class for persisting the client ID between module disconnection and
 * reconnection.
 *
 * @since 1.142.0
 * @access private
 * @ignore
 */
class Existing_Client_ID extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_siwg_existing_client_id';
}
