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

use Google\Site_Kit\Core\Storage\Has_Connected_Admins;

class FakeHas_Connected_Admins extends Has_Connected_Admins {

	private $has_connected_admins = null;

	/**
	 * @inheritDoc
	 */
	public function get_type() { // phpcs:ignore Generic.CodeAnalysis.UselessOverridingMethod.Found
		return parent::get_type();
	}

	/**
	 * Sets the mock return value for "query_connected_admins" function.
	 *
	 * @param mixed $has_connected_admins Mock value to use.
	 */
	public function set_query_connected_admins_return_value( $has_connected_admins ) {
		$this->has_connected_admins = $has_connected_admins;
	}

	/**
	 * @inheritDoc
	 */
	protected function query_connected_admins() {
		if ( ! is_null( $this->has_connected_admins ) ) {
			return $this->has_connected_admins;
		}
	}

}
