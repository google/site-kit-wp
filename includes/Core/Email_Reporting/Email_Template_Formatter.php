<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Template_Formatter
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\User\Email_Reporting_Settings;
use WP_Error;
use WP_Post;
use WP_User;

/**
 * Formats email report data for template rendering.
 *
 * @since 1.170.0
 * @access private
 * @ignore
 */
class Email_Template_Formatter {

	/**
	 * Plugin context instance.
	 *
	 * @since 1.170.0
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Email report section builder.
	 *
	 * @since 1.170.0
	 *
	 * @var Email_Report_Section_Builder
	 */
	private $section_builder;

	/**
	 * Constructor.
	 *
	 * @since 1.170.0
	 *
	 * @param Context                      $context         Plugin context.
	 * @param Email_Report_Section_Builder $section_builder Section builder instance.
	 */
	public function __construct( Context $context, Email_Report_Section_Builder $section_builder ) {
		$this->context         = $context;
		$this->section_builder = $section_builder;
	}

	/**
	 * Builds sections from raw payload grouped by module.
	 *
	 * @since 1.170.0
	 *
	 * @param array   $raw_payload Raw payload.
	 * @param WP_Post $email_log   Email log post.
	 * @param WP_User $user        User receiving the report.
	 * @return array|WP_Error Sections array or WP_Error.
	 */
	public function build_sections( $raw_payload, WP_Post $email_log, WP_User $user ) {
		$sections    = array();
		$user_locale = get_user_locale( $user );

		if ( ! is_array( $raw_payload ) ) {
			return $sections;
		}

		foreach ( $raw_payload as $module_slug => $module_payload ) {
			if ( is_object( $module_payload ) ) {
				$module_payload = (array) $module_payload;
			}

			try {
				$module_sections = $this->section_builder->build_sections(
					$module_slug,
					array( $module_payload ),
					$user_locale,
					$email_log
				);
			} catch ( \Throwable $exception ) {
				return new WP_Error( 'email_report_section_build_failed', $exception->getMessage() );
			}

			if ( is_wp_error( $module_sections ) ) {
				return $module_sections;
			}

			if ( ! empty( $module_sections ) ) {
				$sections = array_merge( $sections, $module_sections );
			}
		}

		return $sections;
	}

	/**
	 * Builds template payload for rendering.
	 *
	 * @since 1.170.0
	 *
	 * @param array  $sections   Sections.
	 * @param string $frequency  Frequency slug.
	 * @param array  $date_range Date range.
	 * @return array|WP_Error Template payload or WP_Error.
	 */
	public function build_template_payload( $sections, $frequency, $date_range ) {
		$sections_payload = $this->prepare_sections_payload( $sections, $date_range );

		if ( empty( $sections_payload ) ) {
			return new WP_Error(
				'email_report_no_data',
				__( 'No email report data available.', 'google-site-kit' )
			);
		}

		$sections_map = new Sections_Map( $this->context, $sections_payload );
		if ( empty( $sections_map->get_sections() ) ) {
			return new WP_Error(
				'email_report_no_data',
				__( 'No email report data available.', 'google-site-kit' )
			);
		}

		return array(
			'sections_payload' => $sections_payload,
			'template_data'    => $this->prepare_template_data( $frequency, $date_range ),
		);
	}

