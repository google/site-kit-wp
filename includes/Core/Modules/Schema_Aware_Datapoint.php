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
 * Interface for a datapoint that describes its REST arguments and response.
 *
 * A datapoint implementing this interface is served by its own REST route,
 * so WordPress validates its arguments before the datapoint runs and lists
 * its argument schema in the REST API index, along with its resource schema
 * when the index is requested with `context=help`. Other datapoints are
 * served by the catch-all module data route.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
interface Schema_Aware_Datapoint {

	/**
	 * Gets the argument schema of the datapoint's REST endpoint.
	 *
	 * A `POST` datapoint receives the `data` argument of the request, so its
	 * schema describes `data` as an object with the datapoint's parameters as
	 * its properties. WordPress checks the `required` flag of those properties
	 * from version 5.5, so the datapoint keeps its own checks for them.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Map of argument names to their schemas.
	 */
	public function get_args();

	/**
	 * Gets the resource schema of the data the datapoint returns.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Resource schema.
	 */
	public function get_schema();
}
