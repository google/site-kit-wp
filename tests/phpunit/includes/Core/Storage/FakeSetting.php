<?php
/**
 * Class Google\Site_Kit\Tests\Core\Storage${FILE_NAME}
 *
 * @package   Google\Site_Kit\Tests\Core\Storage
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Storage;

use Google\Site_Kit\Core\Storage\Setting;

class FakeSetting extends Setting {

	const OPTION = 'test_option';

	/**
	 * Callback to handle registration.
	 *
	 * @var callable
	 */
	protected $register_callback;

	/**
	 * @inheritDoc
	 */
	public function register() {
		if ( $this->register_callback ) {
			call_user_func( $this->register_callback );
		}
	}

	/**
	 * Sets the callback to invoke during `register()`.
	 *
	 * @param callable $callback Callback to perform registration.
	 */
	public function set_register_callback( callable $callback ) {
		$this->register_callback = $callback;
	}
}
