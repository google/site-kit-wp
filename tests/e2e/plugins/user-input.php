<?php
/**
 * Plugin Name: E2E Tests User Input Settings API Mock
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for handling user input settings for Site Kit during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Google_Proxy;

register_activation_hook( __FILE__, 'e2e_user_input_settings_reset' );
register_deactivation_hook( __FILE__, 'e2e_user_input_settings_reset' );

add_filter( 'pre_http_request', 'e2e_user_input_settings_proxy_handler', 10, 3 );

function e2e_user_input_settings_reset() {
	delete_option( 'googlesitekit_temp_userinput_sitewide' );
	delete_option( 'googlesitekit_temp_userinput_' . get_current_user_id() );
}

function e2e_user_input_settings_proxy_handler( $pre, $args, $url ) {
	$google_proxy            = new Google_Proxy( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	$user_input_settings_url = $google_proxy->url( Google_Proxy::USER_INPUT_SETTINGS_URI );
	if ( $url !== $user_input_settings_url ) {
		return $pre;
	}

	$user_id  = get_current_user_id();
	$defaults = array(
		'role'          => array(
			'values'     => array(),
			'scope'      => 'user',
			'answeredBy' => 0,
		),
		'postFrequency' => array(
			'values'     => array(),
			'scope'      => 'user',
			'answeredBy' => 0,
		),
		'goals'         => array(
			'values'     => array(),
			'scope'      => 'site',
			'answeredBy' => 0,
		),
		'helpNeeded'    => array(
			'values'     => array(),
			'scope'      => 'site',
			'answeredBy' => 0,
		),
		'searchTerms'   => array(
			'values'     => array(),
			'scope'      => 'site',
			'answeredBy' => 0,
		),
	);

	if ( ! empty( $args['body'] ) ) {
		$body = json_decode( $args['body'], true );
		if ( ! empty( $body ) ) {
			$original_site_settings = get_option( 'googlesitekit_temp_userinput_sitewide', array() );
			$user_settings          = array();
			$site_settings          = array();

			foreach ( $defaults as $key => $values ) {
				if ( 'site' === $values['scope'] ) {
					$new_values = ! empty( $body[ $key ] ) && is_array( $body[ $key ] )
						? $body[ $key ]
						: array();

					$original_values = ! empty( $original_site_settings[ $key ]['values'] ) && is_array( $original_site_settings[ $key ]['values'] )
						? $original_site_settings[ $key ]['values']
						: array();

					$answered_by = ! empty( $original_site_settings[ $key ]['answeredBy'] )
						? $original_site_settings[ $key ]['answeredBy']
						: null;

					if ( count( $new_values ) !== count( $original_values ) ) {
						$answered_by = $user_id;
					} else {
						$intersection = array_intersect( $new_values, $original_values );
						if ( count( $intersection ) !== count( $new_values ) ) {
							$answered_by = $user_id;
						}
					}

					$site_settings[ $key ] = array(
						'values'     => $new_values,
						'scope'      => $values['scope'],
						'answeredBy' => $answered_by,
					);
				} else {
					$user_settings[ $key ] = array(
						'values'     => ! empty( $body[ $key ] ) ? $body[ $key ] : array(),
						'scope'      => $values['scope'],
						'answeredBy' => $user_id,
					);
				}
			}

			update_option( 'googlesitekit_temp_userinput_sitewide', $site_settings, 'no' );
			update_option( 'googlesitekit_temp_userinput_' . $user_id, $user_settings, 'no' );
		}
	}

	$user_input    = array();
	$user_settings = get_option( 'googlesitekit_temp_userinput_' . $user_id, array() );
	$site_settings = get_option( 'googlesitekit_temp_userinput_sitewide', array() );

	foreach ( $defaults as $key => $values ) {
		if ( isset( $user_settings[ $key ] ) ) {
			$user_input[ $key ] = $user_settings[ $key ];
		} elseif ( isset( $site_settings[ $key ] ) ) {
			$user_input[ $key ] = $site_settings[ $key ];
		} else {
			$user_input[ $key ] = $values;
		}
	}

	return array(
		'headers'  => array(),
		'body'     => wp_json_encode( $user_input ),
		'response' => array( 'code' => 200 ),
	);
}