	/**
	 * Prepares section payload for the template renderer.
	 *
	 * @since 1.170.0
	 *
	 * @param array $sections   Section instances.
	 * @param array $date_range Date range used for the report.
	 * @return array Section payload for the template.
	 */
	private function prepare_sections_payload( $sections, $date_range ) {
		$payload        = array();
		$change_context = $this->get_change_context_label( $date_range );

		foreach ( $sections as $section ) {
			if ( ! $section instanceof Email_Report_Data_Section_Part ) {
				continue;
			}

			$values           = $section->get_values();
			$labels           = $section->get_labels();
			$trends           = $section->get_trends();
			$event_names      = $section->get_event_names();
			$dimensions       = $section->get_dimensions();
			$dimension_values = $section->get_dimension_values();
			$change           = isset( $trends[0] ) ? $this->parse_change_value( $trends[0] ) : null;
			$changes          = is_array( $trends ) ? array_map( array( $this, 'parse_change_value' ), $trends ) : array();

			$first_dimension_value = '';
			if ( isset( $dimension_values[0] ) ) {
				$first_dimension_value = is_array( $dimension_values[0] )
					? ( $dimension_values[0]['label'] ?? '' )
					: $dimension_values[0];
			}

			$section_key = $section->get_section_key();
			$label       = isset( $labels[0] ) ? $labels[0] : $section->get_title();
			$event_name  = isset( $event_names[0] ) ? $event_names[0] : '';

			$payload[ $section_key ] = array(
				'value'            => isset( $values[0] ) ? $values[0] : '',
				'values'           => $values,
				'label'            => $label,
				'event_name'       => $event_name,
				'dimension'        => isset( $dimensions[0] ) ? $dimensions[0] : '',
				'dimension_value'  => $first_dimension_value,
				'dimension_values' => $dimension_values ?? array(),
				'change'           => $change,
				'changes'          => $changes,
				'change_context'   => $change_context,
			);
		}

		return $payload;
	}

	/**
	 * Parses a change value into float.
	 *
	 * @since 1.170.0
	 *
	 * @param mixed $change Change value.
	 * @return float|null Parsed change.
	 */
	private function parse_change_value( $change ) {
		if ( null === $change || '' === $change ) {
			return null;
		}

		if ( is_string( $change ) ) {
			$change = str_replace( '%', '', $change );
		}

		if ( ! is_numeric( $change ) ) {
			return null;
		}

		return floatval( $change );
	}

	/**
	 * Builds a change context label based on the date range.
	 *
	 * @since 1.170.0
	 *
	 * @param array $date_range Date range.
	 * @return string Change context label.
	 */
	private function get_change_context_label( array $date_range ) {
		// Prefer the compare period length since the change badge references the previous window.
		if ( ! empty( $date_range['compareStartDate'] ) && ! empty( $date_range['compareEndDate'] ) ) {
			$days = $this->calculate_period_length_from_range(
				array(
					'startDate' => $date_range['compareStartDate'],
					'endDate'   => $date_range['compareEndDate'],
				)
			);
		} else {
			$days = $this->calculate_period_length_from_range( $date_range );
		}

		if ( null === $days || $days <= 0 ) {
			return __( 'Compared to previous period', 'google-site-kit' );
		}

		return sprintf(
			/* translators: %s: Number of days. */
			__( 'Compared to previous %s days', 'google-site-kit' ),
			number_format_i18n( $days )
		);
	}

	/**
	 * Calculates inclusive day length from a date range.
	 *
	 * @since 1.170.0
	 *
	 * @param array $date_range Date range with startDate/endDate.
	 * @return int|null Number of days or null on failure.
	 */
	private function calculate_period_length_from_range( $date_range ) {
		if ( empty( $date_range['startDate'] ) || empty( $date_range['endDate'] ) ) {
			return null;
		}

		try {
			$start = new \DateTime( $date_range['startDate'] );
			$end   = new \DateTime( $date_range['endDate'] );
		} catch ( \Exception $e ) {
			return null;
		}

		$diff = $start->diff( $end );
		if ( false === $diff ) {
			return null;
		}

		return $diff->days + 1;
	}

