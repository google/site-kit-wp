<?php
/**
 * FakeModule_WithRateLimitOverrides
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

/**
 * A module whose API answers rate limits on its own terms, so the base class has to read
 * the constants off the module it is running as rather than off itself.
 */
class FakeModule_WithRateLimitOverrides extends FakeModule {

	const RATE_LIMIT_STATUS = 503;

	const RATE_LIMIT_REASONS = array( 'tooManyRequests' );

	const RATE_LIMIT_CACHE_TTL = 60;
}
