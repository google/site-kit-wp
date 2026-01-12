<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Plain_Text_Formatter
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

/**
 * Static helper class for formatting email content as plain text.
 *
 * @since 1.170.0
 */
class Plain_Text_Formatter {

	/**
	 * Formats the email header.
	 *
	 * @since 1.170.0
	 *
	 * @param string $site_domain The site domain.
	 * @param string $date_label  The date range label.
	 * @return string Formatted header text.
	 */
	public static function format_header( $site_domain, $date_label ) {
		$lines = array(
			__( 'Site Kit by Google', 'google-site-kit' ),
			__( 'Your performance at a glance', 'google-site-kit' ),
			$site_domain,
			$date_label,
			'',
			str_repeat( '-', 50 ),
			'',
		);

		return implode( "\n", $lines );
	}

	/**
	 * Formats a section based on its template type.
	 *
	 * @since 1.170.0
	 *
	 * @param array $section Section configuration including title, section_template, section_parts.
	 * @return string Formatted section text.
	 */
	public static function format_section( $section ) {
		if ( empty( $section['section_parts'] ) ) {
			return '';
		}

		$template = $section['section_template'] ?? '';

		switch ( $template ) {
			case 'section-conversions':
				return self::format_conversions_section( $section );
			case 'section-metrics':
				return self::format_metrics_section( $section );
			case 'section-page-metrics':
				return self::format_page_metrics_section( $section );
			default:
				return '';
		}
	}

	/**
	 * Formats a section heading with underline.
	 *
	 * @since 1.170.0
	 *
	 * @param string $title The section title.
	 * @return string Formatted heading text.
	 */
	public static function format_section_heading( $title ) {
		$underline = str_repeat( '=', mb_strlen( $title ) );
		return $title . "\n" . $underline . "\n\n";
	}

	/**
	 * Formats a single metric row.
	 *
	 * @since 1.170.0
	 *
	 * @param string     $label  The metric label.
	 * @param string     $value  The metric value.
	 * @param float|null $change The percentage change value, or null.
	 * @return string Formatted metric text.
	 */
	public static function format_metric( $label, $value, $change ) {
		$change_text = self::format_change( $change );
		if ( '' !== $change_text ) {
			return sprintf( '%s: %s %s', $label, $value, $change_text );
		}
		return sprintf( '%s: %s', $label, $value );
	}

	/**
	 * Formats a page/keyword row with optional URL.
	 *
	 * @since 1.170.0
	 *
	 * @param string     $label  The item label.
	 * @param string     $value  The metric value.
	 * @param float|null $change The percentage change value, or null.
	 * @param string     $url    Optional URL for the item.
	 * @return string Formatted row text.
	 */
	public static function format_page_row( $label, $value, $change, $url = '' ) {
		$change_text = self::format_change( $change );
		$line        = sprintf( '  • %s: %s', $label, $value );

		if ( '' !== $change_text ) {
			$line .= ' ' . $change_text;
		}

		if ( ! empty( $url ) ) {
			$line .= "\n    " . $url;
		}

		return $line;
	}

	/**
	 * Formats a link with label and URL.
	 *
	 * @since 1.170.0
	 *
	 * @param string $label The link label.
	 * @param string $url   The URL.
	 * @return string Formatted link text.
	 */
	public static function format_link( $label, $url ) {
		return sprintf( '%s: %s', $label, $url );
	}

	/**
	 * Formats the email footer with CTA and links.
	 *
	 * @since 1.170.0
	 *
	 * @param array $cta    Primary CTA configuration with 'url' and 'label'.
	 * @param array $footer Footer configuration with 'copy', 'unsubscribe_url', and 'links'.
	 * @return string Formatted footer text.
	 */
	public static function format_footer( $cta, $footer ) {
		$lines = array(
			str_repeat( '-', 50 ),
			'',
		);

		// Primary CTA.
		if ( ! empty( $cta['url'] ) ) {
			$label   = $cta['label'] ?? __( 'View dashboard', 'google-site-kit' );
			$lines[] = self::format_link( $label, $cta['url'] );
			$lines[] = '';
		}

		// Footer copy with unsubscribe link.
		if ( ! empty( $footer['copy'] ) ) {
			$copy = $footer['copy'];
			if ( ! empty( $footer['unsubscribe_url'] ) ) {
				$copy .= ' ' . sprintf(
					/* translators: %s: Unsubscribe URL */
					__( 'Unsubscribe here: %s', 'google-site-kit' ),
					$footer['unsubscribe_url']
				);
			}
			$lines[] = $copy;
			$lines[] = '';
		}

		// Footer links.
		if ( ! empty( $footer['links'] ) && is_array( $footer['links'] ) ) {
			foreach ( $footer['links'] as $link ) {
				if ( ! empty( $link['label'] ) && ! empty( $link['url'] ) ) {
					$lines[] = self::format_link( $link['label'], $link['url'] );
				}
			}
		}

		return implode( "\n", $lines );
	}

