<?php
/**
 * Class Google\Site_Kit\Tests\Core\Admin\Available_ToolsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Admin
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760


namespace Google\Site_Kit\Tests\Core\Admin;

use Google\Site_Kit\Core\Admin\Available_Tools;
use PHPUnit\Framework\TestCase;

/**
 * @group Admin
 */
class Available_ToolsTest extends TestCase {

	public function test_register() {
		$tools = new Available_Tools();
		remove_all_actions( 'tool_box' );

		$tools->register();

		$this->assertTrue( has_action( 'tool_box' ), 'Available_Tools should register the tool_box action.' );
	}
}
