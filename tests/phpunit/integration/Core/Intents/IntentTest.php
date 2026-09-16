<?php
/**
 * Class Google\Site_Kit\Tests\Core\Intents\IntentTest
 *
 * @package   Google\Site_Kit\Tests\Core\Intents
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Intents;

use Google\Site_Kit\Core\Intents\Intent;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Intents
 */
class IntentTest extends TestCase {

	public function test_is_available__is_true_for_a_subclass_that_only_provides_an_ID() {
		$intent = new class() extends Intent {
			public function get_id() {
				return 'test-intent';
			}
		};

		$this->assertTrue( $intent->is_available(), 'An intent that leaves is_available() alone should report itself available.' );
	}
}
