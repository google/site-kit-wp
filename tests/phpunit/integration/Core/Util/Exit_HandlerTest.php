<?php
/**
 * Exit_HandlerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Core\Util\Exit_Handler;
use Google\Site_Kit\Tests\MethodSpy;
use Google\Site_Kit\Tests\TestCase;

/**
 * Class Exit_HandlerTest
 *
 * @group Util
 */
class Exit_HandlerTest extends TestCase {

	public function test_invoke() {
		remove_all_filters( 'googlesitekit_exit_handler' );
		$spy     = new MethodSpy();
		$handler = new Exit_Handler();

		add_filter(
			'googlesitekit_exit_handler',
			function () use ( $spy ) {
				return function () use ( $spy ) {
					$spy->invoke();
				};
			} 
		);
		$this->assertArrayNotHasKey( 'invoke', $spy->invocations );

		$handler->invoke();
		$handler->invoke();
		$handler->invoke();

		$this->assertCount( 3, $spy->invocations['invoke'] );
	}
}
