<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks\Compatibility_Check
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google\Compatibility_Checks;

/**
 * Abstract base class for compatibility checks.
 *
 * @since 1.164.0
 */
abstract class Compatibility_Check {

	/**
	 * Gets the unique slug for this compatibility check.
	 *
	 * @since 1.164.0
	 *
	 * @return string The unique slug for this compatibility check.
	 */
	abstract public function get_slug();

	/**
	 * Runs the compatibility check.
	 *
	 * @since 1.164.0
	 *
	 * @return array The result of the compatibility check.
	 */
	abstract public function run();
}
