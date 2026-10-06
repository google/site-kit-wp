<?php
/**
 * FakeModule Permission-Aware Schema-Aware Test Request Datapoint
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules\Datapoints;

use Google\Site_Kit\Core\Modules\Permission_Aware_Datapoint;

/**
 * Fake `POST` datapoint that is served by its own REST route and overrides
 * the default REST permission check with the `edit_posts` capability.
 */
class FakeModule_Permission_Aware_Schema_Request extends FakeModule_Schema_Aware_Set_Request implements Permission_Aware_Datapoint {

	/**
	 * Checks whether the current user is allowed to access the datapoint.
	 *
	 * @return bool True if the current user can edit posts, false otherwise.
	 */
	public function permission_callback() {
		return current_user_can( 'edit_posts' );
	}
}
