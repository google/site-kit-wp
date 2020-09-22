<?php
/**
 * User_TransientsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Transients;
use Google\Site_Kit\Tests\Core\Storage\User_Aware_Interface_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Storage
 */
class User_TransientsTest extends TestCase {

	use User_Aware_Interface_ContractTests;

	protected function create_user_aware_instance( $user_id ) {
		return new User_Transients(
			new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ),
			$user_id
		);
	}

}
