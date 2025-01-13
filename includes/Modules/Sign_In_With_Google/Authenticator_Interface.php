<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Authenticator_Interface
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google;

use Google\Site_Kit\Core\Util\Input;

/**
 * Defines methods that must be implemented by an authenticator class.
 *
 * @since 1.141.0
 * @access private
 * @ignore
 */
interface Authenticator_Interface {

	/**
	 * Authenticates the user using the provided input data.
	 *
	 * @since 1.141.0
	 *
	 * @param Input $input Input instance.
	 * @return string Redirect URL.
	 */
	public function authenticate_user( Input $input );
}
