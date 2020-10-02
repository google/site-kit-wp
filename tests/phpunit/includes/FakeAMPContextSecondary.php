<?php
/**
 * Class Google\Site_Kit\Tests\FakeAMPContextSecondary
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit\Context;

/**
 * Class for faking a secondary AMP context.
 */
class FakeAMPContextSecondary extends Context {
	/**
	 * @inheritDoc
	 */
	public function is_amp() {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function get_amp_mode() {
		return static::AMP_MODE_SECONDARY;
	}
}
