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

namespace Google\Service\GoogleAnalyticsAdmin;

class GoogleAnalyticsAdminV1alphaSubpropertyEventFilterCondition extends \Google\Model
{
  /**
   * @var string
   */
  public $fieldName;
  /**
   * @var bool
   */
  public $nullFilter;
  protected $stringFilterType = GoogleAnalyticsAdminV1alphaSubpropertyEventFilterConditionStringFilter::class;
  protected $stringFilterDataType = '';

  /**
   * @param string
   */
  public function setFieldName($fieldName)
  {
    $this->fieldName = $fieldName;
  }
  /**
   * @return string
   */
  public function getFieldName()
  {
    return $this->fieldName;
  }
  /**
   * @param bool
   */
  public function setNullFilter($nullFilter)
  {
    $this->nullFilter = $nullFilter;
  }
  /**
   * @return bool
   */
  public function getNullFilter()
  {
    return $this->nullFilter;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaSubpropertyEventFilterConditionStringFilter
   */
  public function setStringFilter(GoogleAnalyticsAdminV1alphaSubpropertyEventFilterConditionStringFilter $stringFilter)
  {
    $this->stringFilter = $stringFilter;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaSubpropertyEventFilterConditionStringFilter
   */
  public function getStringFilter()
  {
    return $this->stringFilter;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaSubpropertyEventFilterCondition::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaSubpropertyEventFilterCondition');
