const bachSessionId = `
id {
    sessionId
    genNo
    acSession {
        sessionId
        genNo
    }
}
`

export const getUnaggregatedAnswerSession = `
mutation GetUnAggregatedAnswerSession($session: BachSessionIdInput!, $columns: [UserPointSelectionInput!]!) {
    Answer__getUnaggregatedAnswer(session: $session, columns: $columns) {
        ${bachSessionId}
        answer {
            visualizations {
                columns {
                    column {
                        id
                    }
                }
            }
        }
    }
}  
`

export const removeColumns = `
mutation RemoveColumns($session: BachSessionIdInput!, $logicalColumnIds: [GUID!], $columnIds: [GUID!], $updateOnlyPhrases: Boolean!) {
    Answer__removeColumns(
        session: $session
        logicalColumnIds: $logicalColumnIds
        columnIds: $columnIds
        ) {
            ${bachSessionId}
        }
    }
}
    `;


export const addColumns = `
    mutation AddColumns($session: BachSessionIdInput!, $columns: [AnswerColumnInfo!]!, $updateOnlyPhrases: Boolean!) {
        Answer__addColumn(session: $session, columns: $columns) {
            ${bachSessionId}
        }
    }
    `;

export const getAnswerData = `
    query GetTableWithHeadlineData($session: BachSessionIdInput!, $deadline: Int!, $dataPaginationParams: DataPaginationParamsInput!) {
        getAnswer(session: $session) {
            ${bachSessionId}
            answer {
                id
                visualizations {
                    id
                    ... on TableViz {
                        columns {
                            column {
                                id
                                name
                                type
                                aggregationType
                                dataType
                            }
                        }
                        data(deadline: $deadline, pagination: $dataPaginationParams) {
                            columnDataLite {
                                columnId
                                columnDataType
                                dataValue  
                            }
                        }
                    }          
                }
            }
        }
    }
`;

export const getSourceDetail = `
    query GetSourceDetail($ids: [GUID!]!) {
        getSourceDetailById(ids: $ids, type: LOGICAL_TABLE) {
        id
        name
        description
        authorName
        authorDisplayName
        isExternal
        type
        created
        modified
        columns {
            id
            name
            author
            authorDisplayName
            description
            dataType
            type
            modified
            ownerName
            owner
            dataRecency
            sources {
            tableId
            tableName
            columnId
            columnName
            __typename
            }
            synonyms
            cohortAnswerId
            __typename
        }
        relationships
        destinationRelationships
        dataSourceId
        __typename
        }
    }  
`;

const operations = {

}