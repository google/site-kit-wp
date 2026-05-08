<?php
/**
 * TestGuard class.
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Closure;
use Google\Site_Kit\Core\Guards\Guard_Interface;

class TestGuard implements Guard_Interface {

	private Closure $implementation;

	public function __construct( Closure $can_activate ) {
		$this->implementation = $can_activate;
	}

	public function can_activate() {
		return ( $this->implementation )();
	}
}
