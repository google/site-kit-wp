<?php
/**
 * Class Google\Site_Kit\Core\Util\Debug_Data
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Util\Feature_Flags;

/**
 * Class for integrating debug information with Site Health.
 *
 * @since 1.5.0
 * @access private
 * @ignore
 */
class Debug_Data {
	/**
	 * Context instance.
	 *
	 * @since 1.5.0
	 * @var Context
	 */
	private $context;

	/**
	 * Options instance.
	 *
	 * @since 1.5.0
	 * @var Options
	 */
	private $options;

	/**
	 * User_Options instance.
	 *
	 * @since 1.5.0
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Authentication instance.
	 *
	 * @since 1.5.0
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Modules instance.
	 *
	 * @since 1.5.0
	 * @var Modules
	 */
	private $modules;

	/**
	 * Permissions instance.
	 *
	 * @since 1.69.0
	 * @var Permissions
	 */
	private $permissions;

	/**
	 * Constructor.
	 *
	 * @since 1.5.0
	 *
	 * @param Context        $context        Context instance.
	 * @param Options        $options        Options instance.
	 * @param User_Options   $user_options   User_Options instance.
	 * @param Authentication $authentication Authentication instance.
	 * @param Modules        $modules        Modules instance.
	 * @param Permissions    $permissions    Permissions instance.
	 */
	public function __construct(
		Context $context,
		Options $options,
		User_Options $user_options,
		Authentication $authentication,
		Modules $modules,
		Permissions $permissions
	) {
		$this->context        = $context;
		$this->options        = $options;
		$this->user_options   = $user_options;
		$this->authentication = $authentication;
		$this->modules        = $modules;
		$this->permissions    = $permissions;
	}

	/**
	 * Registers debug information with Site Health.
	 *
	 * @since 1.5.0
	 */
	public function register() {
		add_filter(
			'debug_information',
			function ( $info ) {
				$info['google-site-kit'] = array(
					'label'  => __( 'Site Kit by Google', 'google-site-kit' ),
					'fields' => $this->get_fields(),
				);

				return $info;
			}
		);
	}

	/**
	 * Redacts the given string by overwriting a portion with a mask character.
	 *
	 * @since 1.5.0
	 *
	 * @param string $string     Input string to redact.
	 * @param int    $mask_start Starting position of redaction and length of preserved characters.
	 *                             If positive, characters are redacted from the end, preserving the first X characters.
	 *                             If negative, characters are redacted from the beginning preserving the last X characters.
	 * @return string
	 */
	public static function redact_debug_value( $string, $mask_start = 4 ) {
		if ( ! is_scalar( $string ) ) {
			return '';
		}

		$string = (string) $string;
		if ( $mask_start < 0 ) {
			$redacted = substr( $string, 0, $mask_start );
			$unmasked = substr( $string, $mask_start );
			return str_repeat( '•', strlen( $redacted ) ) . $unmasked;
		} else {
			$redacted = substr( $string, $mask_start );
			$unmasked = substr( $string, 0, $mask_start );
			return $unmasked . str_repeat( '•', strlen( $redacted ) );
		}
	}

