<?php
/**
 * Scoped_DependenciesTest
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit_Dependencies\phpseclib3\Math\BigInteger;

/**
 * @group Dependencies
 */
class Scoped_DependenciesTest extends TestCase {

	/**
	 * Verifies that phpseclib's BigInteger resolves its engine from the scoped namespace.
	 *
	 * Engine selection builds FQCNs from string literals. Broken PHP-Scoper patching leaves
	 * unprefixed `phpseclib3\...` class names; those still load when Composer's vendor tree
	 * is present (e.g. local dev / CI), so getEngine() alone is not enough. The resolved
	 * main engine class must live under Google\Site_Kit_Dependencies.
	 */
	public function test_phpseclib_biginteger_engine_can_be_resolved() {
		$previous = $this->force_get_property( BigInteger::class, 'mainEngine' );
		$this->force_set_property( BigInteger::class, 'mainEngine', null );

		try {
			BigInteger::getEngine();
			$main_engine_class = $this->force_get_property( BigInteger::class, 'mainEngine' );
		} finally {
			$this->force_set_property( BigInteger::class, 'mainEngine', $previous );
		}

		$this->assertStringStartsWith(
			'\\Google\\Site_Kit_Dependencies\\phpseclib3\\',
			$main_engine_class,
			'BigInteger must use scoped engine classes; unprefixed phpseclib3\\ indicates broken scoper patching (masked when vendor/ also defines those classes).'
		);
	}
}
