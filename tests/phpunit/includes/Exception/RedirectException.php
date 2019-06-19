<?php
/**
 * RedirectException
 *
 * @package   Google
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Exception;

class RedirectException extends \Exception {
	/**
	 * Redirection location.
	 *
	 * @var string
	 */
	protected $location;

	/**
	 * Redirection HTTP status code.
	 *
	 * @var int
	 */
	protected $status;

	/**
	 * Set the target location URL.
	 *
	 * @param string $location
	 */
	public function set_location( $location ) {
		$this->location = $location;
	}

	/**
	 * Get the target location URL.
	 *
	 * @return string
	 */
	public function get_location() {
		return $this->location;
	}

	/**
	 * Set the HTTP status code.
	 *
	 * @param int $status
	 */
	public function set_status( $status ) {
		$this->status = (int) $status;
	}

	/**
	 * Get the HTTP status code.
	 *
	 * @return int
	 */
	public function get_status() {
		return $this->status;
	}
}
