<?php
/**
 * Class Google\Site_Kit\Tests\Core\Storage\FakeSetting
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
	 * Callback to handle validation.
	 *
	 * @var callable
	 */
	protected $validate_callback;

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

	/**
	 * Sets the callback to invoke during `validate()`.
	 *
	 * @param callable $callback Callback to perform validation.
	 */
	public function set_validate_callback( callable $callback ) {
		$this->validate_callback = $callback;
	}

	/**
	 * Gets the callback for validating the setting's value.
	 *
	 * @since n.e.x.t
	 *
	 * @return callable|null
	 */
	protected function get_validate_callback() {
		return $this->validate_callback;
	}
}
