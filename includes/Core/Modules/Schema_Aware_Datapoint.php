<?php
/**
 * Interface Google\Site_Kit\Core\Modules\Schema_Aware_Datapoint
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Modules;

/**
 * Interface for a datapoint that describes the parameters it accepts.
 *
 * `Module::execute_data_request()` validates the parameters of every request
 * made through `Module::get_data()` or `Module::set_data()`, including REST
 * requests, against the schema before the datapoint runs, and passes on the
 * sanitized values. Code that calls the datapoint's `create_request()` directly
 * skips this validation.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
interface Schema_Aware_Datapoint {

	/**
	 * Gets the schema of the parameters the datapoint accepts.
	 *
	 * The schema has the same shape as the `args` of a REST route: a map of
	 * parameter names to their schemas. For a `POST` datapoint, these are the
	 * keys of the data to set.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Map of parameter names to their schemas.
	 */
	public function get_args_schema();
}
