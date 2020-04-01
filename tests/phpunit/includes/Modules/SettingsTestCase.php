<?php
/**
 * Class Google\Site_Kit\Tests\Modules\SettingsTestCase
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2019 Google LLC
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

	public function setUp() {
		global $new_whitelist_options;
		parent::setUp();

		$option_name = $this->get_option_name();

		// Unregister setup that occurred during bootstrap.
		if ( array_key_exists( $option_name, $new_whitelist_options ) ) {
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
