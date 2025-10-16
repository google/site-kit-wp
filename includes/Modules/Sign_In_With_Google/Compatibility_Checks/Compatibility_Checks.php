<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks\Compatibility_Checks
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
 * @since 1.164.0
 */
class Compatibility_Checks {

	/**
	 * Collection of compatibility checks.
	 *
	 * @since 1.164.0
	 *
	 * @var array
	 */
	private $checks = array();

	/**
	 * Adds a compatibility check to the collection.
	 *
	 * @since 1.164.0
	 *
	 * @param Compatibility_Check $check The compatibility check to add.
	 */
	public function add_check( Compatibility_Check $check ) {
		$this->checks[] = $check;
	}

	/**
	 * Runs all compatibility checks.
	 *
	 * @since 1.164.0
	 *
	 * @return array Results of the compatibility checks.
	 */
	public function run_checks() {
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
