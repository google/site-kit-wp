<?php
/**
 * Conversions section template.
 *
 * This template renders the conversions metrics section with its header and parts.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var array    $section            Section configuration including title, icon, section_parts.
 * @var array    $section_notices    Notice payloads keyed by section key.
 * @var callable $render_part        Function to render a template part by name.
 * @var callable $render_shared_part Function to render a shared part by name.
 * @var callable $get_asset_url      Function to get asset URLs.
 */

use Google\Site_Kit\Core\Email_Reporting\Notices\Enable_Conversion_Events_Email_Notice;

$section_title   = $section['title'];
$section_icon    = $section['icon'];
$dashboard_url   = $section['dashboard_url'];
$section_parts   = $section['section_parts'];
$section_notices = isset( $section_notices ) && is_array( $section_notices ) ? $section_notices : array();
$section_key     = Enable_Conversion_Events_Email_Notice::SECTION_KEY;
$notices         = $section_notices[ $section_key ] ?? array();
$total_events    = $section_parts['total_conversion_events']['data'] ?? array();
$has_metrics     = ! empty( $section_parts );
?>
<table role="presentation" width="100%" style="margin-bottom:24px;">
	<tr>
		<td class="card" style="background-color: #FFFFFF; border-radius: 16px; padding: 16px;">
			<?php
			$icon_star_url = $get_asset_url( 'icon-star' );

			// Render section header.
			$icon_url = $get_asset_url( 'icon-' . esc_html( $section_icon ) );
			$render_part(
				'section-header',
				array(
					'icon'     => $icon_url,
					'title'    => $section_title,
					'subtitle' => $total_events['change_context'] ?? '',
				)
			);

			if ( ! empty( $notices ) ) {
				foreach ( $notices as $notice ) {
					$render_part(
						'notice',
						array(
							'notice'        => $notice,
							'icon_star_url' => $icon_star_url,
						)
					);
				}
			}

			// Render total conversion events part.
			?>
			<?php if ( ! empty( $total_events ) ) : ?>
			<table role="presentation" width="100%" style="margin-bottom:16px;">
				<tr>
					<td style="font-size:12px; line-height:16px; font-weight:500; color:#6C726E;">
						<?php echo esc_html( $total_events['label'] ); ?>
					</td>
					<td class="subtitle" width="110"
						style="font-size:12px; line-height:16px; font-weight:500; color:#6C726E; text-align: right; width: 110px;">
						<?php echo esc_html( $total_events['change_context'] ); ?>
					</td>
				</tr>
				<tr>
					<td style="font-size:14px; line-height:20px; font-weight:500;">
						<?php echo esc_html( $total_events['value'] ); ?>
					</td>
					<td style="text-align: right; padding: 6px 0;">
						<?php
						$render_shared_part(
							'change-badge',
							array(
								'value' => $total_events['change'],
							)
						);
						?>
					</td>
				</tr>
			</table>
			<?php endif; ?>

			<?php
			// Render conversion metric parts (excluding total_conversion_events).
			foreach ( $section_parts as $part_key => $part_config ) {
				// Skip total_conversion_events as it's rendered separately above.
				if ( 'total_conversion_events' === $part_key || empty( $part_config['data'] ) ) {
					continue;
				}

				$render_part(
					'section-conversions-metric-part',
					array(
						'data'               => $part_config['data'],
						'render_part'        => $render_part,
						'render_shared_part' => $render_shared_part,
						'get_asset_url'      => $get_asset_url,
					)
				);
			}

			if ( $has_metrics ) {
				// Render view more in dashboard link when there are metric rows.
				$render_part(
					'view-more-in-dashboard',
					array(
						'url'           => $dashboard_url,
						'get_asset_url' => $get_asset_url,
					)
				);
			}
			?>
		</td>
	</tr>
</table>
