<?php
/**
 * FakeIntent
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Intents;

use Google\Site_Kit\Core\Intents\Intent;

class FakeIntent extends Intent {

	/**
	 * Intent ID.
	 *
	 * @var string
	 */
	protected $id;

	/**
	 * Whether or not the intent reports itself as available.
	 *
	 * @var bool
	 */
	protected $is_available;

	/**
	 * Constructor.
	 *
	 * @param string $id           Intent ID.
	 * @param bool   $is_available Optional. Whether or not the intent reports itself as available. Default true.
	 */
	public function __construct( $id, $is_available = true ) {
		$this->id           = $id;
		$this->is_available = $is_available;
	}

	/**
	 * @return string The ID given to the constructor.
	 */
	public function get_id() {
		return $this->id;
	}

	/**
	 * @return bool The availability given to the constructor.
	 */
	public function is_available() {
		return $this->is_available;
	}
}
