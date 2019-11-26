<?php
/**
 * TransientsTestTrait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

trait TransientsTestTrait {

	protected function get_transient_keys() {
		return array(
			'googlesitekit_sc_data_1234567890',
			'googlesitekit_verification_meta_tags',
		);
	}

	protected function init_transient_values( $is_network_mode ) {
		foreach ( $this->get_transient_keys() as $transient_key ) {
			if ( $is_network_mode ) {
				set_site_transient( $transient_key, "test-{$transient_key}-value" );
			} else {
				set_transient( $transient_key, "test-{$transient_key}-value" );
			}
		}
	}

	protected function assertTransientsDeleted( $is_network_mode ) {
		foreach ( $this->get_transient_keys() as $transient_key ) {
			if ( $is_network_mode ) {
				$this->assertFalse( get_site_transient( $transient_key ) );
			} else {
				$this->assertFalse( get_transient( $transient_key ) );
			}
		}
	}
}
