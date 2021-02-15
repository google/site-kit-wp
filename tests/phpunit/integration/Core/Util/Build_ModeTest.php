<?php
/**
 * Build_ModeTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Build_Mode;
use Google\Site_Kit\Tests\TestCase;
use ReflectionMethod;

class Build_ModeTest extends TestCase {

	public function test_get_mode() {
		$method = new ReflectionMethod( Build_Mode::class, 'get_mode' );
		$method->setAccessible( true );
		$get_mode = function ( ...$args ) use ( $method ) {
			return $method->invoke( null, ...$args );
		};

		// Defaults to 'production'.
		$this->assertEquals( 'production', $get_mode() );

		// It uses the flag mode it's provided.
		Build_Mode::set_mode( 'foo' );
		$this->assertEquals( 'foo', $get_mode() );

		// Is filterable.
		$return_custom_mode = function () {
			return 'custom';
		};
		add_filter( 'googlesitekit_build_mode', $return_custom_mode );
		$this->assertEquals( 'custom', $get_mode() );

		// Defaults to production if filter returns falsy.
		add_filter( 'googlesitekit_build_mode', '__return_false' );
		$this->assertEquals( 'production', $get_mode() );
	}

}
