<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Reporting_Data_Requests
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Search_Console;
use Google\Site_Kit\Modules\AdSense\Email_Reporting\Report_Options as AdSense_Report_Options;
use Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Options as Analytics_4_Report_Options;
use Google\Site_Kit\Modules\Analytics_4\Email_Reporting\Report_Request_Assembler as Analytics_4_Report_Request_Assembler;
use Google\Site_Kit\Modules\Search_Console\Email_Reporting\Report_Options as Search_Console_Report_Options;
use Google\Site_Kit\Modules\Search_Console\Email_Reporting\Report_Request_Assembler as Search_Console_Report_Request_Assembler;
use Google\Site_Kit\Modules\Analytics_4\Audience_Settings as Module_Audience_Settings;
use Google\Site_Kit\Modules\Analytics_4\Custom_Dimensions_Data_Available;
use WP_Error;
use WP_User;

/**
 * Handles per-user email reporting data requests.
 *
 * @since 1.168.0
 * @access private
 * @ignore
 */
class Email_Reporting_Data_Requests {

	/**
	 * Modules instance.
	 *
	 * @since 1.168.0
	 * @var Modules
	 */
	private $modules;

	/**
	 * User options instance.
	 *
	 * @since 1.168.0
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Plugin context instance.
	 *
	 * @since 1.168.0
	 * @var Context
	 */
	private $context;

	/**
	 * Conversion tracking instance.
	 *
	 * @since 1.168.0
	 * @var Conversion_Tracking
	 */
	private $conversion_tracking;

	/**
	 * Module audience settings instance.
	 *
	 * @since 1.168.0
	 * @var Module_Audience_Settings
	 */
	private $audience_settings;

	/**
	 * Custom dimensions availability helper.
	 *
	 * @since 1.168.0
	 * @var Custom_Dimensions_Data_Available
	 */
	private $custom_dimensions_data_available;

	/**
	 * Constructor.
	 *
	 * @since 1.168.0
	 *
	 * @param Context             $context             Plugin context.
	 * @param Modules             $modules             Modules instance.
	 * @param Conversion_Tracking $conversion_tracking Conversion tracking instance.
	 * @param Transients          $transients          Transients instance.
	 * @param User_Options|null   $user_options        Optional. User options instance. Default new instance.
	 */
	public function __construct(
		Context $context,
		Modules $modules,
		Conversion_Tracking $conversion_tracking,
		Transients $transients,
		?User_Options $user_options = null
	) {
		$this->context      = $context;
		$this->modules      = $modules;
		$this->user_options = $user_options ?: new User_Options( $this->context );

		$this->conversion_tracking              = $conversion_tracking;
		$this->audience_settings                = new Module_Audience_Settings( new Options( $this->context ) );
		$this->custom_dimensions_data_available = new Custom_Dimensions_Data_Available( $transients );
	}

	/**
	 * Gets the raw payload for a specific user.
	 *
	 * @since 1.168.0
	 *
	 * @param int   $user_id    User ID.
	 * @param array $date_range Date range array.
	 * @return array|WP_Error Array of payloads keyed by section part identifiers or WP_Error.
	 */
	public function get_user_payload( $user_id, $date_range ) {
		$user_id = (int) $user_id;
		$user    = get_user_by( 'id', $user_id );

		if ( ! $user instanceof WP_User ) {
			return new WP_Error(
				'invalid_email_reporting_user',
				__( 'Invalid user for email reporting data.', 'google-site-kit' )
			);
		}

		if ( empty( $date_range['startDate'] ) || empty( $date_range['endDate'] ) ) {
			return new WP_Error(
				'invalid_email_reporting_date_range',
				__( 'Email reporting date range must include start and end dates.', 'google-site-kit' )
			);
		}

		$active_modules    = $this->modules->get_active_modules();
		$available_modules = $this->filter_modules_for_user( $active_modules, $user );

		if ( empty( $available_modules ) ) {
			return array();
		}

		$previous_user_id     = get_current_user_id();
		$restore_user_options = $this->user_options->switch_user( $user_id );

		wp_set_current_user( $user_id );

		// Collect payloads while impersonating the target user. Finally executes even
		// when returning, so we restore user context on both success and unexpected throws.
		try {
			return $this->collect_payloads( $available_modules, $date_range );
		} finally {
			if ( is_callable( $restore_user_options ) ) {
				$restore_user_options();
			}

			wp_set_current_user( $previous_user_id );
		}
	}

