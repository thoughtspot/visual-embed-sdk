export const createConversation = `
mutation CreateConversation($params: Input_convassist_CreateConversationRequest) {
  ConvAssist__createConversation(request: $params) {
    convId
    initialCtx {
      type
      tsAnsCtx {
        sessionId
        genNo
        stateKey {
          transactionId
          generationNumber
        }
        worksheet {
          worksheetId
          worksheetName
        }
      }
    }
  }
}
`;

export const sendMessage = `
query SendMessage($params: Input_convassist_SendMessageRequest) {
  ConvAssist__sendMessage(request: $params) {
    responses {
      timestamp
      msgId
      data {
        asstRespData {
          tool
          asstRespText
          nlsAnsData {
            sageQuerySuggestions {
              sageQueryTokens {
                additions {
                  phrase {
                    isCompletePhrase
                    numTokens
                    phraseType
                    startIndex
                    __typename
                  }
                  tokens {
                    token
                    dataType
                    typeEnum
                    guid
                    tokenMetadata {
                      name
                      __typename
                    }
                    __typename
                  }
                  __typename
                }
                phrases {
                  isCompletePhrase
                  numTokens
                  phraseType
                  startIndex
                  __typename
                }
                removals {
                  phrase {
                    isCompletePhrase
                    numTokens
                    phraseType
                    startIndex
                    __typename
                  }
                  tokens {
                    token
                    dataType
                    typeEnum
                    guid
                    tokenMetadata {
                      name
                      __typename
                    }
                    __typename
                  }
                  __typename
                }
                tokens {
                  token
                  dataType
                  typeEnum
                  guid
                  tokenMetadata {
                    name
                    __typename
                  }
                  __typename
                }
                __typename
              }
              llmReasoning {
                assumptions
                clarifications
                interpretation
                __typename
              }
              tokens
              tmlTokens
              worksheetId
              tokens
              description
              title
              tmlTokens
              cached
              sqlQuery
              sessionId
              genNo
              formulaInfo {
                name
                expression
                __typename
              }
              tmlPhrases
              ambiguousPhrases {
                alternativePhrases {
                  phraseType
                  token {
                    token
                    dataType
                    typeEnum
                    guid
                    tokenMetadata {
                      name
                      __typename
                    }
                    __typename
                  }
                  __typename
                }
                ambiguityType
                token {
                  token
                  dataType
                  typeEnum
                  guid
                  tokenMetadata {
                    name
                    __typename
                  }
                  __typename
                }
                __typename
              }
              ambiguousTokens {
                alternativeTokens {
                  token
                  dataType
                  typeEnum
                  guid
                  tokenMetadata {
                    name
                    deprecatedTableGuid
                    deprecatedTableName
                    isFormula
                    rootTables {
                      created
                      description
                      guid
                      indexVersion
                      modified
                      name
                      __typename
                    }
                    schemaTableUserDefinedName
                    table {
                      created
                      description
                      guid
                      indexVersion
                      modified
                      name
                      __typename
                    }
                    __typename
                  }
                  __typename
                }
                ambiguityType
                token {
                  token
                  dataType
                  typeEnum
                  guid
                  tokenMetadata {
                    name
                    __typename
                  }
                  __typename
                }
                __typename
              }
              stateKey {
                transactionId
                generationNumber
                transactionId
                __typename
              }
              subQueries {
                tokens
                cohortConfig {
                  anchorColumnId
                  cohortAnswerGuid
                  cohortGroupingType
                  cohortGuid
                  cohortType
                  combineNonGroupValues
                  description
                  groupExcludedQueryValues
                  hideExcludedQueryValues
                  isEditable
                  name
                  nullOutputValue
                  returnColumnId
                  __typename
                }
                formulas {
                  name
                  expression
                  __typename
                }
                __typename
              }
              visualizationSuggestion {
                chartType
                displayMode
                axisConfigs {
                  category
                  color
                  hidden
                  size
                  sort
                  x
                  y
                  __typename
                }
                usersVizIntentApplied
                customChartConfigs {
                  dimensions {
                    columns
                    key
                    __typename
                  }
                  key
                  __typename
                }
                customChartGuid
                __typename
              }
              tableData {
                columnDataLite {
                  columnId
                  columnDataType
                  dataValue
                  columnName
                  __typename
                }
                __typename
              }
              warningType
              cached
              __typename
            }
            debugInfo {
              fewShotExamples {
                chartType
                id
                mappingId
                nlQuery
                nlQueryConcepts
                sageQuery
                scope
                sql
                tml
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }
        errorData {
          tool
          errCode
          errTxt
          toolErrCode
          __typename
        }
        __typename
      }
      type
      __typename
    }
    prevCtx {
      genNo
      sessionId
      __typename
    }
    __typename
  }
}
`;