	/**
	 * Builds template data for simple email rendering.
	 *
	 * Simple emails share the same structure (subject, preheader, site, CTA, footer)
	 * but differ in their content. The $email_data array provides the variable content.
	 *
	 * @since 1.173.0
	 *
	 * @param string $subject   Email subject line.
	 * @param string $preheader Email preheader text.
	 * @param array  $email_data {
	 *     Additional email-specific data.
	 *
	 *     @type string $learn_more_url   URL for the learn more link.
	 *     @type string $cta_label        Label for the primary call-to-action button.
	 *     @type string $cta_url          URL for the primary call-to-action button.
	 *     @type string $footer_copy      Footer copy text.
	 *     @type array  $body_format_args Format arguments for plain text body (e.g., frequency, first_report_date).
	 *     @type array  $custom_data      Any additional custom data for the template.
	 * }
	 * @return array Template data for simple email.
	 */
	public function prepare_simple_email_data( $subject, $preheader, $email_data = array() ) {
		$site_domain = $this->get_site_domain();

		$data = array(
			'subject'                => $subject,
			'preheader'              => $preheader,
			'site'                   => array(
				'domain' => $site_domain,
				'url'    => $this->context->get_reference_site_url(),
			),
			'learn_more_url'         => $email_data['learn_more_url'] ?? '',
			'primary_call_to_action' => array(
				'label' => $email_data['cta_label'] ?? __( 'Get your report', 'google-site-kit' ),
				'url'   => $email_data['cta_url'] ?? admin_url( 'admin.php?page=googlesitekit-dashboard' ),
			),
			'footer'                 => array(
				'copy' => $email_data['footer_copy'] ?? '',
			),
		);

		return $data;
	}

	/**
	 * Builds template data for rendering.
	 *
	 * @since 1.170.0
	 *
	 * @param string $frequency  Frequency slug.
	 * @param array  $date_range Date range.
	 * @return array Template data.
	 */
	private function prepare_template_data( $frequency, $date_range ) {
		return array(
			'subject'                => $this->build_subject( $frequency ),
			'preheader'              => __( 'See the latest highlights from Site Kit.', 'google-site-kit' ),
			'site'                   => array(
				'domain' => $this->get_site_domain(),
				'url'    => $this->context->get_reference_site_url(),
			),
			'date_range'             => array(
				'label'   => $this->build_date_label( $date_range ),
				'context' => $this->get_change_context_label( $date_range ),
			),
			'primary_call_to_action' => array(
				'label' => __( 'View dashboard', 'google-site-kit' ),
				'url'   => admin_url( 'admin.php?page=googlesitekit-dashboard' ),
			),
			'footer'                 => array(
				'copy'            => __( 'You received this email because you signed up to receive email reports from Site Kit. If you do not want to receive these emails in the future you can unsubscribe', 'google-site-kit' ), // The space and unsubscribe link are handled in the template.
				'unsubscribe_url' => admin_url( 'admin.php?page=googlesitekit-settings#/admin-settings' ),
				'links'           => array(
					array(
						'label' => __( 'Manage subscription', 'google-site-kit' ),
						'url'   => admin_url( 'admin.php?page=googlesitekit-dashboard&email-reporting-panel=1' ),
					),
					array(
						'label' => __( 'Privacy Policy', 'google-site-kit' ),
						'url'   => 'https://policies.google.com/privacy',
					),
					array(
						'label' => __( 'Help center', 'google-site-kit' ),
						'url'   => 'https://sitekit.withgoogle.com/documentation/troubleshooting/site-kit-support/',
					),
				),
			),
		);
	}

	/**
	 * Builds a human readable date label.
	 *
	 * @since 1.170.0
	 *
	 * @param array $date_range Date range.
	 * @return string Date label.
	 */
	private function build_date_label( array $date_range ) {
		if ( empty( $date_range['startDate'] ) || empty( $date_range['endDate'] ) ) {
			return '';
		}

		$format_date = static function ( $value ) {
			$timestamp = strtotime( $value );
			if ( ! $timestamp ) {
				return $value;
			}

			$timezone = function_exists( 'wp_timezone' ) ? wp_timezone() : null;
			if ( $timezone && function_exists( 'wp_date' ) ) {
				return wp_date( 'M j', $timestamp, $timezone );
			}

			return gmdate( 'M j', $timestamp );
		};

		return sprintf(
			'%s – %s',
			$format_date( $date_range['startDate'] ),
			$format_date( $date_range['endDate'] )
		);
	}

	/**
	 * Builds an email subject for the report.
	 *
	 * @since 1.170.0
	 *
	 * @param string $frequency Frequency slug.
	 * @return string Email subject.
	 */
	private function build_subject( $frequency ) {
		$frequency_label = $this->get_frequency_label( $frequency );
		$site_domain     = $this->get_site_domain();

		return sprintf(
			/* translators: 1: Report frequency, 2: Site domain. */
			__( 'Your %1$s Site Kit report for %2$s', 'google-site-kit' ),
			$frequency_label,
			$site_domain
		);
	}

