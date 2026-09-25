<?php
/**
 * Class Google\Site_Kit\Core\Intents\Intent
 *
 * @package   Google\Site_Kit\Core\Intents
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Intents;

/**
 * Base class for an intent that an external Google surface can ask Site Kit to handle.
 *
 * @since 1.188.0
 * @access private
 * @ignore
 */
abstract class Intent {

	/**
	 * Gets the intent ID.
	 *
	 * @since 1.188.0
	 *
	 * @return string Intent ID.
	 */
	abstract public function get_id();

	/**
	 * Checks whether the intent can currently be handled.
	 *
	 * Subclasses override this when the intent is only handled under some condition.
	 *
	 * @since 1.188.0
	 *
	 * @return bool True if the intent can be handled, false otherwise.
	 */
	public function is_available() {
		return true;
	}
}
