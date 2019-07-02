<?php
/**
 * MethodSpy
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

class MethodSpy {
	/**
	 * Associative array of method invocations.
	 *
	 * @var array
	 */
	public $invocations = array();

	/**
	 * Record all method calls.
	 *
	 * @param string $method Method invoked
	 * @param array $arguments Arguments invoked with
	 */
	public function __call( $method, $arguments ) {
		$this->invocations[ $method ][] = $arguments;
	}
}