	/**
	 * Gets a friendly frequency label.
	 *
	 * @since 1.170.0
	 *
	 * @param string $frequency Frequency slug.
	 * @return string Frequency label.
	 */
	public function get_frequency_label( $frequency ) {
		switch ( $frequency ) {
			case Email_Reporting_Settings::FREQUENCY_MONTHLY:
				return __( 'monthly', 'google-site-kit' );
			case Email_Reporting_Settings::FREQUENCY_QUARTERLY:
				return __( 'quarterly', 'google-site-kit' );
			case Email_Reporting_Settings::FREQUENCY_WEEKLY:
			default:
				return __( 'weekly', 'google-site-kit' );
		}
	}

	/**
	 * Gets a human-readable label for when the first report will be sent.
	 *
	 * Returns a localized string describing when the user can expect their
	 * first report based on their selected frequency.
	 *
	 * @since 1.173.0
	 *
	 * @param string $frequency Frequency slug (weekly, monthly, quarterly).
	 * @return string First report date label.
	 */
	public function get_first_report_date_label( $frequency ) {
		switch ( $frequency ) {
			case Email_Reporting_Settings::FREQUENCY_MONTHLY:
				return __( '1st of the following month', 'google-site-kit' );

			case Email_Reporting_Settings::FREQUENCY_QUARTERLY:
				return $this->get_next_quarter_label();

			case Email_Reporting_Settings::FREQUENCY_WEEKLY:
			default:
				return $this->get_next_week_start_label();
		}
	}

	/**
	 * Gets the label for the next week start day.
	 *
	 * Uses WordPress start_of_week setting to determine which day
	 * of the week reports are sent.
	 *
	 * @since 1.173.0
	 *
	 * @return string Label like "next Monday".
	 */
	private function get_next_week_start_label() {
		$start_of_week = (int) get_option( 'start_of_week', 0 );

		global $wp_locale;

		$day_name = $wp_locale->get_weekday( $start_of_week );

		return sprintf(
			/* translators: %s: Day of the week (e.g., "Monday"). */
			__( 'next %s', 'google-site-kit' ),
			$day_name
		);
	}

	/**
	 * Gets the label for the next quarterly report date.
	 *
	 * Quarters are: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec).
	 * Returns "1st of {month}" for the first month of the next quarter.
	 *
	 * @since 1.173.0
	 *
	 * @return string Label like "1st of April".
	 */
	private function get_next_quarter_label() {
		$current_month = (int) gmdate( 'n' );

		// Determine the first month of the next quarter.
		if ( $current_month <= 3 ) {
			// Current: Q1 (Jan-Mar), Next: Q2 starts April.
			$next_quarter_month = 4;
		} elseif ( $current_month <= 6 ) {
			// Current: Q2 (Apr-Jun), Next: Q3 starts July.
			$next_quarter_month = 7;
		} elseif ( $current_month <= 9 ) {
			// Current: Q3 (Jul-Sep), Next: Q4 starts October.
			$next_quarter_month = 10;
		} else {
			// Current: Q4 (Oct-Dec), Next: Q1 starts January.
			$next_quarter_month = 1;
		}

		// Get localized month name.
		$timestamp  = mktime( 0, 0, 0, $next_quarter_month, 1 );
		$month_name = wp_date( 'F', $timestamp );

		return sprintf(
			/* translators: %s: Month name (e.g., "April"). */
			__( '1st of %s', 'google-site-kit' ),
			$month_name
		);
	}

	/**
	 * Gets the site domain including subdirectory context.
	 *
	 * @since 1.170.0
	 *
	 * @return string Site domain string.
	 */
	private function get_site_domain() {
		$site_url = $this->context->get_reference_site_url();
		$parsed   = wp_parse_url( $site_url );

		if ( empty( $parsed['host'] ) ) {
			return $site_url;
		}

		$domain = $parsed['host'];

		if ( ! empty( $parsed['path'] ) && '/' !== $parsed['path'] ) {
			$domain .= untrailingslashit( $parsed['path'] );
		}

		return $domain;
	}
}
