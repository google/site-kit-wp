<?php
/**
 * Class Google\Site_Kit\Core\User_Input\User_Input_Settings
 *
 * @package   Google\Site_Kit\Core\User_Input
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\User_Input;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\User_Input\User_Input_Site_Settings;
use Google\Site_Kit\Core\User_Input\User_Input_User_Settings;

/**
 * Class managing requests to user input settings endpoint.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class User_Input_Settings {

	/**
	 * User_Input_Site_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var User_Input_Site_Settings
	 */
	protected $user_input_site_settings;

	/**
	 * User_Input_User_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var User_Input_User_Settings
	 */
	protected $user_input_user_settings;

	/**
	 * User Input properties.
	 *
	 * @since n.e.x.t
	 * @var array|ArrayAccess
	 */
	private static $properties = array(
		'purpose'       => array(
			'scope' => 'site',
		),
		'postFrequency' => array(
			'scope' => 'user',
		),
		'goals'         => array(
			'scope' => 'user',
		),
	);

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$options      = new Options( $context );
		$user_options = new User_Options( $context );

		$this->user_input_site_settings = new User_Input_Site_Settings( $options );
		$this->user_input_user_settings = new User_Input_User_Settings( $user_options );
	}

	/**
	 * Registers functionality.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->user_input_site_settings->register();
		$this->user_input_user_settings->register();
	}

	/**
	 * Gets the set of user input properties.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The user input properties.
	 */
	public static function get_properties() {
		return static::$properties;
	}

	/**
	 * Gets user input settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return array|WP_Error User input settings.
	 */
	public function get_settings() {
		$data = array(
			'site' => $this->user_input_site_settings->get(),
			'user' => $this->user_input_user_settings->get(),
		);

		$properties = static::$properties;
		$settings   = array_merge( $data['site'], $data['user'] );

		// If there are no settings, return default empty values.
		if ( empty( $settings ) ) {
			array_walk(
				$properties,
				function ( &$property ) {
					$property['values'] = array();
				}
			);

			return $properties;
		}

		$user_id = get_current_user_id();

		foreach ( $settings as &$setting ) {
			if ( ! isset( $setting['answeredBy'] ) ) {
				continue;
			}

			$answered_by = intval( $setting['answeredBy'] );
			unset( $setting['answeredBy'] );

			if ( ! $answered_by || $answered_by === $user_id ) {
				continue;
			}

			$setting['author'] = array(
				'photo' => get_avatar_url( $answered_by ),
				'name'  => get_the_author_meta( 'user_email', $answered_by ),
			);
		}

		// If there are un-answered questions, return default empty values for them.
		foreach ( $properties as $property_key => $property_value ) {
			if ( ! isset( $settings[ $property_key ] ) ) {
				$settings[ $property_key ]           = $property_value;
				$settings[ $property_key ]['values'] = array();
			}
		}

		return $settings;
	}

	/**
	 * Determines whether the current user input settings have empty values or not.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $settings The settings to check.
	 * @return boolean|null TRUE if at least one of the settings has empty values, otherwise FALSE. If a request to the proxy server fails, it will return NULL.
	 */
	public function are_settings_empty( $settings = array() ) {
		if ( empty( $settings ) ) {
			$settings = $this->get_settings();

			if ( is_wp_error( $settings ) ) {
				return null;
			}
		}

		$empty_settings = array_filter(
			$settings,
			function( $setting ) {
				return empty( $setting['values'] );
			}
		);

		return 0 < count( $empty_settings );
	}

	/**
	 * Sets user input settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $settings User settings.
	 * @return array|WP_Error User input settings.
	 */
	public function set_settings( $settings ) {
		$properties    = static::$properties;
		$site_settings = array();
		$user_settings = array();

		foreach ( $settings as $setting_key => $answers ) {
			$setting_data           = array();
			$setting_data['values'] = $answers;
			$setting_data['scope']  = $properties[ $setting_key ]['scope'];

			if ( 'site' === $setting_data['scope'] ) {
				$setting_data['answeredBy']    = get_current_user_id();
				$site_settings[ $setting_key ] = $setting_data;
			} elseif ( 'user' === $setting_data['scope'] ) {
				$user_settings[ $setting_key ] = $setting_data;
			}
		}

		$this->user_input_site_settings->set( $site_settings );
		$this->user_input_user_settings->set( $user_settings );

		return $this->get_settings();
	}
}
