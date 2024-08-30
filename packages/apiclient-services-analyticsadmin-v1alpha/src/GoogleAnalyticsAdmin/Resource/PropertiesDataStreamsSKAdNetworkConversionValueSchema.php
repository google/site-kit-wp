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

use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListSKAdNetworkConversionValueSchemasResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaSKAdNetworkConversionValueSchema;
use Google\Service\GoogleAnalyticsAdmin\GoogleProtobufEmpty;

/**
 * The "sKAdNetworkConversionValueSchema" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google\Service\GoogleAnalyticsAdmin(...);
 *   $sKAdNetworkConversionValueSchema = $analyticsadminService->properties_dataStreams_sKAdNetworkConversionValueSchema;
 *  </code>
 */
class PropertiesDataStreamsSKAdNetworkConversionValueSchema extends \Google\Service\Resource
{
  /**
   * Creates a SKAdNetworkConversionValueSchema.
   * (sKAdNetworkConversionValueSchema.create)
   *
   * @param string $parent Required. The parent resource where this schema will be
   * created. Format: properties/{property}/dataStreams/{dataStream}
   * @param GoogleAnalyticsAdminV1alphaSKAdNetworkConversionValueSchema $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaSKAdNetworkConversionValueSchema
   * @throws \Google\Service\Exception
   */
  public function create($parent, GoogleAnalyticsAdminV1alphaSKAdNetworkConversionValueSchema $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], GoogleAnalyticsAdminV1alphaSKAdNetworkConversionValueSchema::class);
  }
  /**
   * Deletes target SKAdNetworkConversionValueSchema.
   * (sKAdNetworkConversionValueSchema.delete)
   *
   * @param string $name Required. The name of the
   * SKAdNetworkConversionValueSchema to delete. Format: properties/{property}/dat
   * aStreams/{dataStream}/sKAdNetworkConversionValueSchema/{skadnetwork_conversio
   * n_value_schema}
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
   * Looks up a single SKAdNetworkConversionValueSchema.
   * (sKAdNetworkConversionValueSchema.get)
   *
   * @param string $name Required. The resource name of SKAdNetwork conversion
   * value schema to look up. Format: properties/{property}/dataStreams/{dataStrea
   * m}/sKAdNetworkConversionValueSchema/{skadnetwork_conversion_value_schema}
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaSKAdNetworkConversionValueSchema
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], GoogleAnalyticsAdminV1alphaSKAdNetworkConversionValueSchema::class);
  }
  /**
   * Lists SKAdNetworkConversionValueSchema on a stream. Properties can have at
   * most one SKAdNetworkConversionValueSchema. (sKAdNetworkConversionValueSchema.
   * listPropertiesDataStreamsSKAdNetworkConversionValueSchema)
   *
   * @param string $parent Required. The DataStream resource to list schemas for.
   * Format: properties/{property_id}/dataStreams/{dataStream} Example:
   * properties/1234/dataStreams/5678
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize The maximum number of resources to return. The
   * service may return fewer than this value, even if there are additional pages.
   * If unspecified, at most 50 resources will be returned. The maximum value is
   * 200; (higher values will be coerced to the maximum)
   * @opt_param string pageToken A page token, received from a previous
   * `ListSKAdNetworkConversionValueSchemas` call. Provide this to retrieve the
   * subsequent page. When paginating, all other parameters provided to
   * `ListSKAdNetworkConversionValueSchema` must match the call that provided the
   * page token.
   * @return GoogleAnalyticsAdminV1alphaListSKAdNetworkConversionValueSchemasResponse
   * @throws \Google\Service\Exception
   */
  public function listPropertiesDataStreamsSKAdNetworkConversionValueSchema($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], GoogleAnalyticsAdminV1alphaListSKAdNetworkConversionValueSchemasResponse::class);
  }
  /**
   * Updates a SKAdNetworkConversionValueSchema.
   * (sKAdNetworkConversionValueSchema.patch)
   *
   * @param string $name Output only. Resource name of the schema. This will be
   * child of ONLY an iOS stream, and there can be at most one such child under an
   * iOS stream. Format: properties/{property}/dataStreams/{dataStream}/sKAdNetwor
   * kConversionValueSchema
   * @param GoogleAnalyticsAdminV1alphaSKAdNetworkConversionValueSchema $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Required. The list of fields to be updated.
   * Omitted fields will not be updated.
   * @return GoogleAnalyticsAdminV1alphaSKAdNetworkConversionValueSchema
   * @throws \Google\Service\Exception
   */
  public function patch($name, GoogleAnalyticsAdminV1alphaSKAdNetworkConversionValueSchema $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], GoogleAnalyticsAdminV1alphaSKAdNetworkConversionValueSchema::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PropertiesDataStreamsSKAdNetworkConversionValueSchema::class, 'Google_Service_GoogleAnalyticsAdmin_Resource_PropertiesDataStreamsSKAdNetworkConversionValueSchema');
