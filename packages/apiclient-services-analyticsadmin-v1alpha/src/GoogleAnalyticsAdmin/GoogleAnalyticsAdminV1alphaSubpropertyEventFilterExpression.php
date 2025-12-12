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

class GoogleAnalyticsAdminV1alphaSubpropertyEventFilterExpression extends \Google\Model
{
  protected $filterConditionType = GoogleAnalyticsAdminV1alphaSubpropertyEventFilterCondition::class;
  protected $filterConditionDataType = '';
  protected $notExpressionType = GoogleAnalyticsAdminV1alphaSubpropertyEventFilterExpression::class;
  protected $notExpressionDataType = '';
  protected $orGroupType = GoogleAnalyticsAdminV1alphaSubpropertyEventFilterExpressionList::class;
  protected $orGroupDataType = '';

  /**
   * @param GoogleAnalyticsAdminV1alphaSubpropertyEventFilterCondition
   */
  public function setFilterCondition(GoogleAnalyticsAdminV1alphaSubpropertyEventFilterCondition $filterCondition)
  {
    $this->filterCondition = $filterCondition;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaSubpropertyEventFilterCondition
   */
  public function getFilterCondition()
  {
    return $this->filterCondition;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaSubpropertyEventFilterExpression
   */
  public function setNotExpression(GoogleAnalyticsAdminV1alphaSubpropertyEventFilterExpression $notExpression)
  {
    $this->notExpression = $notExpression;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaSubpropertyEventFilterExpression
   */
  public function getNotExpression()
  {
    return $this->notExpression;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaSubpropertyEventFilterExpressionList
   */
  public function setOrGroup(GoogleAnalyticsAdminV1alphaSubpropertyEventFilterExpressionList $orGroup)
  {
    $this->orGroup = $orGroup;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaSubpropertyEventFilterExpressionList
   */
  public function getOrGroup()
  {
    return $this->orGroup;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaSubpropertyEventFilterExpression::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaSubpropertyEventFilterExpression');
