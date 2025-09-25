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
	 * Constructor.
	 *
	 * @since n.e.x.t
	 */
	public function __construct() {
		$this->register_checks();
	}

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
	 * Registers all compatibility checks.
	 *
	 * @since n.e.x.t
	 */
	private function register_checks() {
		$this->add_check( new WP_Login_Accessible_Check() );
		$this->add_check( new WP_COM_Check() );
		$this->add_check( new Conflicting_Plugins_Check() );
	}

	/**
	 * Runs all compatibility checks.
	 *
	 * @since n.e.x.t
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
