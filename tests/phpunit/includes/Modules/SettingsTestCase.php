<?php
/**
 * Class Google\Site_Kit\Tests\Modules\SettingsTestCase
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Tests\TestCase;

abstract class SettingsTestCase extends TestCase {

	/**
	 * @return string
	 */
	abstract protected function get_option_name();

	protected function get_option() {
		return get_option( $this->get_option_name() );
	}

	protected function update_option( $value ) {
		return update_option( $this->get_option_name(), $value );
	}

	public function set_up() {
		parent::set_up();

		$option_name = $this->get_option_name();

		// Unregister setup that occurred during bootstrap.
		$registered_settings = get_registered_settings();
		if ( isset( $registered_settings[ $option_name ] ) ) {
			unregister_setting( $option_name, $option_name );
		}

		remove_all_filters( "option_$option_name" );
		remove_all_filters( "site_option_$option_name" );
		remove_all_filters( "default_option_$option_name" );
		remove_all_filters( "default_site_option_$option_name" );

		delete_option( $option_name );
		delete_site_option( $option_name );
	}
}
