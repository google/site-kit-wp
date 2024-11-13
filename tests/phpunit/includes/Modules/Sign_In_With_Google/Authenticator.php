<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Sign_In_With_Google\Authenticator
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Sign_In_With_Google;

use Google\Site_Kit\Core\Util\Input;
use Google\Site_Kit\Modules\Sign_In_With_Google\Authenticator_Interface;

class Authenticator implements Authenticator_Interface {

	private $data;

	public function __construct( $data ) {
		$this->data = $data;
	}

	public function authenticate_user( Input $input ) {
		return $this->data;
	}
}