	/**
	 * Gets all fields.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	protected function get_fields() {
		$fields = array(
			'version'              => array(
				'label' => __( 'Version', 'google-site-kit' ),
				'value' => GOOGLESITEKIT_VERSION,
			),
			'php_version'          => array(
				'label' => __( 'PHP Version', 'google-site-kit' ),
				'value' => PHP_VERSION,
			),
			'wp_version'           => array(
				'label' => __( 'WordPress Version', 'google-site-kit' ),
				'value' => get_bloginfo( 'version' ),
			),
			'reference_url'        => array(
				'label' => __( 'Reference Site URL', 'google-site-kit' ),
				'value' => $this->context->get_reference_site_url(),
			),
			'amp_mode'             => $this->get_amp_mode_field(),
			'site_status'          => $this->get_site_status_field(),
			'user_status'          => $this->get_user_status_field(),
			'verification_status'  => $this->get_verification_status_field(),
			'connected_user_count' => $this->get_connected_user_count_field(),
			'active_modules'       => $this->get_active_modules_field(),
			'recoverable_modules'  => $this->get_recoverable_modules_field(),
			'required_scopes'      => $this->get_required_scopes_field(),
			'capabilities'         => $this->get_capabilities_field(),
			'enabled_features'     => $this->get_feature_fields(),
		);
		$none   = __( 'None', 'google-site-kit' );

		return array_map(
			function ( $field ) use ( $none ) {
				if ( empty( $field['value'] ) ) {
					$field['value'] = $none;
					$field['debug'] = 'none';
				}

				return $field;
			},
			array_merge( $fields, $this->get_module_sharing_settings_fields(), $this->get_module_fields() )
		);
	}

	/**
	 * Gets the field definition for the amp_mode field.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	private function get_amp_mode_field() {
		$mode     = $this->context->get_amp_mode();
		$mode_map = array(
			'primary'   => __( 'Primary', 'google-site-kit' ),
			'secondary' => __( 'Secondary', 'google-site-kit' ),
		);

		return array(
			'label' => __( 'AMP Mode', 'google-site-kit' ),
			'value' => isset( $mode_map[ $mode ] ) ? $mode_map[ $mode ] : __( 'No', 'google-site-kit' ),
			'debug' => isset( $mode_map[ $mode ] ) ? $mode : 'no',
		);
	}

	/**
	 * Gets the field definition for the site_status field.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	private function get_site_status_field() {
		$is_connected = $this->authentication->credentials()->has();
		$using_proxy  = $this->authentication->credentials()->using_proxy();
		$status_map   = array(
			'connected-site'  => __( 'Connected through site credentials', 'google-site-kit' ),
			'connected-oauth' => __( 'Connected through OAuth client credentials', 'google-site-kit' ),
			'not-connected'   => __( 'Not connected', 'google-site-kit' ),
		);

		if ( $is_connected && $using_proxy ) {
			$status = 'connected-site';
		} elseif ( $is_connected && ! $using_proxy ) {
			$status = 'connected-oauth';
		} else {
			$status = 'not-connected';
		}

		return array(
			'label' => __( 'Site Status', 'google-site-kit' ),
			'value' => $status_map[ $status ],
			'debug' => $status,
		);
	}

	/**
	 * Gets the field definition for the user_status field.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	private function get_user_status_field() {
		$is_connected = $this->authentication->is_authenticated();

		return array(
			'label' => __( 'User Status', 'google-site-kit' ),
			'value' => $is_connected
				? __( 'Authenticated', 'google-site-kit' )
				: __( 'Not authenticated', 'google-site-kit' ),
			'debug' => $is_connected ? 'authenticated' : 'not authenticated',
		);
	}

	/**
	 * Gets the field definition for the verification_status field.
	 *
	 * @since 1.37.0
	 *
	 * @return array
	 */
	private function get_verification_status_field() {
		$label = __( 'Verification Status', 'google-site-kit' );

		$is_verified               = $this->authentication->verification()->get();
		$is_verified_by_file_token = $this->authentication->verification_file()->get();
		$is_verified_by_meta_tag   = $this->authentication->verification_meta()->get();

		if ( ! $is_verified ) {
			return array(
				'label' => $label,
				'value' => __( 'Not verified', 'google-site-kit' ),
				'debug' => 'not-verified',
			);
		}

		if ( $is_verified_by_file_token ) {
			return array(
				'label' => $label,
				'value' => __( 'Verified through file', 'google-site-kit' ),
				'debug' => 'verified-file',
			);
		}

		if ( $is_verified_by_meta_tag ) {
			return array(
				'label' => $label,
				'value' => __( 'Verified through meta tag', 'google-site-kit' ),
				'debug' => 'verified-meta',
			);
		}

		return array(
			'label' => $label,
			'value' => __( 'Verified outside of Site Kit', 'google-site-kit' ),
			'debug' => 'verified-non-site-kit',
		);

	}


	/**
	 * Gets the number of users with a Site Kit token.
	 *
	 * @since 1.16.0
	 *
	 * @return array
	 */
	private function get_connected_user_count_field() {
		$users = new \WP_User_Query(
			array(
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_key' => $this->user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN ),
				'fields'   => 'ID',
				'compare'  => 'EXISTS',
			)
		);
		return array(
			'label' => __( 'Connected user count', 'google-site-kit' ),
			'value' => $users->get_total(),
		);
	}

