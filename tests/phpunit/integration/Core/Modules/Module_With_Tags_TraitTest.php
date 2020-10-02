<?php
/**
 * Class Google\Site_Kit\Tests\Core\Modules\Module_With_Tags_TraitTest
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Tests\TestCase;

class Module_With_Tags_TraitTest extends TestCase {

	public function test_is_tag_blocked() {
		$module = new FakeModule_With_Tags( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// Tag is not blocked by default.
		$this->assertFalse( $module->is_tag_blocked() );

		add_filter( 'googlesitekit_fake-module_tag_blocked', '__return_true' );

		$this->assertTrue( $module->is_tag_blocked() );

		// The return value of the filter is cast to a boolean before returning.
		add_filter( 'googlesitekit_fake-module_tag_blocked', '__return_empty_string' );
		$this->assertFalse( $module->is_tag_blocked() );
	}
}
