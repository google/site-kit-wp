<?php
/**
 * Class Google\Site_Kit\Tests\Polyfill\WP_UnitTestCase_Polyfill.
 *
 * @package   Google\Site_Kit\Tests\Polyfill
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Polyfill;

use WP_UnitTestCase;

/**
 * Passthrough implementation for WP >= 5.2
 */
class WP_UnitTestCase_Polyfill extends WP_UnitTestCase {} // phpcs:ignore Generic.Classes.DuplicateClassName.Found
