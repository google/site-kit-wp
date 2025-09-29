<?php
/**
 * Compatibility checks manager.
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks;

/**
 * Manager class for compatibility checks.
 *
 * @since n.e.x.t
 */
class Compatibility_Checks {

	/**
	 * Collection of compatibility checks.
	 *
	 * @since n.e.x.t
	 *
	 * @var array
	 */
	private $checks = array();

	/**
	 * Adds a compatibility check to the collection.
	 *
	 * @since n.e.x.t
	 *
	 * @param Compatibility_Check $check The compatibility check to add.
	 */
	public function add_check( Compatibility_Check $check ) {
		$this->checks[] = $check;
	}

	/**
	 * Runs all compatibility checks.
	 *
	 * @since n.e.x.t
	 *
	 * @param bool $use_long_running Whether to use long running tasks or not.
	 * @return array Results of the compatibility checks.
	 */
	public function run_checks( $use_long_running = false ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		$results = array();

		foreach ( $this->checks as $check ) {
			$result = $check->run();

			if ( $result ) {
				$results[ $check->get_slug() ] = $result;
			}
		}

		return $results;
	}
}
