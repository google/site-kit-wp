<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\GoogleAnalyticsAdmin\Resource;

use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaDataRedactionSettings;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaDataStream;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaGlobalSiteTag;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListDataStreamsResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleProtobufEmpty;

/**
 * The "dataStreams" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google\Service\GoogleAnalyticsAdmin(...);
 *   $dataStreams = $analyticsadminService->properties_dataStreams;
 *  </code>
 */
class PropertiesDataStreams extends \Google\Service\Resource
{
  /**
   * Creates a DataStream. (dataStreams.create)
   *
   * @param string $parent Required. Example format: properties/1234
   * @param GoogleAnalyticsAdminV1alphaDataStream $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaDataStream
   * @throws \Google\Service\Exception
   */
  public function create($parent, GoogleAnalyticsAdminV1alphaDataStream $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], GoogleAnalyticsAdminV1alphaDataStream::class);
  }
  /**
   * Deletes a DataStream on a property. (dataStreams.delete)
   *
   * @param string $name Required. The name of the DataStream to delete. Example
   * format: properties/1234/dataStreams/5678
   * @param array $optParams Optional parameters.
   * @return GoogleProtobufEmpty
   * @throws \Google\Service\Exception
   */
  public function delete($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('delete', [$params], GoogleProtobufEmpty::class);
  }
  /**
   * Lookup for a single DataStream. (dataStreams.get)
   *
   * @param string $name Required. The name of the DataStream to get. Example
   * format: properties/1234/dataStreams/5678
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaDataStream
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], GoogleAnalyticsAdminV1alphaDataStream::class);
  }
  /**
   * Lookup for a single DataRedactionSettings.
   * (dataStreams.getDataRedactionSettings)
   *
   * @param string $name Required. The name of the settings to lookup. Format:
   * properties/{property}/dataStreams/{data_stream}/dataRedactionSettings
   * Example: "properties/1000/dataStreams/2000/dataRedactionSettings"
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaDataRedactionSettings
   * @throws \Google\Service\Exception
   */
  public function getDataRedactionSettings($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('getDataRedactionSettings', [$params], GoogleAnalyticsAdminV1alphaDataRedactionSettings::class);
  }
  /**
   * Returns the enhanced measurement settings for this data stream. Note that the
   * stream must enable enhanced measurement for these settings to take effect.
   * (dataStreams.getEnhancedMeasurementSettings)
   *
   * @param string $name Required. The name of the settings to lookup. Format:
   * properties/{property}/dataStreams/{data_stream}/enhancedMeasurementSettings
   * Example: "properties/1000/dataStreams/2000/enhancedMeasurementSettings"
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings
   * @throws \Google\Service\Exception
   */
  public function getEnhancedMeasurementSettings($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('getEnhancedMeasurementSettings', [$params], GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings::class);
  }
  /**
   * Returns the Site Tag for the specified web stream. Site Tags are immutable
   * singletons. (dataStreams.getGlobalSiteTag)
   *
   * @param string $name Required. The name of the site tag to lookup. Note that
   * site tags are singletons and do not have unique IDs. Format:
   * properties/{property_id}/dataStreams/{stream_id}/globalSiteTag Example:
   * `properties/123/dataStreams/456/globalSiteTag`
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaGlobalSiteTag
   * @throws \Google\Service\Exception
   */
  public function getGlobalSiteTag($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('getGlobalSiteTag', [$params], GoogleAnalyticsAdminV1alphaGlobalSiteTag::class);
  }
  /**
   * Lists DataStreams on a property. (dataStreams.listPropertiesDataStreams)
   *
   * @param string $parent Required. Example format: properties/1234
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize The maximum number of resources to return. If
   * unspecified, at most 50 resources will be returned. The maximum value is 200
   * (higher values will be coerced to the maximum).
   * @opt_param string pageToken A page token, received from a previous
   * `ListDataStreams` call. Provide this to retrieve the subsequent page. When
   * paginating, all other parameters provided to `ListDataStreams` must match the
   * call that provided the page token.
   * @return GoogleAnalyticsAdminV1alphaListDataStreamsResponse
   * @throws \Google\Service\Exception
   */
  public function listPropertiesDataStreams($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], GoogleAnalyticsAdminV1alphaListDataStreamsResponse::class);
  }
  /**
   * Updates a DataStream on a property. (dataStreams.patch)
   *
   * @param string $name Output only. Resource name of this Data Stream. Format:
   * properties/{property_id}/dataStreams/{stream_id} Example:
   * "properties/1000/dataStreams/2000"
   * @param GoogleAnalyticsAdminV1alphaDataStream $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Required. The list of fields to be updated.
   * Omitted fields will not be updated. To replace the entire entity, use one
   * path with the string "*" to match all fields.
   * @return GoogleAnalyticsAdminV1alphaDataStream
   * @throws \Google\Service\Exception
   */
  public function patch($name, GoogleAnalyticsAdminV1alphaDataStream $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], GoogleAnalyticsAdminV1alphaDataStream::class);
  }
  /**
   * Updates a DataRedactionSettings on a property.
   * (dataStreams.updateDataRedactionSettings)
   *
   * @param string $name Output only. Name of this Data Redaction Settings
   * resource. Format:
   * properties/{property_id}/dataStreams/{data_stream}/dataRedactionSettings
   * Example: "properties/1000/dataStreams/2000/dataRedactionSettings"
   * @param GoogleAnalyticsAdminV1alphaDataRedactionSettings $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Required. The list of fields to be updated.
   * Field names must be in snake case (e.g., "field_to_update"). Omitted fields
   * will not be updated. To replace the entire entity, use one path with the
   * string "*" to match all fields.
   * @return GoogleAnalyticsAdminV1alphaDataRedactionSettings
   * @throws \Google\Service\Exception
   */
  public function updateDataRedactionSettings($name, GoogleAnalyticsAdminV1alphaDataRedactionSettings $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('updateDataRedactionSettings', [$params], GoogleAnalyticsAdminV1alphaDataRedactionSettings::class);
  }
  /**
   * Updates the enhanced measurement settings for this data stream. Note that the
   * stream must enable enhanced measurement for these settings to take effect.
   * (dataStreams.updateEnhancedMeasurementSettings)
   *
   * @param string $name Output only. Resource name of the Enhanced Measurement
   * Settings. Format: properties/{property_id}/dataStreams/{data_stream}/enhanced
   * MeasurementSettings Example:
   * "properties/1000/dataStreams/2000/enhancedMeasurementSettings"
   * @param GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Required. The list of fields to be updated.
   * Field names must be in snake case (e.g., "field_to_update"). Omitted fields
   * will not be updated. To replace the entire entity, use one path with the
   * string "*" to match all fields.
   * @return GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings
   * @throws \Google\Service\Exception
   */
  public function updateEnhancedMeasurementSettings($name, GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('updateEnhancedMeasurementSettings', [$params], GoogleAnalyticsAdminV1alphaEnhancedMeasurementSettings::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PropertiesDataStreams::class, 'Google_Service_GoogleAnalyticsAdmin_Resource_PropertiesDataStreams');
