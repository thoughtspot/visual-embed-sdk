export const getAnswerSessionFromQuery = `
query GetEurekaResults($params: Input_eureka_SearchRequest) {
        queryRequest(request: $params) {
            ...eurekaResults
            __typename
        }
    }

        fragment eurekaResults on eureka_SearchResponse {
        facets {
            facetType
            facetValue
            facetValues {
            id
            resultCount
            name
            __typename
            }
            __typename
        }
        requestIdentifiers {
            apiRequestId
            appActivityId
            __typename
        }
        sageQuerySuggestions {
            llmReasoning {
                assumptions
                clarifications
                interpretation
                __typename
            }
            tokens
            tmlTokens
            worksheetId
            description
            title
            tmlTokens
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
            sessionId
            genNo
            stateKey {
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
            warningDetails {
            warningType
            __typename
            }
            __typename
        }
        results {
            objectSecurityInfo {
            objectType
            objectId
            objectIdForDeletionCheck
            objectTypeForDeletionCheck
            isD13ySourced
            offset
            __typename
            }
            searchAnswer {
            ...eurekaAnswer
            __typename
            }
            searchPinboardViz {
            answer {
                ...eurekaAnswer
                __typename
            }
            pinboardHeader {
                id
                title
                __typename
            }
            __typename
            }
            searchPinboard {
            header {
                ...header
                __typename
            }
            usageInfo {
                ...usageInfo
                __typename
            }
            answers {
                ...eurekaAnswer
                __typename
            }
            vizCount {
                charts
                metrics
                tables
                __typename
            }
            __typename
            }
            snippetInfo {
            titleSnippet {
                snippetString
                highlights {
                start
                end
                __typename
                }
                __typename
            }
            descriptionSnippet {
                snippetString
                highlights {
                start
                end
                __typename
                }
                __typename
            }
            sageQuerySnippet {
                phrase {
                isCompletePhrase
                numTokens
                phraseType
                startIndex
                __typename
                }
                token {
                token
                dataType
                typeEnum
                __typename
                }
                __typename
            }
            sageQuerySnippetWithHighlights {
                highlights {
                start
                end
                __typename
                }
                phraseType
                phraseValue
                __typename
            }
            __typename
            }
            score
            debugInfo
            resultType
            sageQuery
            __typename
        }
        version
        nextPageOffset
        batchSizeRequired
        isFinalPage
        totalResults
        totalFacetResultCount
        errorCode
        debugInfo {
            fewShotExamples {
            chartType
            formulas {
                name
                expression
                __typename
            }
            id
            mappingId
            nlQuery
            nlQueryConcepts
            sageQuery
            scope
            sql
            tml
            feedbackType
            __typename
            }
            __typename
        }
        __typename
        }

        fragment eurekaAnswer on eureka_AnswerResult {
        header {
            ...header
            __typename
        }
        usageInfo {
            ...usageInfo
            __typename
        }
        preferredViz {
            ...visualizationMetadata
            __typename
        }
        worksheetInfo {
            ...worksheetInfo
            __typename
        }
        formatted {
            phrase {
            isCompletePhrase
            numTokens
            phraseType
            startIndex
            __typename
            }
            token {
            token
            typeEnum
            __typename
            }
            __typename
        }
        __typename
        }

        fragment header on eureka_Header {
        id
        title
        description
        authorGuid
        authorName
        createdOn
        tagIds
        __typename
        }

        fragment usageInfo on eureka_UsageInfo {
        favouriteCount
        viewCount
        __typename
        }

        fragment visualizationMetadata on eureka_VisualizationMetadata {
        vizType
        chartType
        vizSnapshotRequestData {
            parentReportbookGuid
            parentType
            version
            vizGuid
            __typename
        }
        __typename
        }

        fragment worksheetInfo on eureka_WorksheetInfo {
        id
        name
        __typename
        }`;