	/**
	 * Formats a change value with sign prefix.
	 *
	 * @since 1.170.0
	 *
	 * @param float|null $change The percentage change value, or null.
	 * @return string Formatted change text (e.g., "(+12%)" or "(-5%)"), or empty string if null.
	 */
	public static function format_change( $change ) {
		if ( null === $change ) {
			return '';
		}

		$prefix        = $change > 0 ? '+' : '';
		$display_value = $prefix . round( $change, 1 ) . '%';

		return '(' . $display_value . ')';
	}

	/**
	 * Formats the conversions section.
	 *
	 * @since 1.170.0
	 *
	 * @param array $section Section configuration.
	 * @return string Formatted section text.
	 */
	protected static function format_conversions_section( $section ) {
		$output        = self::format_section_heading( $section['title'] );
		$section_parts = $section['section_parts'];

		// Total conversion events (rendered first/separately).
		if ( ! empty( $section_parts['total_conversion_events']['data'] ) ) {
			$data    = $section_parts['total_conversion_events']['data'];
			$output .= self::format_metric(
				$data['label'] ?? __( 'Total conversions', 'google-site-kit' ),
				$data['value'] ?? '',
				$data['change'] ?? null
			);
			$output .= "\n";

			if ( ! empty( $data['change_context'] ) ) {
				$output .= $data['change_context'] . "\n";
			}
			$output .= "\n";
		}

		// Other conversion metrics.
		foreach ( $section_parts as $part_key => $part_config ) {
			if ( 'total_conversion_events' === $part_key || empty( $part_config['data'] ) ) {
				continue;
			}

			$data    = $part_config['data'];
			$output .= self::format_conversion_metric_part( $data );
		}

		return $output . "\n";
	}

	/**
	 * Formats a conversion metric part (e.g., purchases, products added to cart).
	 *
	 * @since 1.170.0
	 *
	 * @param array $data Conversion metric data.
	 * @return string Formatted metric part text.
	 */
	protected static function format_conversion_metric_part( $data ) {
		$lines = array();

		// Metric label.
		if ( ! empty( $data['label'] ) ) {
			$lines[] = $data['label'];
		}

		// Event count with change.
		if ( ! empty( $data['event_name'] ) ) {
			$event_label = sprintf(
				/* translators: %s: Event name (e.g., "Purchase") */
				__( '“%s“ events', 'google-site-kit' ),
				ucfirst( $data['event_name'] )
			);
			$lines[] = self::format_metric(
				$event_label,
				$data['value'] ?? '',
				$data['change'] ?? null
			);
		}

		// Top traffic channel.
		if ( ! empty( $data['dimension'] ) && ! empty( $data['dimension_value'] ) ) {
			$lines[] = sprintf(
				'%s: %s',
				__( 'Top traffic channel driving the most conversions', 'google-site-kit' ),
				$data['dimension_value']
			);
		}

		$lines[] = '';

		return implode( "\n", $lines );
	}

	/**
	 * Formats the metrics section (e.g., visitors).
	 *
	 * @since 1.170.0
	 *
	 * @param array $section Section configuration.
	 * @return string Formatted section text.
	 */
	protected static function format_metrics_section( $section ) {
		$output        = self::format_section_heading( $section['title'] );
		$section_parts = $section['section_parts'];

		// Get change context from first part.
		$first_part = reset( $section_parts );
		if ( ! empty( $first_part['data']['change_context'] ) ) {
			$output .= $first_part['data']['change_context'] . "\n\n";
		}

		foreach ( $section_parts as $part_key => $part_config ) {
			if ( empty( $part_config['data'] ) ) {
				continue;
			}

			$data    = $part_config['data'];
			$output .= self::format_metric(
				$data['label'] ?? '',
				$data['value'] ?? '',
				$data['change'] ?? null
			);
			$output .= "\n";
		}

		return $output . "\n";
	}

	/**
	 * Formats the page metrics section (e.g., traffic sources, top pages).
	 *
	 * @since 1.170.0
	 *
	 * @param array $section Section configuration.
	 * @return string Formatted section text.
	 */
	protected static function format_page_metrics_section( $section ) {
		$output        = self::format_section_heading( $section['title'] );
		$section_parts = $section['section_parts'];

		foreach ( $section_parts as $part_key => $part_config ) {
			if ( empty( $part_config['data'] ) ) {
				continue;
			}

			$data       = $part_config['data'];
			$part_label = Sections_Map::get_part_label( $part_key );

			// Part heading.
			$output .= $part_label . "\n";
			$output .= str_repeat( '-', mb_strlen( $part_label ) ) . "\n";

			// Change context.
			if ( ! empty( $data['change_context'] ) ) {
				$output .= $data['change_context'] . "\n";
			}

			// Dimension values (list items).
			if ( ! empty( $data['dimension_values'] ) && is_array( $data['dimension_values'] ) ) {
				foreach ( $data['dimension_values'] as $index => $item ) {
					$label  = is_array( $item ) ? ( $item['label'] ?? '' ) : $item;
					$url    = is_array( $item ) ? ( $item['url'] ?? '' ) : '';
					$value  = $data['values'][ $index ] ?? '';
					$change = $data['changes'][ $index ] ?? null;

					$output .= self::format_page_row( $label, $value, $change, $url ) . "\n";
				}
			}

			$output .= "\n";
		}

		return $output;
	}
}