	/**
	 * Gets the field definition for the active_modules field.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	private function get_active_modules_field() {
		$active_modules = $this->modules->get_active_modules();

		return array(
			'label' => __( 'Active Modules', 'google-site-kit' ),
			'value' => join(
				/* translators: used between list items, there is a space after the comma. */
				__( ', ', 'google-site-kit' ),
				wp_list_pluck( $active_modules, 'name' )
			),
			'debug' => join( ', ', wp_list_pluck( $active_modules, 'slug' ) ),
		);
	}

	/**
	 * Gets the field definition for the recoverable_modules field.
	 *
	 * @since 1.78.0
	 *
	 * @return array
	 */
	private function get_recoverable_modules_field() {
		$recoverable_modules = $this->modules->get_recoverable_modules();

		return array(
			'label' => __( 'Recoverable Modules', 'google-site-kit' ),
			'value' => join(
				/* translators: used between list items, there is a space after the comma. */
				__( ', ', 'google-site-kit' ),
				wp_list_pluck( $recoverable_modules, 'name' )
			),
			'debug' => join( ', ', wp_list_pluck( $recoverable_modules, 'slug' ) ),
		);
	}

	/**
	 * Gets the field definition for the module_sharing_settings field.
	 *
	 * @since 1.78.0
	 *
	 * @return array
	 */
	private function get_module_sharing_settings_fields() {
		$sharing_settings  = $this->modules->get_module_sharing_settings()->get();
		$shareable_modules = $this->modules->get_shareable_modules();
		$fields            = array();

		foreach ( $shareable_modules as $module_slug => $module_details ) {
			$fields[] = array_merge(
				array(
					/* translators: %s: module name */
					'label' => sprintf( __( '%s Shared Roles', 'google-site-kit' ), $module_details->name ),
				),
				$this->get_module_shared_role_names( $sharing_settings[ $module_slug ]['sharedRoles'] )
			);

			$fields[] = array_merge(
				array(
					/* translators: %s: module name */
					'label' => sprintf( __( '%s Management', 'google-site-kit' ), $module_details->name ),
				),
				$this->get_module_management( $sharing_settings[ $module_slug ]['management'] )
			);
		}

		return $fields;
	}

	/**
	 * Gets the comma separated list of shared role names for module_sharing_settings.
	 *
	 * @since 1.78.0
	 *
	 * @param array $role_slugs List of role slugs.
	 *
	 * @return array $role_names Comma separated list of role names for module_sharing_settings within value and debug keys.
	 */
	private function get_module_shared_role_names( $role_slugs ) {
		if ( ! $role_slugs ) {
			return array(
				'value' => __( 'None', 'google-site-kit' ),
				'debug' => 'none',
			);
		}

		$wp_role_names     = wp_roles()->get_names();
		$shared_role_names = array_filter(
			$wp_role_names,
			function( $key ) use ( $role_slugs ) {
				return in_array( $key, $role_slugs, true );
			},
			ARRAY_FILTER_USE_KEY
		);

		return array(
			'value' => join(
				/* translators: used between list items, there is a space after the comma. */
				__( ', ', 'google-site-kit' ),
				$shared_role_names
			),
			'debug' => join( ', ', $role_slugs ),
		);
	}

	/**
	 * Gets the user friendly and debug values for module management used in module_sharing_settings.
	 *
	 * @since 1.78.0
	 *
	 * @param string $management The module sharing settings management value. Can be either `owner` or `all_admins`.
	 *
	 * @return array User friendly and debug values for module management used in module_sharing_settings within value and debug keys.
	 */
	private function get_module_management( $management ) {
		switch ( $management ) {
			case 'all_admins':
				return array(
					'value' => __( 'Any admin signed in with Google', 'google-site-kit' ),
					'debug' => 'all_admins',
				);
			default:
				return array(
					'value' => __( 'Owner', 'google-site-kit' ),
					'debug' => 'owner',
				);
		}
	}

	/**
	 * Gets the field definition for the required_scopes field.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	private function get_required_scopes_field() {
		$required_scopes = $this->authentication->get_oauth_client()->get_required_scopes();
		$granted_scopes  = $this->authentication->get_oauth_client()->get_granted_scopes();
		$value           = array();

		foreach ( $required_scopes as $scope ) {
			$satisfied       = Scopes::is_satisfied_by( $scope, $granted_scopes );
			$value[ $scope ] = $satisfied ? '✅' : '⭕';
		}

		return array(
			'label' => __( 'Required scopes', 'google-site-kit' ),
			'value' => $value,
		);
	}

	/**
	 * Gets capabilities for the current user.
	 *
	 * @since 1.21.0
	 *
	 * @return array
	 */
	private function get_capabilities_field() {
		$value = array();
		foreach ( $this->permissions->check_all_for_current_user() as $permission => $granted ) {
			$value[ $permission ] = $granted ? '✅' : '⭕';
		}

		return array(
			'label' => __( 'User Capabilities', 'google-site-kit' ),
			'value' => $value,
		);
	}

	/**
	 * Gets field definitions for each active module that supports debug fields.
	 *
	 * @since 1.5.0
	 *
	 * @return array A flat array of all module debug fields.
	 */
	private function get_module_fields() {
		$modules_with_debug_fields = array_filter(
			$this->modules->get_active_modules(),
			function ( Module $module ) {
				return $module instanceof Module_With_Debug_Fields;
			}
		);

		$fields_by_module = array_map(
			function ( Module_With_Debug_Fields $module ) {
				return $module->get_debug_fields();
			},
			array_values( $modules_with_debug_fields )
		);

		return array_merge( array(), ...$fields_by_module );
	}

	/**
	 * Gets the available features.
	 *
	 * @since 1.26.0
	 *
	 * @return array
	 */
	private function get_feature_fields() {
		$value              = array();
		$available_features = Feature_Flags::get_available_features();

		foreach ( $available_features as $available_feature ) {
			$enabled_feature             = Feature_Flags::enabled( $available_feature );
			$value[ $available_feature ] = $enabled_feature ? '✅' : '⭕';
		}

		return array(
			'label' => __( 'Features', 'google-site-kit' ),
			'value' => $value,
		);
	}
}