	/**
	 * Collects payloads for the allowed modules.
	 *
	 * @since 1.168.0
	 *
	 * @param array $modules    Allowed modules.
	 * @param array $date_range Date range payload.
	 * @return array|WP_Error Flat section payload map or WP_Error from a failing module.
	 */
	private function collect_payloads( array $modules, array $date_range ) {
		$payload = array();

		foreach ( $modules as $slug => $module ) {
			if ( Analytics_4::MODULE_SLUG === $slug ) {
				$result = $this->collect_analytics_payloads( $module, $date_range );
			} elseif ( Search_Console::MODULE_SLUG === $slug ) {
				$result = $this->collect_search_console_payloads( $module, $date_range );
			} elseif ( AdSense::MODULE_SLUG === $slug ) {
				$result = $this->collect_adsense_payloads( $module, $date_range );
			} else {
				continue;
			}

			if ( is_wp_error( $result ) ) {
				return $result;
			}

			if ( empty( $result ) ) {
				continue;
			}

			$payload[ $slug ] = $result;
		}

		return $payload;
	}

	/**
	 * Collects Analytics 4 payloads keyed by section-part identifiers.
	 *
	 * @since 1.168.0
	 *
	 * @param object $module     Module instance.
	 * @param array  $date_range Date range payload.
	 * @return array|WP_Error Analytics payloads or WP_Error from module call.
	 */
	private function collect_analytics_payloads( $module, $date_range ) {
		$report_options = new Analytics_4_Report_Options( $date_range, array(), $this->context );
		$settings       = $module->get_settings()->get();

		$report_options->set_conversion_events( $settings['detectedEvents'] ?? array() );
		$report_options->set_audience_segmentation_enabled( $this->is_audience_segmentation_enabled() );
		$report_options->set_custom_dimension_availability(
			array(
				Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR => $this->has_custom_dimension_data( Analytics_4::CUSTOM_DIMENSION_POST_AUTHOR ),
				Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES => $this->has_custom_dimension_data( Analytics_4::CUSTOM_DIMENSION_POST_CATEGORIES ),
			)
		);

		$request_assembler                = new Analytics_4_Report_Request_Assembler( $report_options );
		list( $requests, $custom_titles ) = $request_assembler->build_requests();

		$payload = $this->collect_batch_reports( $module, $requests );

		if ( isset( $custom_titles ) && is_array( $payload ) ) {
			foreach ( $custom_titles as $request_key => $display_name ) {
				if ( isset( $payload[ $request_key ] ) && is_array( $payload[ $request_key ] ) ) {
					$payload[ $request_key ]['title'] = $display_name;
				}
			}
		}

		return $payload;
	}

