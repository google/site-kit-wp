<?php

namespace Google\Site_Kit\Core\Consent_Mode;

use Google\Site_Kit\Core\Storage\Setting;

class Consent_Mode_Settings extends Setting {

	const OPTION = 'googlesitekit_consent_mode';

	protected function get_type() {
		return 'object';
	}

	protected function get_default() {
		return array(
			'enabled' => false,
			'regions' => Regions::EEA,
		);
	}

	protected function get_sanitize_callback() {
		return function ( $value ) {
			$new_value = $this->get();

			if ( ! empty( $value['enabled'] ) ) {
				$new_value['enabled'] = true;
			}

			if ( ! empty( $value['regions'] ) && is_array( $value['regions'] ) ) {
				$regions = array_reduce(
					$value['regions'],
					static function ( $acc, $code ) {
						$code = strtoupper( $code );
						// Match ISO 3166-2 (`AB` or `CD-EF`)
						if ( ! preg_match( '#^[A-Z]{2}(-[A-Z]{2})?$#', $code, $matches ) ) {
							return $acc;
						}
						// Store as keys to remove dupes.
						$acc[ $code ] = true;
						return $acc;
					},
					array()
				);

				$new_value['regions'] = array_keys( $regions );
			}

			return $new_value;
		};
	}


}
