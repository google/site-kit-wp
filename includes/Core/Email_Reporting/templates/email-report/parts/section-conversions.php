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
 * @var callable $render_part        Function to render a template part.
 * @var callable $get_asset_url      Function to get asset URLs.
 * @var string   $template_parts_dir Path to template parts directory.
 * @var string   $shared_parts_dir   Path to shared parts directory.
 */

$section_title = $section['title'];
$section_icon  = $section['icon'];
$dashboard_url = $section['dashboard_url'];
$section_parts = $section['section_parts'];
?>
<table role="presentation" width="100%" style="margin-bottom:24px;">
	<tr>
		<td style="background-color: #FFFFFF; border-radius: 16px; padding: 16px;">
			<?php
			// Render section header.
			$icon_url = $get_asset_url( 'icon-' . esc_html( $section_icon ) . '.png' );
			$render_part(
				$template_parts_dir . '/section-header.php',
				array(
					'icon'     => $icon_url,
					'title'    => $section_title,
					'subtitle' => $section_parts['total_conversion_events']['data']['change_context'],
				)
			);

			// Render total conversion events part.
			?>
			<table role="presentation" width="100%" style="margin-bottom:16px;">
				<tr>
					<td style="font-size:12px; line-height:16px; font-weight:500; color:#6C726E;">
						<?php echo esc_html( $section_parts['total_conversion_events']['data']['label'] ); ?>
					</td>
					<td style="font-size:12px; line-height:16px; font-weight:500; color:#6C726E; text-align: right;">
						<?php echo esc_html( $section_parts['total_conversion_events']['data']['change_context'] ); ?>
					</td>
				</tr>
				<tr>
					<td style="font-size:14px; line-height:20px; font-weight:500;">
						<?php echo esc_html( $section_parts['total_conversion_events']['data']['value'] ); ?>
					</td>
					<td style="text-align: right; padding: 6px 0;">
						<?php
						$render_part(
							$shared_parts_dir . '/change-badge.php',
							array(
								'value' => $section_parts['total_conversion_events']['data']['change'],
							)
						);
						?>
					</td>
				</tr>
			</table>

			<?php
			// Render conversion metric parts (excluding total_conversion_events).
			foreach ( $section_parts as $part_key => $part_config ) {
				// Skip total_conversion_events as it's rendered separately above.
				if ( 'total_conversion_events' === $part_key ) {
					continue;
				}

				$render_part(
					$template_parts_dir . '/section-conversions-metric-part.php',
					array(
						'data'                => $part_config['data'],
						'top_traffic_channel' => $part_config['top_traffic_channel'],
						'render_part'         => $render_part,
						'get_asset_url'       => $get_asset_url,
						'template_parts_dir'  => $template_parts_dir,
						'shared_parts_dir'    => $shared_parts_dir,
					)
				);
			}

			// Render view more in dashboard link.
			$render_part(
				$template_parts_dir . '/view-more-in-dashboard.php',
				array(
					'url'           => $dashboard_url,
					'get_asset_url' => $get_asset_url,
				)
			);
			?>
		</td>
	</tr>
</table>