	/**
	 * Collects Search Console payloads keyed by section-part identifiers.
	 *
	 * @since 1.168.0
	 *
	 * @param object $module     Module instance.
	 * @param array  $date_range Date range payload.
	 * @return array|WP_Error Search Console payloads or WP_Error from module call.
	 */
	private function collect_search_console_payloads( $module, $date_range ) {
		$report_options    = new Search_Console_Report_Options( $date_range );
		$request_assembler = new Search_Console_Report_Request_Assembler( $report_options );

		list( $requests, $request_map ) = $request_assembler->build_requests();

		$response = $module->set_data(
			'searchanalytics-batch',
			array(
				'requests' => $requests,
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $request_assembler->map_responses( $response, $request_map );
	}

	/**
	 * Collects AdSense payloads keyed by section-part identifiers.
	 *
	 * @since 1.168.0
	 *
	 * @param object $module     Module instance.
	 * @param array  $date_range Date range payload.
	 * @return array|WP_Error AdSense payload or WP_Error from module call.
	 */
	private function collect_adsense_payloads( $module, array $date_range ) {
		$account_id     = $this->get_adsense_account_id( $module );
		$report_options = new AdSense_Report_Options( $date_range, array(), $account_id );

		$response = $module->get_data( 'report', $report_options->get_total_earnings_options() );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return array(
			'total_earnings' => $response,
		);
	}

	/**
	 * Filters modules to those accessible to the provided user.
	 *
	 * @since 1.168.0
	 *
	 * @param array   $modules Active modules.
	 * @param WP_User $user    Target user.
	 * @return array Filtered modules.
	 */
	private function filter_modules_for_user( array $modules, WP_User $user ) {
		$allowed          = array();
		$user_roles       = (array) $user->roles;
		$sharing_settings = $this->modules->get_module_sharing_settings();

		foreach ( $modules as $slug => $module ) {
			if ( ! $module->is_connected() || $module->is_recoverable() ) {
				continue;
			}

			if ( user_can( $user, Permissions::MANAGE_OPTIONS ) ) {
				$allowed[ $slug ] = $module;
				continue;
			}

			$shared_roles = $sharing_settings->get_shared_roles( $slug );
			if ( empty( $shared_roles ) ) {
				continue;
			}

			if ( empty( array_intersect( $user_roles, $shared_roles ) ) ) {
				continue;
			}

			$allowed[ $slug ] = $module;
		}

		return $allowed;
	}

	/**
	 * Gets the connected AdSense account ID if available.
	 *
	 * @since 1.168.0
	 *
	 * @param object $module Module instance.
	 * @return string Account ID or empty string if unavailable.
	 */
	private function get_adsense_account_id( $module ) {
		if ( ! method_exists( $module, 'get_settings' ) ) {
			return '';
		}

		$settings = $module->get_settings();
		if ( ! is_object( $settings ) || ! method_exists( $settings, 'get' ) ) {
			return '';
		}

		$values = $settings->get();

		return isset( $values['accountID'] ) ? (string) $values['accountID'] : '';
	}

	/**
	 * Determines whether audience segmentation is enabled.
	 *
	 * @since 1.168.0
	 *
	 * @return bool True if enabled, false otherwise.
	 */
	private function is_audience_segmentation_enabled() {
		$settings = $this->audience_settings->get();
		return ! empty( $settings['audienceSegmentationSetupCompletedBy'] );
	}

	/**
	 * Determines whether data is available for a custom dimension.
	 *
	 * @since 1.168.0
	 *
	 * @param string $custom_dimension Custom dimension slug.
	 * @return bool True if data is available, false otherwise.
	 */
	private function has_custom_dimension_data( $custom_dimension ) {
		$availability = $this->custom_dimensions_data_available->get_data_availability();
		return ! empty( $availability[ $custom_dimension ] );
	}

	/**
	 * Collects Analytics reports in batches of up to five requests.
	 *
	 * @since 1.170.0
	 *
	 * @param object $module   Analytics module instance.
	 * @param array  $requests Report request options keyed by payload key.
	 * @return array|WP_Error  Payload keyed by request key or WP_Error on failure.
	 */
	private function collect_batch_reports( $module, array $requests ) {
		$payload = array();

		$chunks = array_chunk( $requests, 5, true );

		foreach ( $chunks as $chunk ) {
			$request_keys      = array_keys( $chunk );
			$chunk_request_set = array_values( $chunk );

			$response = $module->get_data(
				'batch-report',
				array(
					'requests' => $chunk_request_set,
				)
			);

			if ( is_wp_error( $response ) ) {
				return $response;
			}

			$reports = $this->normalize_batch_reports( $response );

			foreach ( $request_keys as $index => $key ) {
				if ( isset( $reports[ $index ] ) ) {
					$payload[ $key ] = $reports[ $index ];
					continue;
				}

				if ( isset( $reports[ $key ] ) ) {
					$payload[ $key ] = $reports[ $key ];
					continue;
				}

				return new WP_Error(
					'email_report_batch_incomplete',
					sprintf(
						/* translators: %s: Requested report key. */
						__( 'Failed to fetch required report: %s.', 'google-site-kit' ),
						$key
					)
				);
			}
		}

		return $payload;
	}

	/**
	 * Normalizes batch report responses to a numeric-indexed array.
	 *
	 * @since 1.170.0
	 *
	 * @param mixed $batch_response Batch response from the module.
	 * @return array Normalized reports array.
	 */
	private function normalize_batch_reports( $batch_response ) {
		if ( is_object( $batch_response ) ) {
			$decoded = json_decode( wp_json_encode( $batch_response ), true );
			if ( is_array( $decoded ) ) {
				$batch_response = $decoded;
			}
		}

		if ( isset( $batch_response['reports'] ) && is_array( $batch_response['reports'] ) ) {
			return $batch_response['reports'];
		}

		if ( is_array( $batch_response ) && ( isset( $batch_response['dimensionHeaders'] ) || isset( $batch_response['metricHeaders'] ) || isset( $batch_response['rows'] ) ) ) {
			return array( $batch_response );
		}

		if ( wp_is_numeric_array( $batch_response ) ) {
			return $batch_response;
		}

		$reports = array();

		if ( is_array( $batch_response ) ) {
			foreach ( $batch_response as $value ) {
				if ( is_array( $value ) ) {
					$reports[] = $value;
				}
			}
		}

		return $reports;
	}
}
