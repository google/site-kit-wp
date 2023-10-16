<?php
/**
 * WP_Entity_HelpersTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\WP_Entity_Helpers;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class WP_Entity_HelpersTest extends TestCase {

	public function test_get_user_display_name() {
		$test_user_id = $this->factory()->user->create( array( 'display_name' => 'test display name' ) );
		$this->assertEquals( 'test display name', WP_Entity_Helpers::get_user_display_name( $test_user_id ) );
	}

}
